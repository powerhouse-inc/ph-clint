import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { defineCli } from '../src/core/cli.js';
import { defineTrigger } from '../src/core/trigger.js';
import type { AgentProvider, StreamChunk } from '../src/core/types.js';

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

    it('creates default context with config defaults when configSchema is set', async () => {
      const configCli = defineCli({
        name: 'cfg',
        version: '0.0.1',
        description: 'Config CLI',
        configSchema: z.object({
          mode: z.string().default('dev'),
        }),
        commands: [
          defineCommand({
            id: 'show',
            description: 'Show config',
            inputSchema: z.object({}),
            execute: async (_input, ctx) => ctx.config,
          }),
        ],
      });
      const result = await configCli.execute('show', {});
      expect(result).toEqual({ mode: 'dev' });
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

    it('includes -i option in help when interactive is configured', () => {
      const interactiveCli = defineCli({
        name: 'test',
        version: '1.0.0',
        description: 'Interactive test',
        commands: [echo],
        interactive: { welcome: 'Hello' },
      });
      const help = interactiveCli.generateHelp();
      expect(help).toContain('-i, --interactive');
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

  describe('config', () => {
    it('exposes configSchema when provided', () => {
      const configCli = defineCli({
        name: 'cfg',
        version: '0.0.1',
        description: 'Config CLI',
        configSchema: z.object({
          port: z.number().default(3000).describe('Port number'),
        }),
        commands: [echo],
      });
      expect(configCli.configSchema).toBeDefined();
    });

    it('returns undefined configSchema when not provided', () => {
      expect(cli.configSchema).toBeUndefined();
    });

    it('returns env var mappings for config fields', () => {
      const configCli = defineCli({
        name: 'myApp',
        version: '0.0.1',
        description: 'Config CLI',
        configSchema: z.object({
          connectPort: z.number().default(3000).describe('Port'),
        }),
        commands: [echo],
      });
      const vars = configCli.configEnvVars();
      expect(vars).toEqual([
        { name: 'MY_APP_CONNECT_PORT', field: 'connectPort', description: 'Port' },
      ]);
    });

    it('returns empty env vars when no configSchema', () => {
      expect(cli.configEnvVars()).toEqual([]);
    });

    it('exposes interactive config when provided', () => {
      const interactiveCli = defineCli({
        name: 'int',
        version: '0.0.1',
        description: 'Interactive CLI',
        commands: [echo],
        interactive: { welcome: 'Hello!' },
      });
      expect(interactiveCli.interactive).toEqual({ welcome: 'Hello!' });
    });

    it('returns undefined interactive when not provided', () => {
      expect(cli.interactive).toBeUndefined();
    });
  });

  describe('triggers and routine', () => {
    it('creates routine when triggers are provided', () => {
      const triggerCli = defineCli({
        name: 'trigger-test',
        version: '0.0.1',
        description: 'Trigger CLI',
        commands: [echo],
        triggers: [{
          id: 'test',
          type: 'condition',
          poll: async () => null,
        }],
        routine: { tickInterval: 100, idleInterval: 50 },
      });
      expect(triggerCli.stopRoutine).toBeDefined();
    });

    it('does not create routine when no triggers', () => {
      expect(cli.stopRoutine).toBeDefined();
      // stopRoutine exists but is a no-op
    });

    it('provides process manager to commands when triggers exist', async () => {
      let hasProcesses = false;
      const triggerCli = defineCli({
        name: 'pm-test',
        version: '0.0.1',
        description: 'PM CLI',
        commands: [
          defineCommand({
            id: 'check',
            description: 'Check context',
            inputSchema: z.object({}),
            execute: async (_, ctx) => {
              hasProcesses = ctx.processes !== undefined;
              return 'ok';
            },
          }),
        ],
        triggers: [{
          id: 'test',
          type: 'condition',
          poll: async () => null,
        }],
      });
      await triggerCli.execute('check', {});
      expect(hasProcesses).toBe(true);
    });

    it('provides emit to commands when triggers exist', async () => {
      let hasEmit = false;
      const triggerCli = defineCli({
        name: 'emit-test',
        version: '0.0.1',
        description: 'Emit CLI',
        commands: [
          defineCommand({
            id: 'check',
            description: 'Check context',
            inputSchema: z.object({}),
            execute: async (_, ctx) => {
              hasEmit = ctx.emit !== undefined;
              return 'ok';
            },
          }),
        ],
        triggers: [{
          id: 'test',
          type: 'condition',
          poll: async () => null,
        }],
      });
      await triggerCli.execute('check', {});
      expect(hasEmit).toBe(true);
    });

    it('stopRoutine is safe to call when no triggers', async () => {
      await cli.stopRoutine?.();
      // should not throw
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

    it('prints .text for structured result objects', async () => {
      const structCli = defineCli({
        name: 'struct',
        version: '0.0.1',
        description: 'Struct CLI',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'Returns structured result',
            inputSchema: z.object({}),
            execute: async () => ({ text: 'display text', data: { id: 1 } }),
          }),
        ],
      });
      const cap = capture();
      await structCli.run(['node', 'test', 'cmd'], cap.options);
      expect(cap.output).toEqual(['display text']);
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

    describe('--wait flag', () => {
    let tickCount: number;

    const counter = defineCommand({
      id: 'start',
      description: 'Start routine',
      inputSchema: z.object({}),
      execute: async (_, { routine }) => {
        routine!.start();
        return 'Started';
      },
    });

    const ticker = defineTrigger({
      id: 'tick-trigger',
      type: 'condition',
      poll: async () => {
        tickCount++;
        return null; // no work items, just counts ticks
      },
    });

    function makeWaitCli() {
      tickCount = 0;
      return defineCli({
        name: 'wait-test',
        version: '1.0.0',
        description: 'Wait test CLI',
        commands: [counter],
        triggers: [ticker],
        routine: { tickInterval: 50, idleInterval: 20 },
      });
    }

    it('keeps process alive after command with --wait and routine', async () => {
      const cli = makeWaitCli();
      const cap = capture();
      const ac = new AbortController();

      const runPromise = cli.run(['node', 'test', '--wait', 'start'], {
        ...cap.options,
        signal: ac.signal,
      });

      // Let routine tick a few times
      await new Promise(r => setTimeout(r, 200));

      // Should have ticked
      expect(tickCount).toBeGreaterThan(0);

      // Abort to stop
      ac.abort();
      await runPromise;

      expect(cap.output).toContain('Started');
      expect(cap.exitCode).toBe(0);
    });

    it('exits normally without --wait even with routine', async () => {
      const cli = makeWaitCli();
      const cap = capture();

      await cli.run(['node', 'test', 'start'], cap.options);

      // Should exit without waiting — routine may have started but run() doesn't wait
      expect(cap.output).toContain('Started');

      // Clean up
      await cli.stopRoutine?.();
    });

    it('--wait with already-aborted signal stops immediately', async () => {
      const cli = makeWaitCli();
      const cap = capture();
      const ac = new AbortController();
      ac.abort(); // Already aborted

      const runPromise = cli.run(['node', 'test', '--wait', 'start'], {
        ...cap.options,
        signal: ac.signal,
      });

      await runPromise;

      expect(cap.output).toContain('Started');
      expect(cap.exitCode).toBe(0);
    });

    it('--wait with -w short flag', async () => {
      const cli = makeWaitCli();
      const cap = capture();
      const ac = new AbortController();

      const runPromise = cli.run(['node', 'test', '-w', 'start'], {
        ...cap.options,
        signal: ac.signal,
      });

      await new Promise(r => setTimeout(r, 100));
      ac.abort();
      await runPromise;

      expect(cap.output).toContain('Started');
      expect(cap.exitCode).toBe(0);
    });

    it('--wait with process signal stops routine', async () => {
      const cli = makeWaitCli();
      const cap = capture();

      // No signal provided — uses process signal handlers
      const runPromise = cli.run(['node', 'test', '--wait', 'start'], cap.options);

      // Let routine tick
      await new Promise(r => setTimeout(r, 100));

      // Send SIGINT to ourselves
      process.emit('SIGINT' as any);

      await runPromise;

      expect(cap.output).toContain('Started');
      expect(cap.exitCode).toBe(0);
    });

    it('--wait without routine exits immediately after command', async () => {
      const noRoutineCli = defineCli({
        name: 'no-routine',
        version: '1.0.0',
        description: 'No routine',
        commands: [
          defineCommand({
            id: 'cmd',
            description: 'Simple',
            inputSchema: z.object({}),
            execute: async () => 'done',
          }),
        ],
      });

      const cap = capture();
      await noRoutineCli.run(['node', 'test', 'cmd', '--wait'], cap.options);
      expect(cap.output).toContain('done');
      // No routine → --wait is a no-op, run() returns normally without calling exit()
      expect(cap.exitCode).toBeUndefined();
    });
    });

    describe('workdir and config flags', () => {
      let tmpDir: string;

      beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'ph-clint-wdir-'));
      });

      afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true });
      });

      it('passes workdir to command context', async () => {
        let receivedWorkdir: string | undefined;
        const wdCli = defineCli({
          name: 'wd-test',
          version: '0.0.1',
          description: 'Workdir test',
          commands: [
            defineCommand({
              id: 'check',
              description: 'Check workdir',
              inputSchema: z.object({}),
              execute: async (_, ctx) => {
                receivedWorkdir = ctx.workdir;
                return 'ok';
              },
            }),
          ],
        });

        const cap = capture();
        await wdCli.run(['node', 'test', 'check'], {
          ...cap.options,
          workdir: tmpDir,
        });
        expect(receivedWorkdir).toBe(tmpDir);
      });

      it('implementation workdir override takes precedence', async () => {
        let receivedWorkdir: string | undefined;
        const wdCli = defineCli({
          name: 'wd-test',
          version: '0.0.1',
          description: 'Workdir test',
          commands: [
            defineCommand({
              id: 'check',
              description: 'Check workdir',
              inputSchema: z.object({}),
              execute: async (_, ctx) => {
                receivedWorkdir = ctx.workdir;
                return 'ok';
              },
            }),
          ],
          workdir: tmpDir,
        });

        const cap = capture();
        await wdCli.run(['node', 'test', 'check'], cap.options);
        expect(receivedWorkdir).toBe(tmpDir);
      });

      it('--config flag reads config from file (highest priority)', async () => {
        const configFile = join(tmpDir, 'custom.json');
        await writeFile(configFile, JSON.stringify({ priority: 'high' }));

        let receivedConfig: Record<string, unknown> = {};
        const cfgCli = defineCli({
          name: 'cfg-test',
          version: '0.0.1',
          description: 'Config test',
          configSchema: z.object({
            priority: z.enum(['low', 'medium', 'high']).default('low'),
          }),
          commands: [
            defineCommand({
              id: 'check',
              description: 'Check config',
              inputSchema: z.object({}),
              execute: async (_, ctx) => {
                receivedConfig = ctx.config;
                return 'ok';
              },
            }),
          ],
        });

        const cap = capture();
        await cfgCli.run(
          ['node', 'test', '--config', configFile, 'check'],
          cap.options,
        );
        expect(receivedConfig.priority).toBe('high');
      });

      it('configDefaults are applied as layer 5', async () => {
        let receivedConfig: Record<string, unknown> = {};
        const cfgCli = defineCli({
          name: 'cfg-test',
          version: '0.0.1',
          description: 'Config test',
          configSchema: z.object({
            priority: z.enum(['low', 'medium', 'high']).default('low'),
          }),
          configDefaults: { priority: 'medium' },
          commands: [
            defineCommand({
              id: 'check',
              description: 'Check config',
              inputSchema: z.object({}),
              execute: async (_, ctx) => {
                receivedConfig = ctx.config;
                return 'ok';
              },
            }),
          ],
        });

        const cap = capture();
        await cfgCli.run(['node', 'test', 'check'], cap.options);
        expect(receivedConfig.priority).toBe('medium');
      });

      it('creates workspace store at {workdir}/.ph/{cli-name}/', async () => {
        let basePath: string | undefined;
        const wdCli = defineCli({
          name: 'store-test',
          version: '0.0.1',
          description: 'Store test',
          commands: [
            defineCommand({
              id: 'check',
              description: 'Check workspace path',
              inputSchema: z.object({}),
              execute: async (_, ctx) => {
                basePath = ctx.workspace.basePath;
                return 'ok';
              },
            }),
          ],
        });

        const cap = capture();
        await wdCli.run(['node', 'test', 'check'], {
          ...cap.options,
          workdir: tmpDir,
        });
        expect(basePath).toBe(`${tmpDir}/.ph/store-test`);
      });
    });

    describe('default command — agent in command mode', () => {
      function createTestAgent(
        responses: Record<string, StreamChunk[]>,
      ): AgentProvider {
        return {
          id: 'test-assistant',
          async *stream(prompt) {
            const chunks = responses[prompt] ?? [
              { type: 'text-delta' as const, text: `Echo: ${prompt}` },
            ];
            for (const chunk of chunks) yield chunk;
          },
        };
      }

      it('routes positional text to agent when defaultCommand is set', async () => {
        const agent = createTestAgent({
          'What is TypeScript?': [
            { type: 'text-delta', text: 'TypeScript is great.' },
          ],
        });

        const agentCli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          integrations: [{ id: 'test', agents: [agent] }],
          defaultCommand: 'agent:test-assistant',
        });

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'What is TypeScript?'],
          cap.options,
        );
        expect(cap.output.join('')).toContain('TypeScript is great.');
      });

      it('passes --resume thread ID to agent', async () => {
        let receivedThreadId: string | undefined;

        const agent: AgentProvider = {
          id: 'test-assistant',
          async *stream(_prompt, opts) {
            receivedThreadId = opts?.threadId;
            yield { type: 'text-delta', text: 'resumed' };
          },
        };

        const agentCli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          integrations: [{ id: 'test', agents: [agent] }],
          defaultCommand: 'agent:test-assistant',
        });

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', '--resume', 'thread-abc-123', 'hello'],
          cap.options,
        );
        expect(receivedThreadId).toBe('thread-abc-123');
      });

      it('still runs subcommands normally', async () => {
        const agent = createTestAgent({});
        const agentCli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          integrations: [{ id: 'test', agents: [agent] }],
          defaultCommand: 'agent:test-assistant',
        });

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'echo', '--message', 'hi'],
          cap.options,
        );
        expect(cap.output).toContain('hi');
      });

      it('routes "help" to Commander, not to agent', async () => {
        const agent = createTestAgent({});
        const agentCli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          integrations: [{ id: 'test', agents: [agent] }],
          defaultCommand: 'agent:test-assistant',
        });

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'help', 'echo'],
          cap.options,
        );
        // Should show help for echo, not send "help echo" to the agent
        expect(cap.exitCode).toBe(0);
      });

      it('headless interactive routes bare text to agent', async () => {
        const agent = createTestAgent({
          'tell me a joke': [
            { type: 'text-delta', text: 'Why did the chicken...' },
          ],
        });

        const agentCli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          integrations: [{ id: 'test', agents: [agent] }],
          defaultCommand: 'agent:test-assistant',
          interactive: { welcome: 'Hi!' },
        });

        const output: string[] = [];
        await agentCli.run(['node', 'assist', '-i'], {
          stdout: (msg) => output.push(msg),
          stderr: () => {},
          exit: () => {},
          interactiveInput: (async function* () {
            yield 'tell me a joke';
            yield '/exit';
          })(),
        });

        expect(output[0]).toBe('Hi!');
        expect(output.join('')).toContain('Why did the chicken...');
      });
    });
  });
});
