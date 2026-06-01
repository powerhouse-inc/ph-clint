import fs from 'node:fs';
import path from 'node:path';
import type { FileDep, ResolvedPackage } from './types.js';

/**
 * Analyze file:, workspace:, and catalog: dependencies in a package.json.
 * Classifies each as intra-group or external.
 */
export function analyzeFileDeps(
  packageDir: string,
  packageJson: Record<string, unknown>,
  groupPackagePaths: string[],
): FileDep[] {
  const deps: FileDep[] = [];

  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ] as const) {
    const section = packageJson[field];
    if (!section || typeof section !== 'object') continue;

    for (const [name, specifier] of Object.entries(
      section as Record<string, string>,
    )) {
      if (typeof specifier !== 'string') continue;

      if (specifier.startsWith('workspace:')) {
        // workspace: deps are always intra-group
        deps.push({
          name,
          originalSpecifier: specifier,
          resolvedPath: '',
          intraGroup: true,
          field,
        });
      } else if (specifier.startsWith('file:')) {
        const relativePath = specifier.slice(5); // strip 'file:'
        const resolvedPath = path.resolve(packageDir, relativePath);

        // Check if this path is in the same publish group
        const intraGroup = groupPackagePaths.some(
          (gp) => path.resolve(gp) === resolvedPath,
        );

        deps.push({
          name,
          originalSpecifier: specifier,
          resolvedPath,
          intraGroup,
          field,
        });
      } else if (specifier.startsWith('catalog:')) {
        // pnpm catalog: deps are resolved by pnpm at install time, but
        // `npm publish` leaves the specifier verbatim. Pin to the concrete
        // version pnpm installed into node_modules, treating it as external.
        // Covers the default catalog (`catalog:`) and named catalogs
        // (`catalog:<name>`) alike — the installed version is authoritative.
        deps.push({
          name,
          originalSpecifier: specifier,
          resolvedPath: path.resolve(packageDir, 'node_modules', name),
          intraGroup: false,
          field,
        });
      }
    }
  }

  return deps;
}

/**
 * Resolve external file: dep versions by reading their package.json.
 * Returns the dep with publishVersion set.
 */
export function resolveExternalDepVersion(dep: FileDep): FileDep {
  const pkgJsonPath = path.join(dep.resolvedPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error(
      `External dependency "${dep.name}": package.json not found at ${pkgJsonPath}`,
    );
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const version = pkgJson.version;
  if (!version || typeof version !== 'string') {
    throw new Error(
      `External dependency "${dep.name}": no version in ${pkgJsonPath}`,
    );
  }

  return { ...dep, publishVersion: `^${version}` };
}

/**
 * Resolve all file:, workspace:, and catalog: deps for a set of packages.
 * Sets publishVersion on all deps (intra-group uses the computed version;
 * external and catalog deps read the installed package's version).
 */
export function resolveAllFileDeps(
  packages: ResolvedPackage[],
  computedVersion: string,
): ResolvedPackage[] {
  return packages.map((pkg) => ({
    ...pkg,
    fileDeps: pkg.fileDeps.map((dep) => {
      if (dep.intraGroup) {
        return { ...dep, publishVersion: `^${computedVersion}` };
      }
      return resolveExternalDepVersion(dep);
    }),
  }));
}
