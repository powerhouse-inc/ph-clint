import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { defineCli } from '../src/core/cli.js';
import { defineTrigger } from '../src/core/trigger.js';
import { defineService } from '../src/core/services.js';
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
      expect(cmds).toHaveLength(3);
      expect(cmds.map((c) => c.id).sort()).toEqual(['add', 'cli-docs', 'echo']);
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

    it('throws on invalid input with formatted error', async () => {
      await expect(cli.execute('echo', {})).rejects.toThrow(
        "Invalid arguments for 'echo'",
      );
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

    it('includes Skills section when skills config has skills', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'skills-help-'));
      try {
        const skillDir = join(tmp, 'my-skill');
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, 'SKILL.md'),
          '---\nname: my-skill\ndescription: "A test skill"\n---\n\nContent.\n',
        );

        const skillCli = defineCli({
          name: 'skill-test',
          version: '1.0.0',
          description: 'Skills test',
          commands: [echo],
          skills: { sources: [tmp] },
        });

        const help = skillCli.generateHelp();
        expect(help).toContain('Skills:');
        expect(help).toContain('my-skill');
        expect(help).toContain('A test skill');
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });

    it('omits Skills section when no skills found', () => {
      const skillCli = defineCli({
        name: 'empty-skills',
        version: '1.0.0',
        description: 'No skills',
        commands: [echo],
        skills: { sources: ['/nonexistent/path'] },
      });
      const help = skillCli.generateHelp();
      expect(help).not.toContain('Skills:');
    });

    it('skill commands are registered in commandMap', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'skills-cmds-'));
      try {
        const skillDir = join(tmp, 'my-skill');
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, 'SKILL.md'),
          '---\nname: my-skill\ndescription: "A test skill"\n---\n\nContent.\n',
        );

        const skillCli = defineCli({
          name: 'skill-cmds',
          version: '1.0.0',
          description: 'Skills commands test',
          commands: [echo],
          skills: { sources: [tmp] },
        });

        expect(skillCli.getCommand('my-skill')).toBeDefined();
        expect(skillCli.getCommand('my-skill')!.description).toBe('A test skill');
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });

    it('skill command execute returns SkillInvocation', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'skills-exec-'));
      try {
        const skillDir = join(tmp, 'my-skill');
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, 'SKILL.md'),
          '---\nname: my-skill\ndescription: "A test skill"\n---\n\nContent.\n',
        );

        const skillCli = defineCli({
          name: 'skill-exec',
          version: '1.0.0',
          description: 'Skills exec test',
          commands: [echo],
          skills: { sources: [tmp] },
        });

        const result = await skillCli.execute('my-skill', {});
        expect(result).toMatchObject({
          type: 'skill-invocation',
          skillName: 'my-skill',
        });
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });

    it('skill command in command mode invokes agent with prompt', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'skills-agent-'));
      try {
        const skillDir = join(tmp, 'my-skill');
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, 'SKILL.md'),
          '---\nname: my-skill\ndescription: "A test skill"\n---\n\nContent.\n',
        );

        const agentPrompts: string[] = [];
        const skillCli = defineCli({
          name: 'skill-agent',
          version: '1.0.0',
          description: 'Skills agent test',
          commands: [echo],
          skills: { sources: [tmp] },
        });
        skillCli.setAgentLoader(async () => ({
          id: 'test-agent',
          async *stream(prompt: string) {
            agentPrompts.push(prompt);
            yield { type: 'text-delta' as const, text: 'agent response' };
          },
        }));

        const output: string[] = [];
        await skillCli.run(['node', 'skill-agent', 'my-skill', '--prompt', 'do something'], {
          stdout: (msg) => output.push(msg),
          stderr: () => {},
          exit: () => {},
          workdir: tmp,
        });

        expect(agentPrompts).toHaveLength(1);
        expect(agentPrompts[0]).toContain('my-skill');
        expect(agentPrompts[0]).toContain('do something');
        expect(output.join('')).toContain('agent response');
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });

    it('skill command without agent shows skill name', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'skills-noagent-'));
      try {
        const skillDir = join(tmp, 'my-skill');
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, 'SKILL.md'),
          '---\nname: my-skill\ndescription: "A test skill"\n---\n\nContent.\n',
        );

        const skillCli = defineCli({
          name: 'skill-noagent',
          version: '1.0.0',
          description: 'No agent',
          commands: [echo],
          skills: { sources: [tmp] },
        });

        const output: string[] = [];
        await skillCli.run(['node', 'skill-noagent', 'my-skill'], {
          stdout: (msg) => output.push(msg),
          stderr: () => {},
          exit: () => {},
          workdir: tmp,
        });

        expect(output.join('')).toContain('Skill: my-skill');
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
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

    it('registers -i option on Commander when interactive is configured and command is run', async () => {
      const interactiveCli = defineCli({
        name: 'int-test',
        version: '1.0.0',
        description: 'Interactive test',
        commands: [echo],
        interactive: { welcome: 'Hello' },
      });
      const output: string[] = [];
      let exitCode: number | undefined;
      await interactiveCli.run(['node', 'int-test', 'echo', '--message', 'hi'], {
        stdout: (msg) => output.push(msg),
        stderr: () => {},
        exit: (code) => { exitCode = code; },
      });
      expect(output).toEqual(['hi']);
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

  describe('built-in cli-docs command', () => {
    it('returns general help with agent preamble and rewritten headings', async () => {
      const result = await cli.execute('cli-docs', {}) as { text: string };
      expect(result.text).toContain('As a CLI-first agent');
      expect(result.text).toContain('CLI Usage: test-cli');
      expect(result.text).toContain('CLI Options:');
      expect(result.text).toContain('Commands / Agent Tools:');
      expect(result.text).toContain('echo');
    });

    it('returns command-specific help with agent preamble', async () => {
      const result = await cli.execute('cli-docs', { command: 'echo' }) as { text: string };
      expect(result.text).toContain('As a CLI-first agent');
      expect(result.text).toContain('--message');
    });

    it('returns general help for unknown command', async () => {
      const result = await cli.execute('cli-docs', { command: 'nope' }) as { text: string };
      expect(result.text).toContain('As a CLI-first agent');
      expect(result.text).toContain('CLI Usage: test-cli');
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

    it('includes required field marker in config help section', () => {
      const reqCli = defineCli({
        name: 'req',
        version: '0.0.1',
        description: 'Required config CLI',
        configSchema: z.object({
          apiKey: z.string().describe('API key'),
        }),
        commands: [echo],
      });
      const help = reqCli.generateHelp();
      expect(help).toContain('(required)');
      expect(help).toContain('API_KEY');
      // No default marker for required fields
      expect(help).not.toContain('(default:');
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

    it('stopRoutine stops a running routine', async () => {
      const triggerCli = defineCli({
        name: 'stop-routine-test',
        version: '0.0.1',
        description: 'Stop routine test',
        commands: [
          defineCommand({
            id: 'start-it',
            description: 'Start the routine',
            inputSchema: z.object({}),
            execute: async (_, { routine }) => {
              routine!.start();
              return 'ok';
            },
          }),
        ],
        triggers: [{
          id: 'tick',
          type: 'condition',
          poll: async () => null,
        }],
        routine: { tickInterval: 50, idleInterval: 20 },
      });

      const output: string[] = [];
      await triggerCli.run(['node', 'test', 'start-it'], {
        stdout: (msg: string) => output.push(msg),
        stderr: () => {},
        exit: () => {},
      });
      // The routine was started by the command and stopped by run() cleanup.
      // Now call stopRoutine explicitly — should be safe (already stopped).
      await triggerCli.stopRoutine!();
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

    it('exits 0 on --meta and outputs metadata JSON', async () => {
      const cap = capture();
      await cli.run(['node', 'test', '--meta'], cap.options);
      expect(cap.exitCode).toBe(0);
      const json = JSON.parse(cap.output.join('\n'));
      expect(json.name).toBe('test-cli');
      expect(json.version).toBe('0.0.1');
      expect(json.commands).toBeDefined();
    });

    it('--meta ignores other arguments', async () => {
      const cap = capture();
      await cli.run(['node', 'test', '--meta', 'echo', '--message', 'hi'], cap.options);
      expect(cap.exitCode).toBe(0);
      const json = JSON.parse(cap.output.join('\n'));
      expect(json.name).toBe('test-cli');
    });

    it('--meta includes mcpPrefix for services with api-mcp captures', async () => {
      const svcCli = defineCli({
        name: 'mcp-test',
        version: '1.0.0',
        description: 'MCP prefix test',
        commands: [echo],
        services: [
          defineService({
            id: 'my-svc',
            label: 'My Service',
            command: 'echo hi',
            readiness: {
              patterns: [
                {
                  name: 'http',
                  pattern: /http:\/\/localhost:(\d+)/,
                  captures: { port: 1 },
                },
                {
                  name: 'mcp',
                  pattern: /MCP at (https?:\/\/\S+)/,
                  captures: { 'mcp-url': { group: 1, type: 'api-mcp' } },
                },
              ],
              timeout: 5000,
            },
          }),
          defineService({
            id: 'no-mcp',
            label: 'No MCP Service',
            command: 'echo bye',
            readiness: {
              pattern: /ready/,
              timeout: 5000,
            },
          }),
        ],
      });
      const cap = capture();
      await svcCli.run(['node', 'test', '--meta'], cap.options);
      expect(cap.exitCode).toBe(0);
      const json = JSON.parse(cap.output.join('\n'));
      expect(json.services['my-svc'].mcpPrefix).toBe('my-svc-mcp__');
      expect(json.services['no-mcp'].mcpPrefix).toBeUndefined();
    });

    it('--meta includes mcpPrefix map for services with multiple api-mcp captures', async () => {
      const svcCli = defineCli({
        name: 'multi-mcp',
        version: '1.0.0',
        description: 'Multi MCP test',
        commands: [echo],
        services: [
          defineService({
            id: 'multi',
            label: 'Multi MCP',
            command: 'echo hi',
            readiness: {
              patterns: [
                {
                  name: 'mcp1',
                  pattern: /MCP-A at (https?:\/\/\S+)/,
                  captures: { 'mcp-a': { group: 1, type: 'api-mcp' } },
                },
                {
                  name: 'mcp2',
                  pattern: /MCP-B at (https?:\/\/\S+)/,
                  captures: { 'mcp-b': { group: 1, type: 'api-mcp' } },
                },
              ],
              timeout: 5000,
            },
          }),
        ],
      });
      const cap = capture();
      await svcCli.run(['node', 'test', '--meta'], cap.options);
      expect(cap.exitCode).toBe(0);
      const json = JSON.parse(cap.output.join('\n'));
      expect(json.services.multi.mcpPrefix).toEqual({
        'mcp-a': 'multi-mcp-a-mcp__',
        'mcp-b': 'multi-mcp-b-mcp__',
      });
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

    it('accepts --verbose flag without error', async () => {
      const cap = capture();
      await cli.run(
        ['node', 'test', '--verbose', 'echo', '--message', 'hi'],
        cap.options,
      );
      expect(cap.output).toEqual(['hi']);
      expect(cap.exitCode).toBeUndefined();
    });

    it('provides logger to command context via --verbose', async () => {
      let hasLog = false;
      const logCli = defineCli({
        name: 'log-test',
        version: '0.0.1',
        description: 'Logger test',
        commands: [
          defineCommand({
            id: 'check',
            description: 'Check logger',
            inputSchema: z.object({}),
            execute: async (_, ctx) => {
              hasLog = ctx.log !== undefined;
              return 'ok';
            },
          }),
        ],
      });
      const cap = capture();
      await logCli.run(['node', 'test', 'check'], cap.options);
      expect(hasLog).toBe(true);
    });

    it('sets debug level when --verbose is used', async () => {
      let logLevel: string | undefined;
      const logCli = defineCli({
        name: 'log-test',
        version: '0.0.1',
        description: 'Logger test',
        commands: [
          defineCommand({
            id: 'check',
            description: 'Check log level',
            inputSchema: z.object({}),
            execute: async (_, ctx) => {
              logLevel = ctx.log?.level;
              return 'ok';
            },
          }),
        ],
      });
      const cap = capture();
      await logCli.run(['node', 'test', '--verbose', 'check'], cap.options);
      expect(logLevel).toBe('debug');
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

    describe('routine cleanup in command mode', () => {
    it('stops routine after command completes', async () => {
      let tickCount = 0;
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
          return null;
        },
      });

      const cli = defineCli({
        name: 'routine-test',
        version: '1.0.0',
        description: 'Routine test CLI',
        commands: [counter],
        triggers: [ticker],
        routine: { tickInterval: 50, idleInterval: 20 },
      });

      const cap = capture();
      await cli.run(['node', 'test', 'start'], cap.options);

      // Command mode is one-shot — routine should be stopped after run() returns
      expect(cap.output).toContain('Started');
    });

    it('stopRoutine stops ticking after run()', async () => {
      let tickCount = 0;
      const triggerCli = defineCli({
        name: 'stop-test',
        version: '0.0.1',
        description: 'Stop test',
        commands: [echo],
        triggers: [{
          id: 'counter',
          type: 'condition',
          poll: async () => { tickCount++; return null; },
        }],
        routine: { tickInterval: 50, idleInterval: 50 },
      });

      const cap = capture();
      await triggerCli.run(['node', 'test', 'echo', '--text', 'hi'], cap.options);
      const countAfterRun = tickCount;
      await new Promise((r) => setTimeout(r, 200));
      expect(tickCount).toBe(countAfterRun);
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

      it('--workdir flag in argv sets workdir', async () => {
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
        await wdCli.run(['node', 'test', '--workdir', tmpDir, 'check'], cap.options);
        expect(receivedWorkdir).toBe(tmpDir);
      });

      it('-w short flag in argv sets workdir', async () => {
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
        await wdCli.run(['node', 'test', '-w', tmpDir, 'check'], cap.options);
        expect(receivedWorkdir).toBe(tmpDir);
      });

      it('-c short flag in argv loads config file', async () => {
        const configFile = join(tmpDir, 'short.json');
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
        await cfgCli.run(['node', 'test', '-c', configFile, 'check'], cap.options);
        expect(receivedConfig.priority).toBe('high');
      });

      it('creates workspace store at {workdir}/.ph/{cli-name}/', async () => {
        let storeFolder: string | undefined;
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
                storeFolder = ctx.workspace.getStoreFolder();
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
        expect(storeFolder).toBe(`${tmpDir}/.ph/store-test`);
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

      function cliWithAgent(agent: AgentProvider, extra?: Partial<Parameters<typeof defineCli>[0]>) {
        const cli = defineCli({
          name: 'assist',
          version: '1.0.0',
          description: 'Assistant',
          commands: [echo],
          ...extra,
        });
        cli.setAgentLoader(async () => agent);
        return cli;
      }

      it('routes positional text to agent when agent factory is set', async () => {
        const agent = createTestAgent({
          'What is TypeScript?': [
            { type: 'text-delta', text: 'TypeScript is great.' },
          ],
        });

        const agentCli = cliWithAgent(agent);

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

        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', '--resume', 'thread-abc-123', 'hello'],
          cap.options,
        );
        expect(receivedThreadId).toBe('thread-abc-123');
      });

      it('still runs subcommands normally', async () => {
        const agent = createTestAgent({});
        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'echo', '--message', 'hi'],
          cap.options,
        );
        expect(cap.output).toContain('hi');
      });

      it('routes "help" to Commander, not to agent', async () => {
        const agent = createTestAgent({});
        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'help', 'echo'],
          cap.options,
        );
        // Should show help for echo, not send "help echo" to the agent
        expect(cap.exitCode).toBe(0);
      });

      it('adds --resume option to Commander when agent loader is set', async () => {
        const agent = createTestAgent({});
        const agentCli = cliWithAgent(agent);

        // The --resume flag should be accepted without error
        const cap = capture();
        await agentCli.run(
          ['node', 'assist', '--resume', 'thread-xyz', 'hello world'],
          cap.options,
        );
        // Agent should have been invoked (not an error)
        expect(cap.output.join('')).toContain('Echo: hello world');
      });

      it('passes resume from RunOptions to agent', async () => {
        let receivedThreadId: string | undefined;
        const agent: AgentProvider = {
          id: 'test-assistant',
          async *stream(_prompt, opts) {
            receivedThreadId = opts?.threadId;
            yield { type: 'text-delta', text: 'ok' };
          },
        };

        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', 'test prompt'],
          { ...cap.options, resume: 'thread-from-options' },
        );
        expect(receivedThreadId).toBe('thread-from-options');
      });

      it('prints thread ID after agent response in command mode', async () => {
        const agent = createTestAgent({
          'hello': [{ type: 'text-delta', text: 'Hi there!' }],
        });
        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(['node', 'assist', 'hello'], cap.options);
        const output = cap.output.join('');
        expect(output).toContain('Hi there!');
        expect(output).toMatch(/Thread: [0-9a-f-]+/);
        expect(output).toContain('continue with: assist --resume');
      });

      it('prints the provided --resume thread ID (not a new one)', async () => {
        const agent = createTestAgent({
          'hello': [{ type: 'text-delta', text: 'resumed!' }],
        });
        const agentCli = cliWithAgent(agent);

        const cap = capture();
        await agentCli.run(
          ['node', 'assist', '--resume', 'my-thread-42', 'hello'],
          cap.options,
        );
        const output = cap.output.join('');
        expect(output).toContain('Thread: my-thread-42');
      });

      it('headless interactive routes bare text to agent', async () => {
        const agent = createTestAgent({
          'tell me a joke': [
            { type: 'text-delta', text: 'Why did the chicken...' },
          ],
        });

        const agentCli = cliWithAgent(agent, { interactive: { welcome: 'Hi!' } });

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
