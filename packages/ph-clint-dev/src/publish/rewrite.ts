import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedPackage } from './types.js';

/**
 * Create a backup of package.json. Returns the backup path.
 */
export function backupPackageJson(packageDir: string): string {
  const src = path.join(packageDir, 'package.json');
  const dest = path.join(packageDir, 'package.json.publish-backup');
  fs.copyFileSync(src, dest);
  return dest;
}

/**
 * Restore package.json from backup. Removes the backup file.
 */
export function restorePackageJson(packageDir: string): void {
  const backup = path.join(packageDir, 'package.json.publish-backup');
  const dest = path.join(packageDir, 'package.json');
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, dest);
    fs.unlinkSync(backup);
  }
}

/**
 * Remove backup file without restoring.
 */
export function removeBackup(packageDir: string): void {
  const backup = path.join(packageDir, 'package.json.publish-backup');
  if (fs.existsSync(backup)) {
    fs.unlinkSync(backup);
  }
}

/**
 * Rewrite package.json: set version and replace file: deps with resolved versions.
 */
export function rewritePackageJson(
  pkg: ResolvedPackage,
  version: string,
): void {
  const pkgJsonPath = path.join(pkg.absPath, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

  // Set version
  pkgJson.version = version;

  // Rewrite file: deps
  for (const dep of pkg.fileDeps) {
    const section = pkgJson[dep.field];
    if (section && dep.publishVersion) {
      section[dep.name] = dep.publishVersion;
    }
  }

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
}

/**
 * After publish: restore file: dependency paths but keep the new version.
 */
export function restoreFileDepPaths(pkg: ResolvedPackage): void {
  const pkgJsonPath = path.join(pkg.absPath, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

  // Restore file: specifiers
  for (const dep of pkg.fileDeps) {
    const section = pkgJson[dep.field];
    if (section) {
      section[dep.name] = dep.originalSpecifier;
    }
  }

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
}
