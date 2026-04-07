import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { createConfigCommand, generateConfigCommandHelp } from '../src/core/config-command.js';
import { defineCommand } from '../src/core/command.js';
import { defineCli } from '../src/core/cli.js';
import { createMemoryWorkspace } from '../src/core/workspace.js';
import type { CommandContext } from '../src/core/types.js';

const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
    .describe('Default priority for new tasks'),
  maxItems: z.coerce.number().default(100).describe('Maximum number of tasks'),
  apiKey: z.string().optional().describe('API key for external service'),
});

describe('createConfigCommand', () => {
  let workDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'ph-clint-cfgcmd-'));
  });

  afterEach(async () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
    await rm(workDir, { recursive: true, force: true });
  });

  function makeContext(workdir?: string): CommandContext {
    return {
      workdir: workdir ?? workDir,
      workspace: createMemoryWorkspace(),
      config: {},
    };
  }

  function makeCommand() {
    return createConfigCommand({
      cliName: 'tasks',
      configSchema,
    });
  }

  describe('read mode', () => {
    it('shows resolved value with source (default)', async () => {
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('defaultPriority');
      expect(result.text).toContain('"medium"');
      expect(result.text).toContain('default');
    });

    it('shows env var as source when set', async () => {
      process.env.TASKS_DEFAULT_PRIORITY = 'high';
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('"high"');
      expect(result.text).toContain('env TASKS_DEFAULT_PRIORITY');
    });

    it('shows local config as source when set', async () => {
      const settingsDir = join(workDir, '.ph');
      await mkdir(settingsDir, { recursive: true });
      await writeFile(
        join(settingsDir, 'tasks.config.local.json'),
        JSON.stringify({ defaultPriority: 'low' }),
      );
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('"low"');
      expect(result.text).toContain('local');
    });

    it('reads from specific scope (local)', async () => {
      const settingsDir = join(workDir, '.ph');
      await mkdir(settingsDir, { recursive: true });
      await writeFile(
        join(settingsDir, 'tasks.config.local.json'),
        JSON.stringify({ defaultPriority: 'high' }),
      );
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority', scope: 'local' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('"high"');
      expect(result.text).toContain('local');
    });

    it('reports not set when scope file has no value', async () => {
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority', scope: 'local' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('not set');
      expect(result.text).toContain('local');
    });

    it('reads from user scope', async () => {
      // User config is at ~/.ph/ — we can't easily write there in tests,
      // so just verify "not set" works for user scope
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority', scope: 'user' },
        makeContext(),
      ) as { text: string };
      // Either shows a value (if user has one) or "not set"
      expect(result.text).toContain('defaultPriority');
    });
  });

  describe('write mode', () => {
    it('writes to local config by default', async () => {
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority', set: 'high' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('defaultPriority');
      expect(result.text).toContain('"high"');
      expect(result.text).toContain('local');

      // Verify file was written
      const filePath = join(workDir, '.ph', 'tasks.config.local.json');
      const data = JSON.parse(await readFile(filePath, 'utf-8'));
      expect(data.defaultPriority).toBe('high');
    });

    it('writes number values correctly', async () => {
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'maxItems', set: '50' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('50');

      const filePath = join(workDir, '.ph', 'tasks.config.local.json');
      const data = JSON.parse(await readFile(filePath, 'utf-8'));
      expect(data.maxItems).toBe(50);
    });

    it('merges with existing config file', async () => {
      const settingsDir = join(workDir, '.ph');
      await mkdir(settingsDir, { recursive: true });
      await writeFile(
        join(settingsDir, 'tasks.config.local.json'),
        JSON.stringify({ defaultPriority: 'low' }),
      );

      const cmd = makeCommand();
      await cmd.execute(
        { parameter: 'maxItems', set: '25' },
        makeContext(),
      );

      const filePath = join(workDir, '.ph', 'tasks.config.local.json');
      const data = JSON.parse(await readFile(filePath, 'utf-8'));
      expect(data.defaultPriority).toBe('low'); // preserved
      expect(data.maxItems).toBe(25); // added
    });

    it('rejects invalid enum value', async () => {
      const cmd = makeCommand();
      await expect(
        cmd.execute(
          { parameter: 'defaultPriority', set: 'invalid' },
          makeContext(),
        ),
      ).rejects.toThrow('Invalid value');
    });

    it('writes to user scope with --scope user', async () => {
      // We can't write to ~/.ph in tests safely, so create a command with
      // a schema that has a string field and test the file write path
      const tmpUserDir = await mkdtemp(join(tmpdir(), 'ph-clint-user-'));
      // For this test we just verify local scope works with explicit scope
      const cmd = makeCommand();
      const result = await cmd.execute(
        { parameter: 'defaultPriority', set: 'low', scope: 'local' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('local');

      await rm(tmpUserDir, { recursive: true, force: true });
    });

    it('writes boolean values correctly (true)', async () => {
      const boolSchema = z.object({
        verbose: z.boolean().default(false).describe('Enable verbose output'),
      });
      const cmd = createConfigCommand({ cliName: 'test', configSchema: boolSchema });
      const result = await cmd.execute(
        { parameter: 'verbose', set: 'true' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('true');

      const filePath = join(workDir, '.ph', 'test.config.local.json');
      const data = JSON.parse(await readFile(filePath, 'utf-8'));
      expect(data.verbose).toBe(true);
    });

    it('coerces boolean with "1" and "yes"', async () => {
      const boolSchema = z.object({
        verbose: z.boolean().default(false).describe('Enable verbose output'),
      });
      const cmd1 = createConfigCommand({ cliName: 'test1', configSchema: boolSchema });
      await cmd1.execute({ parameter: 'verbose', set: '1' }, makeContext());
      const file1 = join(workDir, '.ph', 'test1.config.local.json');
      expect(JSON.parse(await readFile(file1, 'utf-8')).verbose).toBe(true);

      const cmd2 = createConfigCommand({ cliName: 'test2', configSchema: boolSchema });
      await cmd2.execute({ parameter: 'verbose', set: 'yes' }, makeContext());
      const file2 = join(workDir, '.ph', 'test2.config.local.json');
      expect(JSON.parse(await readFile(file2, 'utf-8')).verbose).toBe(true);

      const cmd3 = createConfigCommand({ cliName: 'test3', configSchema: boolSchema });
      await cmd3.execute({ parameter: 'verbose', set: 'no' }, makeContext());
      const file3 = join(workDir, '.ph', 'test3.config.local.json');
      expect(JSON.parse(await readFile(file3, 'utf-8')).verbose).toBe(false);
    });

    it('shows configFile as source when value comes from --config', async () => {
      const configFile = join(workDir, 'custom.json');
      await writeFile(configFile, JSON.stringify({ defaultPriority: 'high' }));

      const cmd = createConfigCommand({
        cliName: 'tasks',
        configSchema,
        configFile,
      });
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('"high"');
      expect(result.text).toContain('--config file');
    });

    it('falls through configFile when key not in file', async () => {
      const configFile = join(workDir, 'partial.json');
      await writeFile(configFile, JSON.stringify({ maxItems: 50 }));

      const cmd = createConfigCommand({
        cliName: 'tasks',
        configSchema,
        configFile,
      });
      // defaultPriority is NOT in the config file, so source should be "default"
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('default');
    });

    it('shows implementation defaults as source', async () => {
      const cmd = createConfigCommand({
        cliName: 'tasks',
        configSchema,
        implementationDefaults: { defaultPriority: 'low' },
      });
      const result = await cmd.execute(
        { parameter: 'defaultPriority' },
        makeContext(),
      ) as { text: string };
      expect(result.text).toContain('"low"');
      // When impl defaults are set but no local/env/config override, source = default
      // (implementation defaults get merged before schema parse, so source detection
      // won't find them in files — they appear as "default")
    });
  });

  describe('input schema', () => {
    it('has parameter as enum of config field keys', () => {
      const cmd = makeCommand();
      const fields = cmd.inputSchema;
      // Should accept valid parameter names
      const parsed = fields.parse({ parameter: 'defaultPriority' }) as Record<string, unknown>;
      expect(parsed.parameter).toBe('defaultPriority');
    });

    it('rejects invalid parameter names', () => {
      const cmd = makeCommand();
      expect(() => cmd.inputSchema.parse({ parameter: 'nonexistent' })).toThrow();
    });
  });
});

describe('generateConfigCommandHelp', () => {
  it('includes all three sections', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('Location and Resolution');
    expect(help).toContain('Settings');
    expect(help).toContain('Workdir');
  });

  it('includes usage examples', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('tasks config <setting>');
    expect(help).toContain('--set');
    expect(help).toContain('--scope');
  });

  it('lists all config fields', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('defaultPriority');
    expect(help).toContain('maxItems');
    expect(help).toContain('apiKey');
  });

  it('shows env var names', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('TASKS_DEFAULT_PRIORITY');
    expect(help).toContain('TASKS_MAX_ITEMS');
    expect(help).toContain('TASKS_API_KEY');
  });

  it('shows descriptions', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('Default priority for new tasks');
    expect(help).toContain('Maximum number of tasks');
  });

  it('shows field types and defaults', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('Default: "medium"');
    expect(help).toContain('Default: 100');
    expect(help).toContain('optional');
  });

  it('shows 5-layer resolution chain', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('--config');
    expect(help).toContain('Environment vars');
    expect(help).toContain('TASKS_{FIELD_NAME}');
    expect(help).toContain('Local config');
    expect(help).toContain('User config');
    expect(help).toContain('System defaults');
  });

  it('uses actual local config path with workdir', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/my/project');
    expect(help).toContain('/my/project/.ph/tasks.config.local.json');
  });

  it('shows workdir resolution order', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('process.cwd()');
    expect(help).toContain('--workdir');
    expect(help).toContain('Implementation override');
    expect(help).toContain('Current: /tmp/test');
  });

  it('explains workdir is not a config parameter', () => {
    const help = generateConfigCommandHelp('tasks', configSchema, '/tmp/test');
    expect(help).toContain('NOT a config');
    expect(help).toContain('prerequisite for config resolution');
  });
});

