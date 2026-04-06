import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { defineCli } from '../src/core/cli.js';

const echo = defineCommand({
  id: 'echo',
  description: 'Echo a message',
  inputSchema: z.object({
    message: z.string().describe('Message to echo'),
    uppercase: z.boolean().default(false).describe('Uppercase output'),
  }),
  execute: async ({ message, uppercase }) =>
    uppercase ? message.toUpperCase() : message,
});

const add = defineCommand({
  id: 'add',
  description: 'Add two numbers',
  inputSchema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ a, b }) => a + b,
});

describe('defineCli', () => {
  const cli = defineCli({
    name: 'test-cli',
    version: '0.0.1',
    description: 'Test CLI',
    commands: [echo, add],
  });

  describe('command registry', () => {
    it('registers commands', () => {
      expect(cli.getCommand('echo')).toBeDefined();
      expect(cli.getCommand('add')).toBeDefined();
    });

    it('returns undefined for unknown commands', () => {
      expect(cli.getCommand('nope')).toBeUndefined();
    });

    it('lists all commands', () => {
      const cmds = cli.listCommands();
      expect(cmds).toHaveLength(2);
      expect(cmds.map((c) => c.id).sort()).toEqual(['add', 'echo']);
    });
  });

  describe('execute', () => {
    it('runs a command with valid args', async () => {
      const result = await cli.execute('echo', { message: 'hi' });
      expect(result).toBe('hi');
    });

    it('applies defaults', async () => {
      const result = await cli.execute('echo', {
        message: 'hi',
        uppercase: true,
      });
      expect(result).toBe('HI');
    });

    it('throws on unknown command', async () => {
      await expect(cli.execute('nope', {})).rejects.toThrow('Unknown command');
    });

    it('throws on invalid input', async () => {
      await expect(cli.execute('echo', {})).rejects.toThrow();
    });
  });

  describe('parseArgs', () => {
    it('parses string and boolean flags', () => {
      const parsed = cli.parseArgs('echo', ['--message', 'hello']);
      expect(parsed).toEqual({ message: 'hello', uppercase: false });
    });

    it('parses boolean flag when present', () => {
      const parsed = cli.parseArgs('echo', [
        '--message',
        'hello',
        '--uppercase',
      ]);
      expect(parsed).toEqual({ message: 'hello', uppercase: true });
    });

    it('throws on missing required arg', () => {
      expect(() => cli.parseArgs('echo', [])).toThrow('Missing required');
    });

    it('throws on unknown flag', () => {
      expect(() =>
        cli.parseArgs('echo', ['--message', 'hi', '--bad']),
      ).toThrow('Unknown option');
    });

    it('throws on unknown command', () => {
      expect(() => cli.parseArgs('nope', ['--x', 'y'])).toThrow(
        'Unknown command',
      );
    });

    it('throws on positional argument', () => {
      expect(() => cli.parseArgs('echo', ['hello'])).toThrow(
        'Unexpected argument',
      );
    });

    it('throws when flag value is missing at end of argv', () => {
      expect(() => cli.parseArgs('echo', ['--message'])).toThrow(
        'Missing value',
      );
    });

    it('throws when flag value is another flag', () => {
      expect(() =>
        cli.parseArgs('echo', ['--message', '--uppercase']),
      ).toThrow('Missing value');
    });

    it('handles optional fields without defaults', () => {
      const optCli = defineCli({
        name: 'opt',
        version: '0.0.1',
        description: 'Optional fields CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({
              required: z.string().describe('Required field'),
              optional: z.string().optional().describe('Optional field'),
            }),
            execute: async (input) => input,
          }),
        ],
      });
      const parsed = optCli.parseArgs('cmd', ['--required', 'val']);
      expect(parsed).toEqual({ required: 'val' });
    });
  });

  describe('help generation', () => {
    it('generates top-level help', () => {
      const help = cli.generateHelp();
      expect(help).toContain('test-cli');
      expect(help).toContain('0.0.1');
      expect(help).toContain('echo');
      expect(help).toContain('add');
    });

    it('generates command-level help', () => {
      const help = cli.generateCommandHelp('echo');
      expect(help).toContain('--message');
      expect(help).toContain('Message to echo');
      expect(help).toContain('--uppercase');
      expect(help).toContain('default: false');
    });

    it('marks required fields in command help', () => {
      const help = cli.generateCommandHelp('add');
      expect(help).toContain('(required)');
    });

    it('throws on unknown command', () => {
      expect(() => cli.generateCommandHelp('nope')).toThrow('Unknown command');
    });

    it('handles fields without descriptions', () => {
      const noDescCli = defineCli({
        name: 'no-desc',
        version: '0.0.1',
        description: 'No desc CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({ value: z.string() }),
            execute: async (input) => input,
          }),
        ],
      });
      const help = noDescCli.generateCommandHelp('cmd');
      expect(help).toContain('--value');
    });
  });

  describe('completion', () => {
    it('generates bash completion', () => {
      const script = cli.generateCompletion('bash');
      expect(script).toContain('test-cli');
      expect(script).toContain('echo');
      expect(script).toContain('add');
    });

    it('generates zsh completion', () => {
      const script = cli.generateCompletion('zsh');
      expect(script).toContain('test-cli');
    });

    it('generates fish completion', () => {
      const script = cli.generateCompletion('fish');
      expect(script).toContain('test-cli');
    });

    it('throws on unsupported shell', () => {
      expect(() => cli.generateCompletion('powershell')).toThrow(
        'Unsupported shell',
      );
    });
  });

  describe('edge cases', () => {
    it('handles a command with a non-object schema gracefully', () => {
      const weirdCli = defineCli({
        name: 'weird',
        version: '0.0.1',
        description: 'Weird CLI',
        commands: [
          {
            id: 'raw',
            description: 'Raw command',
            inputSchema: z.string() as any,
            execute: async (input: any) => input,
          },
        ],
      });
      const parsed = weirdCli.parseArgs('raw', []);
      expect(parsed).toEqual({});
    });
  });

  describe('run', () => {
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

    it('executes a command and writes to stdout', async () => {
      const cap = capture();
      await cli.run(['node', 'test', 'echo', '--message', 'hi'], cap.options);
      expect(cap.output).toEqual(['hi']);
      expect(cap.exitCode).toBeUndefined();
    });

    it('handles boolean flags', async () => {
      const cap = capture();
      await cli.run(
        ['node', 'test', 'echo', '--message', 'hi', '--uppercase'],
        cap.options,
      );
      expect(cap.output).toEqual(['HI']);
    });

    it('does not write to stdout when command returns undefined', async () => {
      const noopCli = defineCli({
        name: 'noop',
        version: '0.0.1',
        description: 'Noop',
        commands: [
          defineCommand({
            id: 'noop',
            description: 'Nothing',
            inputSchema: z.object({}),
            execute: async () => undefined,
          }),
        ],
      });
      const cap = capture();
      await noopCli.run(['node', 'test', 'noop'], cap.options);
      expect(cap.output).toEqual([]);
    });

    it('exits 0 on --help', async () => {
      const cap = capture();
      await cli.run(['node', 'test', '--help'], cap.options);
      expect(cap.exitCode).toBe(0);
    });

    it('exits 0 on --version', async () => {
      const cap = capture();
      await cli.run(['node', 'test', '--version'], cap.options);
      expect(cap.exitCode).toBe(0);
    });

    it('exits non-zero on missing required arg', async () => {
      const cap = capture();
      await cli.run(['node', 'test', 'echo'], cap.options);
      expect(cap.exitCode).not.toBe(0);
      expect(cap.errors.some((e) => e.includes('message'))).toBe(true);
    });

    it('exits non-zero on unknown command', async () => {
      const cap = capture();
      await cli.run(['node', 'test', 'nonexistent'], cap.options);
      expect(cap.exitCode).not.toBe(0);
    });

    it('exits non-zero when command throws', async () => {
      const failCli = defineCli({
        name: 'fail',
        version: '0.0.1',
        description: 'Fail',
        commands: [
          defineCommand({
            id: 'fail',
            description: 'Always fails',
            inputSchema: z.object({}),
            execute: async () => { throw new Error('boom'); },
          }),
        ],
      });
      const cap = capture();
      await failCli.run(['node', 'test', 'fail'], cap.options);
      expect(cap.exitCode).toBe(1);
      expect(cap.errors.some((e) => e.includes('boom'))).toBe(true);
    });

    it('handles optional string options via Commander', async () => {
      const optCli = defineCli({
        name: 'opt',
        version: '0.0.1',
        description: 'Optional CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({
              tag: z.string().optional().describe('Tag'),
              label: z.string().default('none').describe('Label'),
            }),
            execute: async ({ label }) => label,
          }),
        ],
      });
      const cap = capture();
      await optCli.run(['node', 'test', 'cmd'], cap.options);
      expect(cap.output).toEqual(['none']);
    });

    it('handles bare boolean (no default) via Commander', async () => {
      const boolCli = defineCli({
        name: 'bool',
        version: '0.0.1',
        description: 'Bool CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({
              flag: z.boolean().describe('A flag'),
            }),
            execute: async ({ flag }) => String(flag),
          }),
        ],
      });
      const cap = capture();
      await boolCli.run(['node', 'test', 'cmd'], cap.options);
      expect(cap.output).toEqual(['false']);
    });

    it('handles boolean with non-false default via Commander', async () => {
      const boolCli = defineCli({
        name: 'bool',
        version: '0.0.1',
        description: 'Bool CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({
              verbose: z.boolean().default(true).describe('Verbose'),
            }),
            execute: async ({ verbose }) => String(verbose),
          }),
        ],
      });
      const cap = capture();
      await boolCli.run(['node', 'test', 'cmd'], cap.options);
      expect(cap.output).toEqual(['true']);
    });

    it('handles fields without descriptions via Commander', async () => {
      const noDescCli = defineCli({
        name: 'no-desc',
        version: '0.0.1',
        description: 'No desc',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'A command',
            inputSchema: z.object({
              value: z.string(),
            }),
            execute: async ({ value }) => value,
          }),
        ],
      });
      const cap = capture();
      await noDescCli.run(['node', 'test', 'cmd', '--value', 'x'], cap.options);
      expect(cap.output).toEqual(['x']);
    });

    it('handles non-Error throws from commands', async () => {
      const throwCli = defineCli({
        name: 'throw',
        version: '0.0.1',
        description: 'Throw CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'Throws a string',
            inputSchema: z.object({}),
            execute: async () => { throw 'string error'; },
          }),
        ],
      });
      const cap = capture();
      await throwCli.run(['node', 'test', 'cmd'], cap.options);
      expect(cap.exitCode).toBe(1);
      expect(cap.errors.some((e) => e.includes('string error'))).toBe(true);
    });
  });
});
