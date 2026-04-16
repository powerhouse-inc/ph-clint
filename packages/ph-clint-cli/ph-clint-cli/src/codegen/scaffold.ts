/**
 * Post-generation side-effects: invoke `ph init` to fill in the reactor
 * package skeleton, and run `pnpm install` in the relevant sub-projects.
 *
 * Both steps are opt-out (flags on the init command) and both tolerate
 * missing binaries — they never fail the init flow, only emit warnings.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { hasCommandOnPath, runCommand } from './exec.js';
import type { ClintProjectSpec } from '../spec/types.js';

export interface PhInitOptions {
  /** Absolute path to the project root. */
  targetDir: string;
  /** Absolute path to `{targetDir}/{name}-app` (exists with our placeholder). */
  appDir: string;
  spec: ClintProjectSpec;
  /** Logger; defaults to noop. */
  log?: (msg: string) => void;
  /** Override `ph` binary name (for tests). */
  binName?: string;
  /** Stdio passthrough (tests pass 'ignore'). */
  stdio?: 'inherit' | 'ignore';
}

export interface PhInitResult {
  ran: boolean;
  exitCode?: number;
  reason?: string;
}

export async function runPhInit(
  options: PhInitOptions,
): Promise<PhInitResult> {
  const log = options.log ?? (() => {});
  const binName = options.binName ?? 'ph';
  const appFolder = path.basename(options.appDir);

  if (!(await hasCommandOnPath(binName))) {
    log(
      `Skipping \`${binName} init\` — \`${binName}\` is not on PATH. ` +
        `Install @powerhousedao/ph-cli and re-run manually inside ${appFolder}/.`,
    );
    return { ran: false, reason: 'ph-not-on-path' };
  }

  // `ph init {name}` creates a fresh directory beside the cwd. Our generator
  // placed a `.gitkeep` + README.md placeholder there; clear it out so
  // ph init has a blank slate to work with.
  await fs.rm(options.appDir, { recursive: true, force: true });

  log(`Running \`${binName} init ${appFolder}\` in ${options.targetDir} …`);
  const result = await runCommand(
    binName,
    [
      'init',
      appFolder,
      '--pnpm',
      '--dev',
    ],
    { cwd: options.targetDir, stdio: options.stdio ?? 'inherit' },
  );

  if (result.exitCode !== 0) {
    log(
      `\`${binName} init\` exited with code ${result.exitCode}. ` +
        'You can re-run it manually after resolving the issue.',
    );
  }

  return { ran: true, exitCode: result.exitCode };
}

export interface PnpmInstallOptions {
  /** Directories to run `pnpm install` in, in order. */
  dirs: string[];
  log?: (msg: string) => void;
  /** Override `pnpm` binary name (for tests). */
  binName?: string;
  stdio?: 'inherit' | 'ignore';
}

export interface PnpmInstallResult {
  ran: string[];
  skipped: string[];
  reason?: string;
}

export async function runPnpmInstall(
  options: PnpmInstallOptions,
): Promise<PnpmInstallResult> {
  const log = options.log ?? (() => {});
  const binName = options.binName ?? 'pnpm';

  if (!(await hasCommandOnPath(binName))) {
    log(
      `Skipping \`${binName} install\` — \`${binName}\` is not on PATH. ` +
        'Install pnpm and re-run manually.',
    );
    return { ran: [], skipped: options.dirs, reason: 'pnpm-not-on-path' };
  }

  const ran: string[] = [];
  for (const dir of options.dirs) {
    log(`Running \`${binName} install\` in ${dir} …`);
    const result = await runCommand(binName, ['install'], {
      cwd: dir,
      stdio: options.stdio ?? 'inherit',
    });
    if (result.exitCode !== 0) {
      log(
        `\`${binName} install\` exited with code ${result.exitCode} in ${dir}. ` +
          'Retry manually once the underlying issue is resolved.',
      );
      // Don't abort the whole chain — subsequent dirs may still work.
    }
    ran.push(dir);
  }
  return { ran, skipped: [] };
}
