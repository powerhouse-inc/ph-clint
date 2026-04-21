import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { PublishTag, ResolvedPackage } from './types.js';

const execFileAsync = promisify(execFile);

/**
 * Check npm authentication with the given registry.
 * Throws with a helpful message if not authenticated.
 */
export async function checkNpmAuth(registry: string): Promise<void> {
  try {
    await execFileAsync('npm', ['whoami', '--registry', registry]);
  } catch {
    throw new Error(
      `Not authenticated with registry ${registry}.\n` +
        `Run: npm adduser --registry ${registry}`,
    );
  }
}

/**
 * Verify that a specific package version exists on the registry.
 *
 * IMPORTANT: `npm view pkg@version version` returns exit code 0 even when
 * the specific version doesn't exist — it only errors if the package itself
 * has never been published. We must check the stdout content, not just the
 * exit code.
 */
export async function verifyVersionOnRegistry(
  packageName: string,
  version: string,
  registry: string,
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('npm', [
      'view',
      `${packageName}@${version}`,
      'version',
      '--registry',
      registry,
    ]);
    // stdout is empty (or whitespace) when the package exists but that
    // specific version does not. Only trust it if the output matches.
    return stdout.trim() === version;
  } catch {
    return false;
  }
}

/**
 * Run `npm pack --dry-run` to validate a package tarball.
 */
export async function packDryRun(
  packageDir: string,
  verbose: boolean,
): Promise<void> {
  try {
    await execFileAsync('npm', ['pack', '--dry-run'], {
      cwd: packageDir,
      // npm pack --dry-run output goes to stdout
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`npm pack --dry-run failed in ${packageDir}: ${msg}`);
  }
}

/**
 * Publish a single package to the registry.
 */
export function publishPackage(
  pkg: ResolvedPackage,
  registry: string,
  tag: PublishTag,
  verbose: boolean,
): Promise<void> {
  const distTag = tag === 'production' ? 'latest' : tag;
  const args = ['publish', '--registry', registry, '--tag', distTag];

  // Scoped packages default to restricted on npm — always publish as public
  if (pkg.name.startsWith('@')) {
    args.push('--access', 'public');
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('npm', args,
      {
        cwd: pkg.absPath,
        stdio: verbose ? 'inherit' : 'pipe',
        shell: false,
      },
    );

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
            `Publish failed for ${pkg.name} (exit code ${code})${stderr ? `:\n${stderr}` : ''}`,
          ),
        );
      }
    });

    proc.on('error', (err) => {
      reject(
        new Error(`Failed to spawn publish for ${pkg.name}: ${err.message}`),
      );
    });
  });
}

/**
 * Verify a version exists on the registry with exponential backoff.
 * The registry is eventually consistent — a version may not be queryable
 * immediately after `npm publish` returns.
 *
 * Attempts: 1s, 2s, 4s, 8s, 16s (total ~31s max wait).
 */
export async function verifyWithRetry(
  packageName: string,
  version: string,
  registry: string,
  log: (msg: string) => void,
  maxAttempts = 5,
): Promise<boolean> {
  let delay = 1_000;
  for (let i = 0; i < maxAttempts; i++) {
    if (await verifyVersionOnRegistry(packageName, version, registry)) {
      return true;
    }
    if (i < maxAttempts - 1) {
      log(`    waiting ${delay / 1000}s for registry propagation...`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return false;
}

/**
 * Publish all packages in order.
 * Returns which packages succeeded and which failed.
 *
 * When `verify` is true (default), each package is confirmed on the
 * registry after publish using exponential backoff.
 */
export async function publishAll(
  packages: ResolvedPackage[],
  registry: string,
  tag: PublishTag,
  version: string,
  verbose: boolean,
  log: (msg: string) => void,
  verify = true,
): Promise<{ published: string[]; failed: string[] }> {
  const published: string[] = [];
  const failed: string[] = [];

  for (const pkg of packages) {
    // Skip packages already published at this version (recovery from partial failure)
    const alreadyPublished = await verifyVersionOnRegistry(
      pkg.name,
      version,
      registry,
    );
    if (alreadyPublished) {
      published.push(pkg.name);
      log(`  ⊘ ${pkg.name} (already published, skipping)`);
      continue;
    }

    try {
      log(`  Publishing ${pkg.name}...`);
      await publishPackage(pkg, registry, tag, verbose);

      if (verify) {
        const confirmed = await verifyWithRetry(pkg.name, version, registry, log);
        if (!confirmed) {
          failed.push(pkg.name);
          log(`  ✗ ${pkg.name}: published but not found on registry after verification`);
          log(
            `\n  The registry may be slow to propagate. Re-run to retry.` +
              `\n  Use --no-verify to skip post-publish verification.`,
          );
          break;
        }
      }

      published.push(pkg.name);
      log(`  ✓ ${pkg.name}`);
    } catch (err) {
      failed.push(pkg.name);
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ ${pkg.name}: ${msg}`);
      log(
        `\n  Fix the issue and re-run the same command to resume.` +
          `\n  Already-published packages will be skipped automatically.`,
      );
      break; // Stop on first failure
    }
  }

  return { published, failed };
}
