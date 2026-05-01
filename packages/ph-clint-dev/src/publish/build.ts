import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedPackage } from './types.js';

/**
 * Run a command in a package directory.
 * Returns a promise that resolves on success or rejects on failure.
 */
function runInPackage(
  pkg: ResolvedPackage,
  cmd: string,
  args: string[],
  verbose: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: pkg.absPath,
      stdio: verbose ? 'inherit' : 'pipe',
      shell: false,
    });

    let stderr = '';
    if (!verbose && proc.stderr) {
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${cmd} ${args.join(' ')} failed for ${pkg.name} (exit code ${code})${stderr ? `:\n${stderr}` : ''}`,
          ),
        );
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ${cmd} for ${pkg.name}: ${err.message}`));
    });
  });
}

/**
 * Run `pnpm build` in a package directory.
 */
export function buildPackage(
  pkg: ResolvedPackage,
  verbose: boolean,
): Promise<void> {
  return runInPackage(pkg, 'pnpm', ['build'], verbose);
}

/**
 * Check if a package has ph-cli and a connect script — if so, it's a
 * Powerhouse app that can produce Connect static assets.
 */
function hasConnectBuild(pkg: ResolvedPackage): boolean {
  const scripts = (pkg.packageJson.scripts ?? {}) as Record<string, string>;
  const hasBin = existsSync(join(pkg.absPath, 'node_modules', '.bin', 'ph-cli'));
  return hasBin && 'connect' in scripts;
}

/**
 * Build all packages in order. Aborts on first failure.
 *
 * When a package has intra-group `file:` dependencies on a package that was
 * already built earlier in the list, we run `pnpm install` first so pnpm
 * re-copies the dependency (which now includes its freshly-built `dist/`).
 */
export async function buildAll(
  packages: ResolvedPackage[],
  verbose: boolean,
  log: (msg: string) => void,
  options?: { verifyConnect?: boolean },
): Promise<void> {
  const builtPaths = new Set<string>();

  for (const pkg of packages) {
    // Check if this package has file: deps on packages we just built.
    // If so, pnpm's .pnpm store copy is stale — reinstall to pick up dist/.
    const needsReinstall = pkg.fileDeps.some(
      (dep) => dep.intraGroup && builtPaths.has(dep.resolvedPath),
    );
    if (needsReinstall) {
      log(`  Reinstalling ${pkg.name} (file: deps were rebuilt)...`);
      await runInPackage(pkg, 'pnpm', ['install', '--frozen-lockfile=false'], verbose);
    }

    log(`  Building ${pkg.name}...`);
    await buildPackage(pkg, verbose);

    // App packages with ph-cli: also build Connect static assets into dist/connect/
    if (pkg.entry.category === 'app' && hasConnectBuild(pkg)) {
      log(`  Building Connect assets for ${pkg.name}...`);
      await runInPackage(pkg, 'pnpm', ['connect', 'build', '--outDir', 'dist/connect'], verbose);

      if (options?.verifyConnect) {
        const indexHtml = join(pkg.absPath, 'dist', 'connect', 'index.html');
        if (!existsSync(indexHtml)) {
          throw new Error(
            `Connect build for ${pkg.name} did not produce dist/connect/index.html.\n` +
              `  Expected: ${indexHtml}\n` +
              `  The published package will not work in production without Connect static assets.\n` +
              `  Verify that "pnpm connect build --outDir dist/connect" works in ${pkg.absPath}`,
          );
        }
      }
      log(`  ✓ ${pkg.name} (connect)`);
    }

    log(`  ✓ ${pkg.name}`);
    builtPaths.add(pkg.absPath);
  }
}
