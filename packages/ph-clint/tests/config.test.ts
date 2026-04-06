import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import {
  toUpperSnake,
  configKeyToEnvVar,
  resolveConfig,
} from '../src/core/config.js';
import { getConfigEnvVars } from '../src/core/config.js';

describe('toUpperSnake', () => {
  it('converts simple camelCase', () => {
    expect(toUpperSnake('defaultPriority')).toBe('DEFAULT_PRIORITY');
  });

  it('converts single word', () => {
    expect(toUpperSnake('port')).toBe('PORT');
  });

  it('handles consecutive uppercase (acronyms)', () => {
    expect(toUpperSnake('apiURL')).toBe('API_URL');
  });

  it('handles acronym followed by word', () => {
    expect(toUpperSnake('apiURLParser')).toBe('API_URL_PARSER');
  });

  it('handles numbers', () => {
    expect(toUpperSnake('port8080Name')).toBe('PORT8080_NAME');
  });

  it('handles already uppercase', () => {
    expect(toUpperSnake('URL')).toBe('URL');
  });
});

describe('configKeyToEnvVar', () => {
  it('prefixes with CLI name', () => {
    expect(configKeyToEnvVar('tasks', 'defaultPriority')).toBe(
      'TASKS_DEFAULT_PRIORITY',
    );
  });

  it('converts cli name too', () => {
    expect(configKeyToEnvVar('myApp', 'connectPort')).toBe(
      'MY_APP_CONNECT_PORT',
    );
  });
});

describe('getConfigEnvVars', () => {
  it('returns env var mappings for all config fields', () => {
    const schema = z.object({
      defaultPriority: z
        .enum(['low', 'medium', 'high'])
        .default('medium')
        .describe('Default priority'),
      maxItems: z.number().default(100).describe('Max items'),
    });
    const vars = getConfigEnvVars('tasks', schema);
    expect(vars).toEqual([
      {
        name: 'TASKS_DEFAULT_PRIORITY',
        field: 'defaultPriority',
        description: 'Default priority',
      },
      {
        name: 'TASKS_MAX_ITEMS',
        field: 'maxItems',
        description: 'Max items',
      },
    ]);
  });

  it('returns empty array for non-object schema', () => {
    const vars = getConfigEnvVars('cli', z.string() as any);
    expect(vars).toEqual([]);
  });

  it('uses empty description when field has none', () => {
    const schema = z.object({
      port: z.number().default(3000),
    });
    const vars = getConfigEnvVars('app', schema);
    expect(vars[0]!.description).toBe('');
  });
});

describe('resolveConfig', () => {
  let workDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'ph-clint-cfg-'));
  });

  afterEach(async () => {
    // Restore env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    await rm(workDir, { recursive: true, force: true });
  });

  const schema = z.object({
    defaultPriority: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Default priority'),
    maxItems: z.coerce.number().default(100).describe('Max items'),
  });

  it('applies Zod defaults when no overrides exist', () => {
    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config).toEqual({ defaultPriority: 'medium', maxItems: 100 });
  });

  it('reads local workspace settings', async () => {
    const settingsDir = join(workDir, '.ph', 'cli', 'tasks');
    await mkdir(settingsDir, { recursive: true });
    await writeFile(
      join(settingsDir, 'settings.json'),
      JSON.stringify({ defaultPriority: 'high' }),
    );

    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config.defaultPriority).toBe('high');
    expect(config.maxItems).toBe(100); // default preserved
  });

  it('reads .env file', async () => {
    await writeFile(
      join(workDir, '.env'),
      'TASKS_DEFAULT_PRIORITY=low\n',
    );

    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config.defaultPriority).toBe('low');
  });

  it('env vars override .env file', async () => {
    await writeFile(
      join(workDir, '.env'),
      'TASKS_DEFAULT_PRIORITY=low\n',
    );
    process.env.TASKS_DEFAULT_PRIORITY = 'high';

    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config.defaultPriority).toBe('high');
  });

  it('env vars override local settings', async () => {
    const settingsDir = join(workDir, '.ph', 'cli', 'tasks');
    await mkdir(settingsDir, { recursive: true });
    await writeFile(
      join(settingsDir, 'settings.json'),
      JSON.stringify({ defaultPriority: 'low' }),
    );
    process.env.TASKS_DEFAULT_PRIORITY = 'high';

    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config.defaultPriority).toBe('high');
  });

  it('.env overrides local settings', async () => {
    const settingsDir = join(workDir, '.ph', 'cli', 'tasks');
    await mkdir(settingsDir, { recursive: true });
    await writeFile(
      join(settingsDir, 'settings.json'),
      JSON.stringify({ defaultPriority: 'low' }),
    );
    await writeFile(
      join(workDir, '.env'),
      'TASKS_DEFAULT_PRIORITY=high\n',
    );

    const config = resolveConfig(schema, 'tasks', workDir);
    expect(config.defaultPriority).toBe('high');
  });

  it('ignores missing .env and settings files', () => {
    const config = resolveConfig(schema, 'tasks', '/nonexistent/path');
    expect(config).toEqual({ defaultPriority: 'medium', maxItems: 100 });
  });
});
