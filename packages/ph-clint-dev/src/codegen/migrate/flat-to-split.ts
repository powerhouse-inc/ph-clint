/**
 * One-shot migration that runs when a project's spec flips
 * `features.powerhouse.enabled` from `false` to `true`. It reshapes the
 * on-disk layout from flat (everything at the project root) to split
 * (`{name}-cli/` + `{name}-app/` siblings).
 *
 * The follow-up update-mode regeneration then fills in the correct content
 * for each file in its new location — so this migration only moves bytes
 * around. Content updates belong to the generator.
 *
 * `node_modules` is deliberately NOT moved — pnpm `file:` protocol uses
 * symlinks that do not survive a cross-directory rename cleanly. Callers
 * should re-run `pnpm install` after the migration.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  type ClintProjectSpec,
  getAppFolderName,
  getCliFolderName,
} from '../../spec/types.js';
import { readHashes, writeHashes, type HashRecord } from '../hashes.js';

export interface FlatToSplitOptions {
  targetDir: string;
  spec: ClintProjectSpec;
  /** Bypass the git-dirty guard. */
  force?: boolean;
  /** Optional warn sink for non-fatal messages. */
  onWarn?: (msg: string) => void;
}

export interface FlatToSplitResult {
  movedEntries: string[];
  cliDir: string;
  appDir: string;
}

/** Entries we never move during a flat → split migration. */
function isUnmovable(entry: string, cliFolder: string, appFolder: string): boolean {
  if (entry === '.git') return true;
  if (entry === '.ph') return true;
  if (entry === 'README.md') return true;
  if (entry === 'node_modules') return true;
  if (entry === cliFolder) return true;
  if (entry === appFolder) return true;
  return false;
}

/**
 * Guard: if the target is a git repo with a dirty working tree, refuse to
 * migrate unless `force`. We never want to discard uncommitted edits.
 * Resolves to `null` when the dir is not a git repo.
 */
async function gitDirty(dir: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('git', ['status', '--porcelain'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout?.on('data', (d: Buffer) => {
      out += d.toString();
    });
    child.once('error', () => resolve(null));
    child.once('close', (code) => {
      if (code !== 0) resolve(null);
      else resolve(out.trim() || null);
    });
  });
}

export async function migrateFlatToSplit(
  options: FlatToSplitOptions,
): Promise<FlatToSplitResult> {
  const { targetDir, spec } = options;
  const cliFolder = getCliFolderName(spec);
  const appFolder = getAppFolderName(spec);
  const cliDir = path.join(targetDir, cliFolder);
  const appDir = path.join(targetDir, appFolder);

  if (!options.force) {
    const dirty = await gitDirty(targetDir);
    if (dirty) {
      throw new Error(
        `refusing to migrate flat → split: ${targetDir} has uncommitted changes.\n` +
          'Commit or stash first, or re-run with --force.',
      );
    }
  }

  // Create the CLI destination. If it already exists and is non-empty we
  // treat that as a malformed state and bail — a previous migration probably
  // got interrupted.
  await fs.mkdir(cliDir, { recursive: true });
  const cliExisting = await fs.readdir(cliDir);
  if (cliExisting.length > 0) {
    throw new Error(
      `cannot migrate: ${cliDir} already exists and is non-empty. ` +
        'Resolve manually before re-running.',
    );
  }

  const entries = await fs.readdir(targetDir);
  const moved: string[] = [];
  for (const entry of entries) {
    if (isUnmovable(entry, cliFolder, appFolder)) {
      if (entry === 'node_modules' && options.onWarn) {
        options.onWarn(
          'skipped node_modules during flat → split migration; re-run `pnpm install`.',
        );
      }
      continue;
    }
    const src = path.join(targetDir, entry);
    const dst = path.join(cliDir, entry);
    await fs.rename(src, dst);
    moved.push(entry);
  }

  // Rekey stored hashes so they still line up with the moved paths.
  await rekeyHashes(targetDir, moved, cliFolder);

  // Create the app folder with a placeholder so tooling (git, `ph init`) can
  // find it. The generator and/or `ph init` fills in the real contents.
  await fs.mkdir(appDir, { recursive: true });

  return { movedEntries: moved, cliDir, appDir };
}

async function rekeyHashes(
  targetDir: string,
  movedEntries: string[],
  cliFolder: string,
): Promise<void> {
  const before = await readHashes(targetDir);
  if (Object.keys(before).length === 0) return;
  const movedSet = new Set(movedEntries);
  const after: HashRecord = {};
  for (const [key, hash] of Object.entries(before)) {
    const top = key.split(/[\\/]/)[0];
    if (movedSet.has(top)) {
      after[path.posix.join(cliFolder, key)] = hash;
    } else {
      after[key] = hash;
    }
  }
  await writeHashes(targetDir, after);
}
