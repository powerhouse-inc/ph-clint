import fs from 'node:fs';
import path from 'node:path';

export type ProjectLayout =
  | { type: 'flat'; root: string; cli: string }
  | { type: 'split'; root: string; cli: string; app: string };

/**
 * Detect project layout starting from `startDir`.
 *
 * Split layout: directory contains {name}-cli/ and {name}-app/ subdirectories
 * where {name}-cli/package.json has @powerhousedao/ph-clint in dependencies.
 *
 * Flat layout: startDir itself has package.json with @powerhousedao/ph-clint
 * in dependencies.
 *
 * Walks up to find the project root if startDir is inside a sub-package.
 */
export function detectLayout(startDir: string): ProjectLayout | null {
  const resolved = path.resolve(startDir);

  // 1. Check if startDir has *-cli/ and *-app/ subdirectories → split
  const splitResult = checkSplitLayout(resolved);
  if (splitResult) return splitResult;

  // 2. Check if parent has *-cli/ matching startDir's basename → split
  //    (Must check before flat, so that being inside a cli sub-package
  //    of a split layout is detected correctly.)
  const parent = path.dirname(resolved);
  if (parent !== resolved) {
    const parentSplit = checkSplitLayout(parent);
    if (parentSplit) return parentSplit;
  }

  // 3. Check if startDir itself has ph-clint in deps → flat
  if (hasPhClintDep(resolved)) {
    return { type: 'flat', root: resolved, cli: resolved };
  }

  // 4. Walk up further (one more level)
  const grandparent = path.dirname(parent);
  if (grandparent !== parent) {
    const gpSplit = checkSplitLayout(grandparent);
    if (gpSplit) return gpSplit;
  }

  return null;
}

function checkSplitLayout(dir: string): ProjectLayout | null {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const cliDirs = entries.filter((e) => e.endsWith('-cli'));
  for (const cliDir of cliDirs) {
    const base = cliDir.slice(0, -4); // strip '-cli'
    const appDir = `${base}-app`;
    if (!entries.includes(appDir)) continue;

    const cliPath = path.join(dir, cliDir);
    const appPath = path.join(dir, appDir);

    // Verify cli dir has ph-clint in deps
    if (hasPhClintDep(cliPath)) {
      return { type: 'split', root: dir, cli: cliPath, app: appPath };
    }
  }

  return null;
}

function hasPhClintDep(dir: string): boolean {
  const pkgJsonPath = path.join(dir, 'package.json');
  try {
    const raw = fs.readFileSync(pkgJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};
    return (
      '@powerhousedao/ph-clint' in deps ||
      '@powerhousedao/ph-clint' in devDeps
    );
  } catch {
    return false;
  }
}
