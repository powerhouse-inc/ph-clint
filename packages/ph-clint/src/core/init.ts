import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Command, CommandContext, WorkdirStore } from './types.js';

/**
 * Options for installSkills.
 */
export interface InstallSkillsOptions {
  /** WorkdirStore — used to compute the target `.mastra/skills/` folder. */
  store: WorkdirStore;
  /** Candidate directories containing built skill folders. First existing wins. */
  skillSources: string[];
  /** Optional output callback. Default: console.log. */
  stdout?: (text: string) => void;
}

/**
 * Copy pre-packaged skill folders into the store's `.mastra/skills/` directory.
 *
 * Iterates `skillSources` and uses the first directory that exists.
 * Clears the target before copying to avoid stale skills.
 * Each skill folder is expected to contain at least a `SKILL.md` file.
 *
 * @returns The number of skill folders copied, or 0 if no source was found.
 */
export function installSkills(options: InstallSkillsOptions): number {
  const { store, skillSources, stdout = console.log } = options;
  const targetDir = store.getStoreFolder('.mastra/skills');

  // Find first existing source directory
  const source = skillSources.find(s => fs.existsSync(s));
  if (!source) {
    stdout('[init] No skill source directory found — skipping skill installation');
    return 0;
  }

  stdout(`[init] Installing skills from ${source}`);

  // Read skill subdirectories
  const skillDirs = fs.readdirSync(source, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (skillDirs.length === 0) {
    stdout('[init] No skill folders found in source — skipping');
    return 0;
  }

  // Clear target before copying
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  let totalFiles = 0;
  for (const skillName of skillDirs) {
    const src = path.join(source, skillName);
    const dest = path.join(targetDir, skillName);
    fs.mkdirSync(dest, { recursive: true });

    const files = fs.readdirSync(src).filter(f =>
      fs.statSync(path.join(src, f)).isFile(),
    );
    for (const file of files) {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    }
    totalFiles += files.length;
  }

  stdout(`[init] Installed ${skillDirs.length} skills (${totalFiles} files)`);
  return skillDirs.length;
}

/**
 * Options for createInitCommand.
 */
export interface InitCommandOptions {
  /** Candidate skill source directories. */
  skillSources: string[];
}

/**
 * Create the built-in `init` command.
 *
 * Creates the store directories and installs pre-packaged skills.
 * Idempotent — safe to run multiple times.
 */
export function createInitCommand(opts: InitCommandOptions): Command {
  const inputSchema = z.object({});

  return {
    id: 'init',
    description: 'Initialize the CLI workspace (create store, install skills)',
    inputSchema,
    execute: async (_input, context: CommandContext) => {
      const { workspace: store, stdout = console.log } = context;
      const lines: string[] = [];
      const log = (msg: string) => {
        lines.push(msg);
        stdout(msg);
      };

      // Ensure store root exists
      const rootFolder = store.getStoreFolder();
      fs.mkdirSync(rootFolder, { recursive: true });
      log(`[init] Store: ${rootFolder}`);

      // Ensure .mastra/db/ exists
      const dbFolder = store.getStoreFolder('.mastra/db');
      fs.mkdirSync(dbFolder, { recursive: true });

      // Install pre-packaged skills
      const count = installSkills({
        store,
        skillSources: opts.skillSources,
        stdout: log,
      });

      if (count === 0) {
        log('[init] Workspace initialized (no skills to install)');
      } else {
        log('[init] Workspace initialized');
      }

      return { text: lines.join('\n') };
    },
  };
}
