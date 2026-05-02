/**
 * Post-generation side-effects: invoke `ph init` to fill in the reactor
 * package skeleton, and run `pnpm install` in the relevant sub-projects.
 *
 * Both steps are opt-out (flags on the init command) and both tolerate
 * missing binaries — they never fail the init flow, only emit warnings.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { hasCommandOnPath } from './exec.js';
import type { ClintProjectSpec } from '../spec/types.js';
import type { ProcessRunOptions } from '@powerhousedao/ph-clint';

/**
 * Signature for the subprocess runner — matches CommandContext.runProcess.
 */
type RunProcess = (
  command: string,
  opts?: Omit<ProcessRunOptions, 'onOutput'>,
) => Promise<{ success: boolean; output: string }>;

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
  /** Subprocess runner — uses CommandContext.runProcess when available. */
  runProcess?: RunProcess;
  /** Explicit Powerhouse version to pin `ph init` to (tag or semver). */
  phVersion?: string;
}

export interface PhInitResult {
  ran: boolean;
  exitCode?: number;
  reason?: string;
}

/**
 * Detect the installed `ph` CLI version by parsing `ph --version` output.
 * Returns the version string (e.g. '6.0.0-dev.194') or undefined if
 * detection fails.
 */
export function getPhVersion(binName: string): string | undefined {
  try {
    const output = execFileSync(binName, ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
    });
    const match = output.match(/PH CMD version:\s*(\S+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export async function runPhInit(
  options: PhInitOptions,
): Promise<PhInitResult> {
  const log = options.log ?? (() => {});
  const binName = options.binName ?? 'ph';
  const appFolder = path.basename(options.appDir);

  // Guard: never re-init an already-initialized app directory.
  try {
    await fs.access(path.join(options.appDir, 'package.json'));
    log(`App directory ${appFolder} already initialized — skipping ph init.`);
    return { ran: false, reason: 'already-initialized' };
  } catch {
    // No package.json — proceed with init.
  }

  if (!(await hasCommandOnPath(binName))) {
    log(
      `Skipping \`${binName} init\` — \`${binName}\` is not on PATH. ` +
        `Install @powerhousedao/ph-cli and re-run manually inside ${appFolder}/.`,
    );
    return { ran: false, reason: 'ph-not-on-path' };
  }

  // Pin ph init to the same version as the installed ph CLI, so the
  // generated app uses matching Powerhouse packages.
  const phVersion = options.phVersion ?? getPhVersion(binName);
  const tags = ['dev', 'staging', 'latest'];
  const versionArgs = phVersion
    ? tags.includes(phVersion)
      ? [`--${phVersion}`]
      : ['--version', phVersion]
    : ['--dev']; // fallback if detection fails

  // `ph init {name}` creates a fresh directory beside the cwd. Our generator
  // placed a `.gitkeep` + README.md placeholder there; clear it out so
  // ph init has a blank slate to work with.
  await fs.rm(options.appDir, { recursive: true, force: true });

  const args = ['init', appFolder, ...versionArgs, '--pnpm'];
  log(`Running \`${binName} init ${appFolder}\` (version: ${phVersion ?? 'auto'}) in ${options.targetDir} …`);

  const run = options.runProcess;
  if (run) {
    const result = await run(`${binName} ${args.join(' ')}`, {
      cwd: options.targetDir,
      timeout: 300_000, // ph init + pnpm install can be slow
    });
    const exitCode = result.success ? 0 : 1;
    if (!result.success) {
      log(
        `\`${binName} init\` failed. ` +
          'You can re-run it manually after resolving the issue.',
      );
    }
    // Patch scoped name
    await patchScopedName(options, appFolder, log);
    return { ran: true, exitCode };
  }

  // Fallback: direct spawn with stdio inherit (for backward compat / tests without context)
  const { runCommand } = await import('./exec.js');
  const result = await runCommand(binName, args, { cwd: options.targetDir, stdio: 'inherit' });

  if (result.exitCode !== 0) {
    log(
      `\`${binName} init\` exited with code ${result.exitCode}. ` +
        'You can re-run it manually after resolving the issue.',
    );
  }

  await patchScopedName(options, appFolder, log);
  return { ran: true, exitCode: result.exitCode };
}

/**
 * Patch the app `package.json` name to the scoped form (`@scope/name-app`).
 * Called after `ph init` and after name/scope renames.
 *
 * Returns `true` if the file was actually changed.
 */
export async function patchAppPackageName(
  appDir: string,
  spec: { name: string; scope?: string },
  log?: (msg: string) => void,
): Promise<boolean> {
  const appFolder = path.basename(appDir);
  const scopedName = spec.scope
    ? `@${spec.scope}/${appFolder}`
    : appFolder;
  const appPkgJsonPath = path.join(appDir, 'package.json');
  try {
    const raw = await fs.readFile(appPkgJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    if (pkg.name !== scopedName) {
      pkg.name = scopedName;
      if (spec.scope) {
        pkg.publishConfig = { access: 'public' };
      }
      await fs.writeFile(appPkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      log?.(`Patched app package name to ${scopedName}`);
      return true;
    }
    return false;
  } catch (err) {
    log?.(
      `Warning: could not patch app package name: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

async function patchScopedName(options: PhInitOptions, _appFolder: string, log: (msg: string) => void): Promise<void> {
  await patchAppPackageName(options.appDir, options.spec, log);
}

/**
 * Run `ph install <packages> --local --pnpm` in the app directory to register
 * external packages in `powerhouse.config.json`.
 */
export async function runPhInstallPackages(options: {
  appDir: string;
  packages: string[];
  log?: (msg: string) => void;
  runProcess?: RunProcess;
}): Promise<boolean> {
  const { appDir, packages, log = () => {}, runProcess } = options;
  const binName = 'ph';

  if (!(await hasCommandOnPath(binName))) {
    log(`Skipping — \`${binName}\` is not on PATH.`);
    return false;
  }

  const args = ['install', ...packages, '--local', '--pnpm'];
  log(
    `Running \`${binName} install ${packages.join(' ')} --local\` in ${path.basename(appDir)} …`,
  );

  if (runProcess) {
    const result = await runProcess(`${binName} ${args.join(' ')}`, {
      cwd: appDir,
      timeout: 300_000,
    });
    return result.success;
  }

  const { runCommand } = await import('./exec.js');
  const result = await runCommand(binName, args, {
    cwd: appDir,
    stdio: 'inherit',
  });
  return result.exitCode === 0;
}

export interface PnpmInstallOptions {
  /** Directories to run `pnpm install` in, in order. */
  dirs: string[];
  log?: (msg: string) => void;
  /** Override `pnpm` binary name (for tests). */
  binName?: string;
  /** Subprocess runner — uses CommandContext.runProcess when available. */
  runProcess?: RunProcess;
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

    const run = options.runProcess;
    if (run) {
      const result = await run(`${binName} install`, {
        cwd: dir,
        timeout: 300_000,
      });
      if (!result.success) {
        log(
          `\`${binName} install\` failed in ${dir}. ` +
            'Retry manually once the underlying issue is resolved.',
        );
      }
    } else {
      const { runCommand } = await import('./exec.js');
      const result = await runCommand(binName, ['install'], {
        cwd: dir,
        stdio: 'inherit',
      });
      if (result.exitCode !== 0) {
        log(
          `\`${binName} install\` exited with code ${result.exitCode} in ${dir}. ` +
            'Retry manually once the underlying issue is resolved.',
        );
      }
    }
    ran.push(dir);
  }
  return { ran, skipped: [] };
}
