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
        // Always capture stderr so we can detect "already published" errors.
        stdio: verbose ? ['ignore', 'inherit', 'pipe'] : 'pipe',
        shell: false,
      },
    );

    let stderr = '';
    if (proc.stderr) {
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
 * immediately after `npm publish` returns, especially for new packages
 * which can take up to several minutes to propagate.
 *
 * Default schedule: 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s (~242s max wait).
 */
export async function verifyWithRetry(
  packageName: string,
  version: string,
  registry: string,
  log: (msg: string) => void,
  maxAttempts = 8,
): Promise<boolean> {
  let delay = 2_000;
  const maxDelay = 60_000;
  for (let i = 0; i < maxAttempts; i++) {
    if (await verifyVersionOnRegistry(packageName, version, registry)) {
      return true;
    }
    if (i < maxAttempts - 1) {
      log(`    waiting ${delay / 1000}s for registry propagation...`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, maxDelay);
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
          // The publish command succeeded, so the package is on the registry
          // even if verification can't see it yet. Treat as published.
          log(`  ⚠ ${pkg.name}: published but not yet visible on registry (propagation delay)`);
        }
      }

      published.push(pkg.name);
      log(`  ✓ ${pkg.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // npm returns 403 "You cannot publish over the previously published
      // versions" when a version already exists. Treat this as already-published
      // (the pre-publish `npm view` check can miss it during propagation).
      if (msg.includes('previously published version') || msg.includes('cannot publish over')) {
        published.push(pkg.name);
        log(`  ⊘ ${pkg.name} (already published, skipping)`);
        continue;
      }
      failed.push(pkg.name);
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
