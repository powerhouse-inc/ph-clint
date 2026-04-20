import { spawn } from 'node:child_process';
import type { ResolvedPackage } from './types.js';

/**
 * Run `pnpm build` in a package directory.
 * Returns a promise that resolves on success or rejects on failure.
 */
export function buildPackage(
  pkg: ResolvedPackage,
  verbose: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pnpm', ['build'], {
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
            `Build failed for ${pkg.name} (exit code ${code})${stderr ? `:\n${stderr}` : ''}`,
          ),
        );
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn build for ${pkg.name}: ${err.message}`));
    });
  });
}

/**
 * Build all packages in order. Aborts on first failure.
 */
export async function buildAll(
  packages: ResolvedPackage[],
  verbose: boolean,
  log: (msg: string) => void,
): Promise<void> {
  for (const pkg of packages) {
    log(`  Building ${pkg.name}...`);
    await buildPackage(pkg, verbose);
    log(`  ✓ ${pkg.name}`);
  }
}
