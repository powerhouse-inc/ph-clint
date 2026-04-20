import fs from 'node:fs';
import path from 'node:path';
import type { PublishConfig, PublishGroup } from './types.js';

/** Define a publish config (identity function for type safety). */
export function definePublishConfig(config: PublishConfig): PublishConfig {
  return config;
}

/**
 * Discover config file by walking up from startDir.
 * Looks for publish.config.ts in the start dir and ancestors.
 */
export function discoverConfigPath(startDir: string): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const candidate = path.join(dir, 'publish.config.ts');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/** Load a publish config from a .ts file via dynamic import. */
export async function loadConfig(configPath: string): Promise<{
  config: PublishConfig;
  configDir: string;
}> {
  const absPath = path.resolve(configPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Config file not found: ${absPath}`);
  }

  const mod = await import(absPath);
  const config: PublishConfig = mod.default ?? mod.config ?? mod;

  validateConfig(config);

  return { config, configDir: path.dirname(absPath) };
}

/** Validate config structure. Throws on errors. */
export function validateConfig(config: PublishConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }
  if (!config.groups || typeof config.groups !== 'object') {
    throw new Error('Config must have a "groups" object');
  }

  const groupNames = Object.keys(config.groups);
  if (groupNames.length === 0) {
    throw new Error('Config must have at least one group');
  }

  for (const [name, group] of Object.entries(config.groups)) {
    validateGroup(name, group);
  }
}

function validateGroup(name: string, group: PublishGroup): void {
  if (!group.version || typeof group.version !== 'string') {
    throw new Error(`Group "${name}" must have a "version" string`);
  }
  if (!Array.isArray(group.packages) || group.packages.length === 0) {
    throw new Error(`Group "${name}" must have a non-empty "packages" array`);
  }

  for (const pkg of group.packages) {
    if (!pkg.path || typeof pkg.path !== 'string') {
      throw new Error(
        `Group "${name}": each package must have a "path" string`,
      );
    }
    const validCategories = ['cli', 'app', 'lib', 'fusion'];
    if (!validCategories.includes(pkg.category)) {
      throw new Error(
        `Group "${name}": package "${pkg.path}" has invalid category "${pkg.category}". ` +
          `Must be one of: ${validCategories.join(', ')}`,
      );
    }
  }
}

/**
 * Resolve which group to use. If only one group exists, use it.
 * Otherwise require --group flag.
 */
export function resolveGroup(
  config: PublishConfig,
  groupName?: string,
): { name: string; group: PublishGroup } {
  const groupNames = Object.keys(config.groups);

  if (groupName) {
    const group = config.groups[groupName];
    if (!group) {
      throw new Error(
        `Group "${groupName}" not found. Available: ${groupNames.join(', ')}`,
      );
    }
    return { name: groupName, group };
  }

  if (groupNames.length === 1) {
    const name = groupNames[0];
    return { name, group: config.groups[name] };
  }

  throw new Error(
    `Multiple groups found: ${groupNames.join(', ')}. Use --group to select one.`,
  );
}

/**
 * Resolve package paths to absolute paths and verify they exist.
 */
export function resolvePackagePaths(
  group: PublishGroup,
  configDir: string,
): string[] {
  return group.packages.map((pkg) => {
    const absPath = path.resolve(configDir, pkg.path);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Package directory not found: ${absPath} (from "${pkg.path}")`);
    }
    const pkgJsonPath = path.join(absPath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      throw new Error(`No package.json found in: ${absPath}`);
    }
    return absPath;
  });
}
