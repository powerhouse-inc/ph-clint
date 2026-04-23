import { spawn } from 'node:child_process';
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
    log(`  ✓ ${pkg.name}`);
    builtPaths.add(pkg.absPath);
  }
}
