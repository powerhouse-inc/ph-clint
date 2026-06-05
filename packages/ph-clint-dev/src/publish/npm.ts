import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { PublishTag, ResolvedPackage } from './types.js';

const execFileAsync = promisify(execFile);

/** Stability rank: higher = more stable. */
const STABILITY: Record<PublishTag, number> = { dev: 0, staging: 1, production: 2 };

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
 * Fetch package metadata directly from the registry HTTP API.
 * Bypasses `npm view`'s 404 caching. Rides the registry HTTP cache; a 15s
 * timeout guards against a slow or hung upstream blocking the caller.
 */
export async function fetchPackageMetadata(
  packageName: string,
  registry: string,
): Promise<Record<string, unknown> | null> {
  const base = registry.replace(/\/$/, '');
  const encoded = packageName.startsWith('@')
    ? packageName.replace('/', '%2f')
    : encodeURIComponent(packageName);
  const url = `${base}/${encoded}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Verify that a specific package version exists on the registry.
 * Uses direct HTTP fetch to avoid npm CLI's 404 caching.
 */
export async function verifyVersionOnRegistry(
  packageName: string,
  version: string,
  registry: string,
): Promise<boolean> {
  try {
    const data = await fetchPackageMetadata(packageName, registry);
    if (!data) return false;
    const versions = data.versions as Record<string, unknown> | undefined;
    return !!versions && version in versions;
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
 * Determine whether this publish should also set the `latest` dist-tag.
 *
 * Rules (highest-stability-wins):
 *   - production always gets `latest`
 *   - staging gets `latest` if no production release exists
 *   - dev gets `latest` if no production or staging release exists
 *
 * For brand-new packages (404 from registry), always returns true so that
 * `npm install <pkg>` works immediately after the first publish.
 */
export async function shouldSetLatest(
  packageName: string,
  tag: PublishTag,
  registry: string,
): Promise<boolean> {
  if (tag === 'production') return true;

  const data = await fetchPackageMetadata(packageName, registry);
  if (!data) return true; // New package — first version ever

  const distTags = data['dist-tags'] as Record<string, string> | undefined;
  if (!distTags) return true;

  // Check whether a more-stable channel already owns `latest`
  const latestVer = distTags.latest;
  if (!latestVer) return true; // No latest tag at all

  // A production version has no prerelease segment (e.g. "1.2.3")
  const hasProductionLatest = !/-.+$/.test(latestVer);
  if (hasProductionLatest) return false; // production owns latest, never override

  if (tag === 'staging') {
    // Override latest only if current latest is dev (not staging/production)
    return latestVer.includes('-dev.');
  }

  // tag === 'dev'
  // Override latest only if no staging tag exists and current latest is also dev
  return !distTags.staging && latestVer.includes('-dev.');
}

/**
 * Set the `latest` dist-tag for a package on the registry.
 */
export async function setLatestTag(
  packageName: string,
  version: string,
  registry: string,
): Promise<void> {
  await execFileAsync('npm', [
    'dist-tag', 'add', `${packageName}@${version}`, 'latest',
    '--registry', registry,
  ]);
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
 * After publishing, if no higher-stability release exists on the registry,
 * also sets the `latest` dist-tag so that `npm install <pkg>` works for
 * packages that have only ever had prerelease publishes.
 *
 * Returns which packages succeeded and which failed.
 */
export async function publishAll(
  packages: ResolvedPackage[],
  registry: string,
  tag: PublishTag,
  version: string,
  verbose: boolean,
  log: (msg: string) => void,
): Promise<{ published: string[]; failed: string[] }> {
  const published: string[] = [];
  const failed: string[] = [];

  // Determine if we should also set the `latest` dist-tag after publishing
  const needsLatest = tag !== 'production'
    ? await shouldSetLatest(packages[0].name, tag, registry)
    : false; // production already publishes with --tag latest
  if (needsLatest) {
    log(`  (will also set "latest" dist-tag — no higher-stability release exists)`);
  }

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

  // Set `latest` dist-tag on all successfully published packages
  if (needsLatest && failed.length === 0 && published.length > 0) {
    log('  Setting latest dist-tag...');
    for (const name of published) {
      try {
        await setLatestTag(name, version, registry);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`  ⚠ Failed to set latest tag for ${name}: ${msg}`);
      }
    }
  }

  return { published, failed };
}

/**
 * Verify all published packages are visible on the registry.
 * Run after all packages are published — this is a non-blocking
 * confirmation step that doesn't affect the publish result.
 */
export async function verifyAllPublished(
  packageNames: string[],
  version: string,
  registry: string,
  log: (msg: string) => void,
): Promise<{ verified: string[]; unverified: string[] }> {
  const verified: string[] = [];
  const unverified: string[] = [];

  for (const name of packageNames) {
    const ok = await verifyWithRetry(name, version, registry, log);
    if (ok) {
      verified.push(name);
      log(`  ✓ ${name}@${version}`);
    } else {
      unverified.push(name);
      log(`  ⚠ ${name}@${version} not yet visible (propagation delay)`);
    }
  }

  return { verified, unverified };
}
