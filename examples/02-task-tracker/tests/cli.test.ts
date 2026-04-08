import { describe, it, expect } from '@jest/globals';
import { defineCli } from 'ph-clint';
import { z } from 'zod';
import { add } from '../src/commands/add.js';
import { list } from '../src/commands/list.js';
import { done } from '../src/commands/done.js';
import { remove } from '../src/commands/remove.js';

const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
    .describe('Default priority for new tasks'),
});

const cli = defineCli({
  name: 'tasks',
  version: '1.0.0',
  description: 'A simple task tracker',
  configSchema,
  commands: [add, list, done, remove],
  interactive: {
    welcome: 'Task Tracker — type /help for commands',
  },
});

describe('tasks CLI', () => {
  describe('definition', () => {
    it('has the correct name', () => {
      expect(cli.name).toBe('tasks');
    });

    it('has the correct version', () => {
      expect(cli.version).toBe('1.0.0');
    });

    it('registers all commands including built-in config and cli-docs', () => {
      const commands = cli.listCommands();
      expect(commands).toHaveLength(6);
      const ids = commands.map(c => c.id).sort();
      expect(ids).toEqual(['add', 'cli-docs', 'config', 'done', 'list', 'remove']);
    });

    it('looks up commands by id', () => {
      expect(cli.getCommand('add')!.id).toBe('add');
      expect(cli.getCommand('list')!.id).toBe('list');
      expect(cli.getCommand('done')!.id).toBe('done');
      expect(cli.getCommand('remove')!.id).toBe('remove');
    });

    it('returns undefined for unknown commands', () => {
      expect(cli.getCommand('nonexistent')).toBeUndefined();
    });
  });

  describe('command execution', () => {
    it('executes add and returns structured result', async () => {
      const result = await cli.execute('add', { title: 'Test task', priority: 'high' }) as any;
      expect(result.text).toContain('Test task');
      expect(result.data.title).toBe('Test task');
      expect(result.data.priority).toBe('high');
    });

    it('executes list and returns structured result', async () => {
      const result = await cli.execute('list', { filter: 'all' }) as any;
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('data');
    });

    it('throws on missing required args', async () => {
      await expect(cli.execute('add', {})).rejects.toThrow();
    });

    it('throws on unknown command', async () => {
      await expect(cli.execute('nonexistent', {})).rejects.toThrow();
    });
  });

  describe('config schema', () => {
    it('exposes the config schema', () => {
      expect(cli.configSchema).toBeDefined();
    });

    it('parses config with defaults', () => {
      const config = cli.configSchema!.parse({}) as any;
      expect(config.defaultPriority).toBe('medium');
    });

    it('accepts valid overrides', () => {
      const config = cli.configSchema!.parse({ defaultPriority: 'high' }) as any;
      expect(config.defaultPriority).toBe('high');
    });

    it('rejects invalid values', () => {
      expect(() => cli.configSchema!.parse({ defaultPriority: 'critical' })).toThrow();
    });

    it('maps config fields to env var names', () => {
      const envVars = cli.configEnvVars();
      expect(envVars).toContainEqual({
        name: 'TASKS_DEFAULT_PRIORITY',
        field: 'defaultPriority',
        description: 'Default priority for new tasks',
      });
    });
  });

  describe('help generation', () => {
    it('generates top-level help with all commands', () => {
      const help = cli.generateHelp();
      expect(help).toContain('tasks');
      expect(help).toContain('1.0.0');
      expect(help).toContain('add');
      expect(help).toContain('list');
      expect(help).toContain('done');
      expect(help).toContain('remove');
      expect(help).toContain('A simple task tracker');
    });

    it('generates command-level help for add', () => {
      const help = cli.generateCommandHelp('add');
      expect(help).toContain('add');
      expect(help).toContain('--title');
      expect(help).toContain('Task title');
      expect(help).toContain('--priority');
      expect(help).toContain('--due');
    });

    it('generates command-level help for list', () => {
      const help = cli.generateCommandHelp('list');
      expect(help).toContain('--filter');
      expect(help).toContain('default: "open"');
    });
  });

  describe('arg parsing', () => {
    it('parses add args', () => {
      const parsed = cli.parseArgs('add', ['--title', 'Buy milk', '--priority', 'high']);
      expect(parsed.title).toBe('Buy milk');
      expect(parsed.priority).toBe('high');
    });

    it('parses list args with default filter', () => {
      const parsed = cli.parseArgs('list', []);
      expect(parsed.filter).toBe('open');
    });

    it('parses done args', () => {
      const parsed = cli.parseArgs('done', ['--title', 'milk']);
      expect(parsed.title).toBe('milk');
    });

    it('throws on missing required --title for add', () => {
      expect(() => cli.parseArgs('add', [])).toThrow();
    });

    it('throws on unknown flags', () => {
      expect(() => cli.parseArgs('add', ['--title', 'x', '--unknown'])).toThrow();
    });
  });

  describe('interactive mode config', () => {
    it('has interactive config', () => {
      expect(cli.interactive).toBeDefined();
    });

    it('has welcome message', () => {
      expect(cli.interactive!.welcome).toBe('Task Tracker — type /help for commands');
    });
  });

  describe('completion', () => {
    it('generates a shell completion script', () => {
      const script = cli.generateCompletion('bash');
      expect(script).toContain('tasks');
      expect(script).toContain('add');
      expect(script).toContain('list');
      expect(script).toContain('done');
      expect(script).toContain('remove');
    });
  });
});