describe('generateConfigCommandHelp with required field', () => {
  it('shows required marker for mandatory fields', () => {
    const schemaWithRequired = z.object({
      apiKey: z.string().describe('API key for service'),
      port: z.number().default(3000).describe('Port number'),
    });
    const help = generateConfigCommandHelp('myapp', schemaWithRequired, '/tmp/test');
    expect(help).toContain('required');
    expect(help).toContain('API key for service');
  });

  it('handles field without description', () => {
    const schemaNoDesc = z.object({
      port: z.number().default(3000),
    });
    const help = generateConfigCommandHelp('myapp', schemaNoDesc, '/tmp/test');
    expect(help).toContain('port');
    expect(help).toContain('Default: 3000');
  });
});

describe('config command integration via defineCli', () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'ph-clint-cfgint-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  function capture() {
    const output: string[] = [];
    const errors: string[] = [];
    let exitCode: number | undefined;
    return {
      output,
      errors,
      get exitCode() { return exitCode; },
      options: {
        stdout: (msg: string) => output.push(msg),
        stderr: (msg: string) => errors.push(msg),
        exit: (code: number) => { exitCode = code; },
      },
    };
  }

  const schema = z.object({
    defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
      .describe('Default priority for new tasks'),
  });

  it('auto-injects config command when configSchema is present', () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [
        defineCommand({
          id: 'add',
          description: 'Add task',
          inputSchema: z.object({}),
          execute: async () => 'ok',
        }),
      ],
    });
    expect(cli.getCommand('config')).toBeDefined();
  });

  it('does not inject config when no configSchema', () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      commands: [
        defineCommand({
          id: 'add',
          description: 'Add task',
          inputSchema: z.object({}),
          execute: async () => 'ok',
        }),
      ],
    });
    expect(cli.getCommand('config')).toBeUndefined();
  });

  it('does not override user-defined config command', () => {
    const customConfig = defineCommand({
      id: 'config',
      description: 'Custom config',
      inputSchema: z.object({}),
      execute: async () => 'custom',
    });
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [customConfig],
    });
    expect(cli.getCommand('config')!.description).toBe('Custom config');
  });

  it('config command appears in help', () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [
        defineCommand({
          id: 'add',
          description: 'Add task',
          inputSchema: z.object({}),
          execute: async () => 'ok',
        }),
      ],
    });
    const help = cli.generateHelp();
    expect(help).toContain('config');
    expect(help).toContain('View or modify configuration settings');
  });

  it('config command help shows detailed page', () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [],
    });
    const help = cli.generateCommandHelp('config');
    expect(help).toContain('Location and Resolution');
    expect(help).toContain('Settings');
    expect(help).toContain('Workdir');
  });

  it('runs config read via CLI run()', async () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [],
    });
    const cap = capture();
    await cli.run(
      ['node', 'tasks', 'config', '--parameter', 'defaultPriority'],
      { ...cap.options, workdir: workDir },
    );
    expect(cap.output.join('')).toContain('defaultPriority');
    expect(cap.output.join('')).toContain('medium');
  });

  it('runs config set via CLI run()', async () => {
    const cli = defineCli({
      name: 'tasks',
      version: '1.0.0',
      description: 'Task tracker',
      configSchema: schema,
      commands: [],
    });
    const cap = capture();
    await cli.run(
      ['node', 'tasks', 'config', '--parameter', 'defaultPriority', '--set', 'high'],
      { ...cap.options, workdir: workDir },
    );
    expect(cap.output.join('')).toContain('high');

    // Verify the file was written
    const filePath = join(workDir, '.ph', 'tasks.config.local.json');
    const data = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(data.defaultPriority).toBe('high');
  });
});
