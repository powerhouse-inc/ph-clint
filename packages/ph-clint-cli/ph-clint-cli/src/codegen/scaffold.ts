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

  log(`Running \`${binName} init ${appFolder}\` (version: ${phVersion ?? 'auto'}) in ${options.targetDir} …`);
  const result = await runCommand(
    binName,
    [
      'init',
      appFolder,
      ...versionArgs,
      '--pnpm',
    ],
    { cwd: options.targetDir, stdio: options.stdio ?? 'inherit' },
  );

  if (result.exitCode !== 0) {
    log(
      `\`${binName} init\` exited with code ${result.exitCode}. ` +
        'You can re-run it manually after resolving the issue.',
    );
  }

  // ph init creates an unscoped package name. If the spec has a scope, patch
  // the app's package.json to use the scoped name so `file:` deps and publish
  // both resolve correctly. Run even on non-zero exit — ph init may have
  // partially succeeded and created package.json.
  if (options.spec.scope) {
    const appPkgJsonPath = path.join(options.appDir, 'package.json');
    try {
      const raw = await fs.readFile(appPkgJsonPath, 'utf8');
      const pkg = JSON.parse(raw);
      const scopedName = `@${options.spec.scope}/${appFolder}`;
      if (pkg.name !== scopedName) {
        pkg.name = scopedName;
        pkg.publishConfig = { access: 'public' };
        await fs.writeFile(appPkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
        log(`Patched app package name to ${scopedName}`);
      }
    } catch (err) {
      log(
        `Warning: could not patch app package name: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
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
