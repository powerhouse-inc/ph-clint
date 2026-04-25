/**
 * Shared helpers for codegen-permutation e2e tests.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { type ClintProjectSpec } from '../../src/spec/types.js';
import { runPhInit } from '../../src/codegen/scaffold.js';

/**
 * All test output goes under `packages/tmp/codegen-e2e/`. Sibling to the
 * local framework packages, so `file:../ph-clint` just works — no fragile
 * `../../../../` paths.
 */
const PACKAGES_DIR = path.resolve(import.meta.dirname, '../../../..');
const TMP_BASE = path.join(PACKAGES_DIR, 'tmp', 'codegen-e2e');
const LOCAL_PACKAGES: Record<string, string> = {
  '@powerhousedao/ph-clint': path.join(PACKAGES_DIR, 'ph-clint'),
  '@powerhousedao/ph-clint-dev': path.join(PACKAGES_DIR, 'ph-clint-dev'),
};

export async function mkTmpDir(label: string): Promise<string> {
  await fs.mkdir(TMP_BASE, { recursive: true });
  return fs.mkdtemp(path.join(TMP_BASE, `${label}-`));
}

export async function rmRf(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively list all files under `dir`, returning paths relative to `dir`.
 * Excludes `.ph/`, `node_modules/`, and `dist/` directories.
 */
export async function fileTree(dir: string): Promise<string[]> {
  const results: string[] = [];
  const SKIP = new Set(['.ph', 'node_modules', 'dist']);

  async function walk(current: string, rel: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) await walk(path.join(current, entry.name), relPath);
      } else {
        results.push(relPath);
      }
    }
  }

  await walk(dir, '');
  return results.sort();
}

/**
 * Rewrite `@powerhousedao/ph-clint` and `@powerhousedao/ph-clint-dev`
 * dependency versions to `file:` references pointing at the local packages.
 *
 * This lets the e2e tests install + build against the working-tree versions
 * of the framework instead of pulling from the npm registry.
 *
 * Handles both flat layout (single package.json) and split layout
 * (root package.json + {name}-cli/package.json).
 */
export async function rewriteLocalDeps(
  projectDir: string,
  spec: ClintProjectSpec,
): Promise<void> {
  const isSplit = spec.features.powerhouse !== 'Disabled';

  const cliPkgPath = isSplit
    ? path.join(projectDir, `${spec.name}-cli`, 'package.json')
    : path.join(projectDir, 'package.json');

  await rewritePkgJson(cliPkgPath);
}

async function rewritePkgJson(pkgJsonPath: string): Promise<void> {
  const raw = await fs.readFile(pkgJsonPath, 'utf8');
  const pkg = JSON.parse(raw) as Record<string, Record<string, string>>;

  for (const section of ['dependencies', 'devDependencies'] as const) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, localPath] of Object.entries(LOCAL_PACKAGES)) {
      if (deps[name] && !deps[name].startsWith('file:')) {
        deps[name] = `file:${localPath}`;
      }
    }
  }

  await fs.writeFile(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

/**
 * Scaffold the app package via `ph init`, install its deps, and build it.
 *
 * pnpm's `file:` protocol copies at install time, so the app's `dist/`
 * must exist BEFORE the CLI runs `pnpm install`. Flow:
 *   ph init → pnpm install (app) → pnpm build (app)
 */
export async function scaffoldAppPackage(
  projectDir: string,
  spec: ClintProjectSpec,
): Promise<void> {
  if (spec.features.powerhouse === 'Disabled') return;

  const appDir = path.join(projectDir, `${spec.name}-app`);
  await runPhInit({
    targetDir: projectDir,
    appDir,
    spec,
    stdio: 'ignore',
  });
  // ph init runs pnpm install internally, so deps are already there.
  // Build the app so dist/ exists for the CLI's file: dep copy.
  execSync('pnpm build', {
    cwd: appDir,
    encoding: 'utf8',
    timeout: 120_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/**
 * Initialise a git repo and commit all files. Required for flat→split
 * migration which refuses to run on a dirty repo.
 */
export function gitInit(dir: string): void {
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 'test@test'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  spawnSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: dir });
}

export function gitCommitAll(dir: string, message: string): void {
  spawnSync('git', ['add', '-A'], { cwd: dir });
  spawnSync('git', ['commit', '-q', '-m', message], { cwd: dir });
}

/**
 * Run `pnpm install` in the given directory.
 * Throws with combined stdout+stderr on failure for debuggability.
 */
export function pnpmInstall(dir: string): string {
  try {
    return execSync('pnpm install --no-frozen-lockfile', {
      cwd: dir,
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    throw new Error(
      `pnpm install failed in ${dir}\n` +
        `stdout: ${e.stdout ?? ''}\n` +
        `stderr: ${e.stderr ?? ''}`,
    );
  }
}

/**
 * Run `tsc` in the given directory. Uses tsc directly rather than
 * `pnpm build` to avoid the build:skills step which has its own
 * dependency chain that isn't relevant for codegen validation.
 * Throws with combined stdout+stderr on failure for debuggability.
 */
export function tscBuild(dir: string): string {
  try {
    return execSync('npx tsc', {
      cwd: dir,
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    throw new Error(
      `tsc failed in ${dir}\n` +
        `stdout: ${e.stdout ?? ''}\n` +
        `stderr: ${e.stderr ?? ''}`,
    );
  }
}

/**
 * Run `node dist/main.js --help` and return the output.
 * Invokes node directly to avoid pnpm swallowing flags.
 */
export function runHelp(cliDir: string): string {
  try {
    return execSync('node dist/main.js --help', {
      cwd: cliDir,
      encoding: 'utf8',
      timeout: 15_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    // Commander's exitOverride may cause a non-zero exit; the help text
    // is still in stdout.
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout ?? '') + (e.stderr ?? '');
  }
}
