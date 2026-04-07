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
 * Create the built-in `config` command for a CLI.
 *
 * Usage:
 *   {cli} config <setting>                     — show current value and source
 *   {cli} config <setting> --set <value>        — write to local config
 *   {cli} config <setting> --set <value> --scope user — write to user config
 *   {cli} config <setting> --scope local|user   — read from specific scope
 */
export function createConfigCommand(opts: ConfigCommandOptions): Command {
  const { cliName, configSchema, implementationDefaults } = opts;
  const fields = getSchemaFields(configSchema);
  const fieldKeys = fields.map((f) => f.key);

  // Build the input schema with an enum for parameter names
  const inputSchema = z.object({
    parameter: z.enum(fieldKeys as [string, ...string[]]).describe('Configuration parameter name'),
    set: z.string().optional().describe('New value to set'),
    scope: z.enum(['local', 'user']).optional().describe('Config scope to read from or write to (default: local)'),
  });

  return {
    id: 'config',
    description: 'View or modify configuration settings',
    inputSchema,
    execute: async (input, context: CommandContext) => {
      const { parameter, set: newValue, scope } = input as {
        parameter: string;
        set?: string;
        scope?: 'local' | 'user';
      };

      const field = fields.find((f) => f.key === parameter);
      if (!field) {
        throw new Error(`Unknown config parameter: ${parameter}`);
      }

      const workdir = context.workdir;

      // ── Write mode ──
      if (newValue !== undefined) {
        const writeScope = scope ?? 'local';
        const filePath =
          writeScope === 'user'
            ? userConfigPath(cliName)
            : localConfigPath(workdir, cliName);

        // Validate the value against the schema
        const coerced = coerceValue(newValue, field);
        try {
          const testObj: Record<string, unknown> = {};
          testObj[parameter] = coerced;
          configSchema.parse(testObj);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`Invalid value for ${parameter}: ${msg}`);
        }

        // Read existing file, merge, write back
        const existing = loadJsonFile(filePath);
        existing[parameter] = coerced;
        writeJsonFile(filePath, existing);

        return { text: `Set ${parameter} = ${JSON.stringify(coerced)} in ${writeScope} config (${filePath})` };
      }

      // ── Read mode ──

      // If --scope is specified, read from that specific file
      if (scope) {
        const filePath =
          scope === 'user'
            ? userConfigPath(cliName)
            : localConfigPath(workdir, cliName);
        const data = loadJsonFile(filePath);
        const value = data[parameter];
        if (value === undefined) {
          return { text: `${parameter} is not set in ${scope} config (${filePath})` };
        }
        return { text: `${parameter} = ${JSON.stringify(value)}  (${scope}: ${filePath})` };
      }

      // No scope — show resolved value with source
      const resolved = resolveConfig({
        configSchema,
        cliName,
        workdir,
        configFile: opts.configFile,
        implementationDefaults,
      });

      const value = resolved[parameter];
      const source = resolveSource(parameter, cliName, workdir, opts.configFile);

      return { text: `${parameter} = ${JSON.stringify(value)}  (source: ${source})` };
    },
  };
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
  lines.push('Usage:');
  lines.push(`  ${cliName} config <setting>                        Show current value and source`);
  lines.push(`  ${cliName} config <setting> --set <value>           Set value in local config`);
  lines.push(`  ${cliName} config <setting> --set <value> --scope user  Set value in user config`);
  lines.push(`  ${cliName} config <setting> --scope local|user      Read from a specific scope`);
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
  lines.push('  The --set flag writes to layer 3 (local) by default, or layer 4');
  lines.push('  (user) with --scope user. Layers 1, 2, and 5 are read-only.');
  lines.push('');

  return lines.join('\n');
}
