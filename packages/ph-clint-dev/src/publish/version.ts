import type { PublishTag } from './types.js';
import { fetchPackageMetadata } from './npm.js';

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SEMVER_PRE_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\w.]+))?$/;

/** Parse a semver string into [major, minor, patch]. Returns null if invalid. */
export function parseSemver(
  version: string,
): [number, number, number] | null {
  const m = SEMVER_RE.exec(version);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Check if a string is a valid base semver (no prerelease). */
export function isValidSemver(version: string): boolean {
  return SEMVER_RE.test(version);
}

/** Check if a string is valid semver (optionally with prerelease). */
export function isValidSemverWithPre(version: string): boolean {
  return SEMVER_PRE_RE.test(version);
}

/**
 * Validate that newVersion is a valid bump from currentVersion.
 * Returns an array of issues. Empty means valid.
 */
export function validateBump(
  currentVersion: string,
  newVersion: string,
): string[] {
  const issues: string[] = [];

  if (!isValidSemver(newVersion)) {
    issues.push(`"${newVersion}" is not valid semver (expected M.m.p)`);
    return issues;
  }

  const cur = parseSemver(currentVersion);
  const next = parseSemver(newVersion);
  if (!cur || !next) {
    issues.push(`Cannot parse versions: "${currentVersion}" → "${newVersion}"`);
    return issues;
  }

  // Must be strictly greater
  const curNum = cur[0] * 1_000_000 + cur[1] * 1_000 + cur[2];
  const nextNum = next[0] * 1_000_000 + next[1] * 1_000 + next[2];

  if (nextNum <= curNum) {
    issues.push(
      `New version ${newVersion} must be greater than current ${currentVersion}`,
    );
  }

  return issues;
}

/**
 * Compute the published version string for a given tag and base version.
 * For dev/staging, queries the registry for the latest prerelease number.
 */
export function computeVersion(
  baseVersion: string,
  tag: PublishTag,
  latestPrerelease: number | null,
): string {
  if (tag === 'production') {
    return baseVersion;
  }
  const n = latestPrerelease === null ? 0 : latestPrerelease + 1;
  return `${baseVersion}-${tag}.${n}`;
}

/**
 * Query the npm registry for the latest prerelease number for a given
 * package, base version, and tag.
 *
 * Uses direct HTTP fetch against the registry API to avoid npm CLI's
 * aggressive 404 caching for new/unpublished packages.
 *
 * Returns the highest N from `{baseVersion}-{tag}.N`, or null if none found.
 */
export async function queryLatestPrerelease(
  packageName: string,
  baseVersion: string,
  tag: PublishTag,
  registry: string,
): Promise<number | null> {
  try {
    const data = await fetchPackageMetadata(packageName, registry);
    const versions = data?.versions as Record<string, unknown> | undefined;
    if (!versions) return null;

    const prefix = `${baseVersion}-${tag}.`;
    let max: number | null = null;

    for (const v of Object.keys(versions)) {
      if (v.startsWith(prefix)) {
        const n = Number(v.slice(prefix.length));
        if (!Number.isNaN(n) && (max === null || n > max)) {
          max = n;
        }
      }
    }

    return max;
  } catch {
    // Package not found on registry or network error — start from 0
    return null;
  }
}
