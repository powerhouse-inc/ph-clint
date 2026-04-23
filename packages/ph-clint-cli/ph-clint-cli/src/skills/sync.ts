/**
 * External skills synchronisation.
 *
 * Reads the desired external skills from a `ClintProjectSpec`, diffs them
 * against a `.skills-manifest.json` on disk, and runs `git clone` / `rm -rf`
 * to reconcile.  Each external skill ends up as a subdirectory of
 * `prompts/skills-ext/<name>/` so the build-skills pipeline picks it up.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ExternalSkill } from '../spec/types.js';

/** On-disk manifest entry (what is currently installed). */
export interface ManifestEntry {
  name: string;
  githubUrl: string;
}

/** Persisted manifest — a simple JSON array. */
export type SkillsManifest = ManifestEntry[];

const MANIFEST_FILE = '.skills-manifest.json';
const SKILLS_DIR = path.join('prompts', 'skills-ext');

export interface SyncResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface SyncOptions {
  /** Project root (CLI sub-tree when split layout). */
  targetDir: string;
  /** Desired state from the spec. */
  desired: ExternalSkill[];
  /** Optional log callback. */
  log?: (msg: string) => void;
}

function manifestPath(targetDir: string): string {
  return path.join(targetDir, SKILLS_DIR, MANIFEST_FILE);
}

export async function readManifest(
  targetDir: string,
): Promise<SkillsManifest> {
  try {
    const raw = await fs.readFile(manifestPath(targetDir), 'utf8');
    return JSON.parse(raw) as SkillsManifest;
  } catch {
    return [];
  }
}

async function writeManifest(
  targetDir: string,
  manifest: SkillsManifest,
): Promise<void> {
  const file = manifestPath(targetDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function execGit(
  args: string[],
  cwd: string,
): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    if (proc.stderr) {
      proc.stderr.on('data', (d: Buffer) => {
        stderr += d.toString();
      });
    }
    proc.on('close', (code) => resolve({ code: code ?? 1, stderr }));
    proc.on('error', (err) => reject(err));
  });
}

/**
 * Compute the diff between desired (spec) and current (manifest) skills.
 *
 * Pure function — no I/O.
 */
export function diffSkills(
  desired: ExternalSkill[],
  current: SkillsManifest,
): { toAdd: ExternalSkill[]; toRemove: ManifestEntry[]; unchanged: string[] } {
  const desiredMap = new Map(desired.map((s) => [s.name, s]));
  const currentMap = new Map(current.map((s) => [s.name, s]));

  const toAdd: ExternalSkill[] = [];
  const toRemove: ManifestEntry[] = [];
  const unchanged: string[] = [];

  for (const [name, skill] of desiredMap) {
    const existing = currentMap.get(name);
    if (!existing) {
      toAdd.push(skill);
    } else if (existing.githubUrl !== skill.githubUrl) {
      // URL changed — remove old, add new.
      toRemove.push(existing);
      toAdd.push(skill);
    } else {
      unchanged.push(name);
    }
  }

  for (const [name, entry] of currentMap) {
    if (!desiredMap.has(name)) {
      toRemove.push(entry);
    }
  }

  return { toAdd, toRemove, unchanged };
}

/**
 * Synchronise external skills on disk to match the spec.
 *
 * - Clones missing skills via `git clone --depth 1`.
 * - Removes skills no longer in the spec.
 * - Updates the `.skills-manifest.json`.
 */
export async function syncExternalSkills(
  opts: SyncOptions,
): Promise<SyncResult> {
  const { targetDir, desired, log } = opts;
  const skillsDir = path.join(targetDir, SKILLS_DIR);
  await fs.mkdir(skillsDir, { recursive: true });

  const current = await readManifest(targetDir);
  const { toAdd, toRemove, unchanged } = diffSkills(desired, current);

  const result: SyncResult = { added: [], removed: [], unchanged };

  // Remove skills.
  for (const entry of toRemove) {
    const dir = path.join(skillsDir, entry.name);
    log?.(`Removing skill "${entry.name}"…`);
    await fs.rm(dir, { recursive: true, force: true });
    result.removed.push(entry.name);
  }

  // Add skills.
  for (const skill of toAdd) {
    const dir = path.join(skillsDir, skill.name);
    log?.(`Cloning skill "${skill.name}" from ${skill.githubUrl}…`);
    // Ensure the target doesn't exist (re-add after URL change).
    await fs.rm(dir, { recursive: true, force: true });
    const { code, stderr } = await execGit(
      ['clone', '--depth', '1', skill.githubUrl, skill.name],
      skillsDir,
    );
    if (code !== 0) {
      log?.(`Warning: git clone failed for "${skill.name}": ${stderr.trim()}`);
      continue;
    }
    // Remove .git dir — we don't want a nested repo.
    await fs.rm(path.join(dir, '.git'), { recursive: true, force: true });
    result.added.push(skill.name);
  }

  // Write updated manifest.
  const newManifest: SkillsManifest = desired.map((s) => ({
    name: s.name,
    githubUrl: s.githubUrl,
  }));
  await writeManifest(targetDir, newManifest);

  return result;
}
