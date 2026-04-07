import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { getSchemaFields, type FieldInfo } from './schema.js';
import {
  configKeyToEnvVar,
  toUpperSnake,
  localConfigPath,
  userConfigPath,
  resolveConfig,
} from './config.js';
import type { Command, CommandContext } from './types.js';

/**
 * Load a JSON config file, returning empty object if missing or invalid.
 */
function loadJsonFile(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Write a JSON config file, creating parent directories as needed.
 */
function writeJsonFile(path: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Coerce a string value to the appropriate type based on schema field info.
 */
function coerceValue(value: string, field: FieldInfo): unknown {
  switch (field.baseType) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1' || value === 'yes';
    default:
      return value;
  }
}

/**
 * Resolve where a config value is actually coming from in the 6-layer chain.
 */
function resolveSource(
  key: string,
  cliName: string,
  workdir: string,
  configFile?: string,
): string {
  // Check layers from highest to lowest priority
  if (configFile) {
    const data = loadJsonFile(configFile);
    if (key in data) return `--config file (${configFile})`;
  }

  const envName = configKeyToEnvVar(cliName, key);
  if (process.env[envName] !== undefined) return `env ${envName}`;

  const localPath = localConfigPath(workdir, cliName);
  const localData = loadJsonFile(localPath);
  if (key in localData) return `local (${localPath})`;

  const userPath = userConfigPath(cliName);
  const userData = loadJsonFile(userPath);
  if (key in userData) return `user (${userPath})`;

  return 'default';
}

export interface ConfigCommandOptions {
  cliName: string;
  configSchema: z.ZodType;
  /** Implementation defaults (layer 5). */
  implementationDefaults?: Record<string, unknown>;
  /** Config file from --config flag (already resolved to absolute). */
  configFile?: string;
}

/**
 * All scope values accepted by the config command.
 * Write mode only accepts 'local' and 'user'.
 */
const ALL_SCOPES = ['args', 'env', 'local', 'user', 'sys'] as const;
type ConfigScope = (typeof ALL_SCOPES)[number];
const WRITABLE_SCOPES = new Set<ConfigScope>(['local', 'user']);

/**
 * Create the built-in `config` command for a CLI.
 */
export function createConfigCommand(opts: ConfigCommandOptions): Command {
  const { cliName, configSchema, implementationDefaults } = opts;
  const fields = getSchemaFields(configSchema);
  const fieldKeys = fields.map((f) => f.key);

  const inputSchema = z.object({
    name: z.enum(fieldKeys as [string, ...string[]]).describe('Setting name'),
    write: z.string().optional().describe('Value to write'),
    scope: z.enum(ALL_SCOPES).optional().describe('Scope to read from or write to'),
  });

  return {
    id: 'config',
    description: 'View or modify configuration settings',
    inputSchema,
    execute: async (input, context: CommandContext) => {
      const { name: settingName, write: newValue, scope } = input as {
        name: string;
        write?: string;
        scope?: ConfigScope;
      };

      const field = fields.find((f) => f.key === settingName);
      if (!field) {
        throw new Error(`Unknown setting: ${settingName}`);
      }

      const workdir = context.workdir;

      // ── Write mode ──
      if (newValue !== undefined) {
        const writeScope = scope ?? 'local';
        if (!WRITABLE_SCOPES.has(writeScope)) {
          throw new Error(`Cannot write to scope "${writeScope}". Only local and user are writable.`);
        }
        const filePath =
          writeScope === 'user'
            ? userConfigPath(cliName)
            : localConfigPath(workdir, cliName);

        // Validate the value against the schema
        const coerced = coerceValue(newValue, field);
        try {
          const testObj: Record<string, unknown> = {};
          testObj[settingName] = coerced;
          configSchema.parse(testObj);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Invalid value for ${settingName}: ${msg}`);
        }

        // Read existing file, merge, write back
        const existing = loadJsonFile(filePath);
        existing[settingName] = coerced;
        writeJsonFile(filePath, existing);

        return { text: `Set ${settingName} = ${JSON.stringify(coerced)} in ${writeScope} config (${filePath})` };
      }

      // ── Read mode ──

      // If --scope is specified, read from that specific layer
      if (scope) {
        return readFromScope(settingName, scope, cliName, workdir, field, configSchema, implementationDefaults);
      }

      // No scope — show resolved value with source
      const resolved = resolveConfig({
        configSchema,
        cliName,
        workdir,
        configFile: opts.configFile,
        implementationDefaults,
      });

      const value = resolved[settingName];
      const source = resolveSource(settingName, cliName, workdir, opts.configFile);

      return { text: `${settingName} = ${JSON.stringify(value)}  (source: ${source})` };
    },
  };
}

/**
 * Read a setting from a specific scope layer.
 */
function readFromScope(
  key: string,
  scope: ConfigScope,
  cliName: string,
  workdir: string,
  field: FieldInfo,
  configSchema: z.ZodType,
  implementationDefaults?: Record<string, unknown>,
): { text: string } {
  switch (scope) {
    case 'args': {
      // --config file layer — we can't access the config file path here,
      // so report that this scope requires --config to be set
      return { text: `${key}: the args scope reflects the --config file, which is not accessible from this context` };
    }
    case 'env': {
      const envName = configKeyToEnvVar(cliName, key);
      const value = process.env[envName];
      if (value === undefined) {
        return { text: `${key} is not set in environment (${envName})` };
      }
      return { text: `${key} = ${JSON.stringify(value)}  (env: ${envName})` };
    }
    case 'local': {
      const filePath = localConfigPath(workdir, cliName);
      const data = loadJsonFile(filePath);
      const value = data[key];
      if (value === undefined) {
        return { text: `${key} is not set in local config (${filePath})` };
      }
      return { text: `${key} = ${JSON.stringify(value)}  (local: ${filePath})` };
    }
    case 'user': {
      const filePath = userConfigPath(cliName);
      const data = loadJsonFile(filePath);
      const value = data[key];
      if (value === undefined) {
        return { text: `${key} is not set in user config (${filePath})` };
      }
      return { text: `${key} = ${JSON.stringify(value)}  (user: ${filePath})` };
    }
    case 'sys': {
      // System defaults: implementation defaults merged with schema defaults
      const defaults = implementationDefaults ?? {};
      if (key in defaults) {
        return { text: `${key} = ${JSON.stringify(defaults[key])}  (system default)` };
      }
      if (field.hasDefault) {
        return { text: `${key} = ${JSON.stringify(field.defaultValue)}  (system default)` };
      }
      return { text: `${key} has no system default` };
    }
  }
}

/**
 * Generate a detailed help page for the config command.
 */
export function generateConfigCommandHelp(cliName: string, configSchema: z.ZodType, workdir: string): string {
  const fields = getSchemaFields(configSchema);
  const lines: string[] = [];

  const cliPrefix = toUpperSnake(cliName);

  // ── Header ──
  lines.push(`${cliName} config — View and modify configuration`);
  lines.push('');
  lines.push(`Usage: ${cliName} config [options]`);
  lines.push('');
  lines.push('Options:');
  lines.push('  -n, --name <setting>   Setting name (required)');
  lines.push('  -w, --write <value>    Write a new value');
  lines.push('  -s, --scope <scope>    Scope to read from or write to');
  lines.push('                         Read:  args | env | local | user | sys');
  lines.push('                         Write: local | user (default: local)');
  lines.push('');

  // ── Section 1: Settings ──
  lines.push('Settings:');
  lines.push('');

  for (const field of fields) {
    const envVar = configKeyToEnvVar(cliName, field.key);

    const typeParts: string[] = [field.baseType];
    if (field.isOptional) typeParts.push('optional');
    if (!field.isOptional && !field.hasDefault) typeParts.push('required');

    const nameLine = field.description
      ? `  \`${field.key}\`: ${field.description}`
      : `  \`${field.key}\``;
    lines.push(nameLine);
    lines.push('');
    lines.push(`    Type: ${typeParts.join(', ')}`);
    lines.push(`    Env:  ${envVar}`);

    // Show current resolved value and source
    try {
      const resolved = resolveConfig({
        configSchema,
        cliName,
        workdir,
      });
      const value = resolved[field.key];
      const source = resolveSource(field.key, cliName, workdir);
      if (field.hasDefault || field.isOptional) {
        lines.push(`    Default: ${JSON.stringify(field.hasDefault ? field.defaultValue : undefined)}`);
      }
      lines.push(`    Value: ${JSON.stringify(value)}  (${source})`);
    } catch {
      lines.push('    Value: <error resolving>');
    }

    lines.push('');
  }

  // ── Section 2: Workdir ──
  lines.push('Workdir:');
  lines.push('');
  lines.push('  The working directory (--workdir) is resolved before configuration');
  lines.push('  and determines where local config files are found. It is NOT a config');
  lines.push('  parameter — it is a prerequisite for config resolution.');
  lines.push('');
  lines.push('  Resolution order:');
  lines.push('    1. process.cwd()           Fallback (always available)');
  lines.push('    2. --workdir <path>         User override via CLI flag');
  lines.push('    3. Implementation override  Set by the application code');
  lines.push('');
  lines.push('  Higher numbers take precedence. If the application sets a workdir');
  lines.push('  override, the --workdir flag is hidden from --help.');
  lines.push('');
  lines.push(`  Current: ${workdir}`);
  lines.push('');

  // ── Section 3: Location and resolution rules ──
  lines.push('Location and Resolution:');
  lines.push('');
  lines.push('  Configuration is resolved through 5 layers (highest priority first):');
  lines.push('');
  lines.push('  1. --config <file>    Config file flag (path relative to cwd)');
  lines.push(`  2. Environment vars   ${cliPrefix}_{FIELD_NAME} format`);
  lines.push(`  3. Local config       ${localConfigPath(workdir, cliName)}`);
  lines.push(`  4. User config        ${userConfigPath(cliName)}`);
  lines.push('  5. System defaults    Built-in defaults for this application');
  lines.push('');
  lines.push('  The --write flag writes to layer 3 (local) by default, or layer 4');
  lines.push('  (user) with --scope user. Layers 1, 2, and 5 are read-only.');
  lines.push('');

  return lines.join('\n');
}
