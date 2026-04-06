import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { z } from 'zod';
import { getSchemaFields } from './schema.js';
import type { ConfigEnvVar } from './types.js';

/**
 * Convert a camelCase string to UPPER_SNAKE_CASE.
 */
export function toUpperSnake(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

/**
 * Derive the environment variable name for a config field.
 * E.g., configKeyToEnvVar('tasks', 'defaultPriority') → 'TASKS_DEFAULT_PRIORITY'
 */
export function configKeyToEnvVar(cliName: string, field: string): string {
  return `${toUpperSnake(cliName)}_${toUpperSnake(field)}`;
}

/**
 * List all config fields and their corresponding env var names.
 */
export function getConfigEnvVars(
  cliName: string,
  configSchema: z.ZodType,
): ConfigEnvVar[] {
  const fields = getSchemaFields(configSchema);
  return fields.map((f) => ({
    name: configKeyToEnvVar(cliName, f.key),
    field: f.key,
    description: f.description ?? '',
  }));
}

/**
 * Load a .env file and return its contents as a Record.
 * Returns empty object if the file doesn't exist.
 */
function loadEnvFile(path: string): Record<string, string | undefined> {
  try {
    return parseEnv(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Load a JSON settings file.
 * Returns empty object if the file doesn't exist.
 */
function loadSettingsFile(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Pick values from an env-like Record, mapping env var names back to config field names.
 */
function pickEnvValues(
  env: Record<string, string | undefined>,
  cliName: string,
  configSchema: z.ZodType,
): Record<string, string> {
  const fields = getSchemaFields(configSchema);
  const result: Record<string, string> = {};
  for (const field of fields) {
    const envName = configKeyToEnvVar(cliName, field.key);
    const value = env[envName];
    if (value !== undefined) {
      result[field.key] = value;
    }
  }
  return result;
}

/**
 * Resolve config through 5 layers:
 * 1. Hardcoded defaults (from Zod schema)
 * 2. Global workspace settings (~/.ph/cli/{name}/settings.json)
 * 3. Local workspace settings ({cwd}/.ph/cli/{name}/settings.json)
 * 4. .env file ({cwd}/.env)
 * 5. Environment variables (process.env) — highest priority
 *
 * Returns the validated, merged config object.
 */
export function resolveConfig(
  configSchema: z.ZodType,
  cliName: string,
  cwd: string,
): Record<string, unknown> {
  // Layer 1: defaults (handled by Zod parse at the end)
  // Layer 2: global settings
  const globalPath = join(homedir(), '.ph', 'cli', cliName, 'settings.json');
  const globalSettings = loadSettingsFile(globalPath);

  // Layer 3: local settings
  const localPath = join(cwd, '.ph', 'cli', cliName, 'settings.json');
  const localSettings = loadSettingsFile(localPath);

  // Layer 4: .env file
  const envFilePath = join(cwd, '.env');
  const envFileValues = pickEnvValues(loadEnvFile(envFilePath), cliName, configSchema);

  // Layer 5: process.env
  const processEnvValues = pickEnvValues(
    process.env as Record<string, string | undefined>,
    cliName,
    configSchema,
  );

  // Merge (lower priority first, higher priority overwrites)
  const merged = {
    ...globalSettings,
    ...localSettings,
    ...envFileValues,
    ...processEnvValues,
  };

  // Validate through Zod (applies defaults for missing fields)
  return configSchema.parse(merged) as Record<string, unknown>;
}
