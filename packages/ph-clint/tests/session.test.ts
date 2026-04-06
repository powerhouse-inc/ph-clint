import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  defineCli,
  defineCommand,
  createReplSession,
  createMemoryWorkspace,
} from '../src/index.js';
import type { ReplSession, CommandContext } from '../src/index.js';

describe('createReplSession', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone by name',
    inputSchema: z.object({
      name: z.string().describe('Name of the person to greet'),
      loud: z.boolean().default(false).describe('Shout the greeting'),
    }),
    execute: async ({ name, loud }) => {
      const msg = `Hello, ${name}!`;
      return loud ? msg.toUpperCase() : msg;
    },
  });

  const echo = defineCommand({
    id: 'echo',
    description: 'Echo a message',
    inputSchema: z.object({
      message: z.string().describe('Message to echo'),
    }),
    execute: async ({ message }) => ({ text: message, data: { message } }),
  });

  const errorCmd = defineCommand({
    id: 'fail',
    description: 'Always fails',
    inputSchema: z.object({}),
    execute: async () => {
      throw new Error('command failed');
    },
  });

  const cli = defineCli({
    name: 'test',
    version: '1.0.0',
    description: 'Test CLI',
    commands: [greet, echo, errorCmd],
    interactive: { welcome: 'Welcome to Test CLI' },
  });

  let session: ReplSession;
  let context: CommandContext;

  beforeEach(() => {
    context = { workspace: createMemoryWorkspace(), config: {} };
    session = createReplSession({ cli, context });
  });

  describe('welcome', () => {
    it('returns the welcome message', () => {
      expect(session.welcome).toBe('Welcome to Test CLI');
    });
  });

  describe('processInput', () => {
    it('handles empty input', async () => {
      const result = await session.processInput('');
      expect(result.type).toBe('empty');
    });

    it('handles /help', async () => {
      const result = await session.processInput('/help');
      expect(result.type).toBe('help');
      expect(result.text).toContain('greet');
      expect(result.text).toContain('echo');
      expect(result.text).toContain('/help');
      expect(result.text).toContain('/exit');
    });

    it('handles /exit', async () => {
      const result = await session.processInput('/exit');
      expect(result.type).toBe('exit');
      expect(result.text).toBe('Goodbye!');
    });

    it('handles /quit', async () => {
      const result = await session.processInput('/quit');
      expect(result.type).toBe('exit');
    });

    it('executes a command returning a string', async () => {
      const result = await session.processInput('/greet --name Alice');
      expect(result.type).toBe('result');
      expect(result.text).toContain('Hello, Alice!');
    });

    it('executes a command with boolean flag', async () => {
      const result = await session.processInput('/greet --name Alice --loud');
      expect(result.type).toBe('result');
      expect(result.text).toContain('HELLO, ALICE!');
    });

    it('executes a command returning { text }', async () => {
      const result = await session.processInput('/echo --message "Hello World"');
      expect(result.type).toBe('result');
      expect(result.text).toContain('Hello World');
    });

    it('returns error for unknown command', async () => {
      const result = await session.processInput('/nonexistent');
      expect(result.type).toBe('error');
      expect(result.text).toContain('Unknown command');
      expect(result.text).toContain('nonexistent');
    });

    it('returns error for bare text', async () => {
      const result = await session.processInput('just some text');
      expect(result.type).toBe('error');
      expect(result.text).toContain('/help');
    });

    it('returns error for missing required arg', async () => {
      const result = await session.processInput('/greet');
      expect(result.type).toBe('error');
      expect(result.text).toContain('name');
    });

    it('returns error when command throws', async () => {
      const result = await session.processInput('/fail');
      expect(result.type).toBe('error');
      expect(result.text).toContain('command failed');
    });
  });

  describe('processInput — result formatting', () => {
    it('handles command returning null', async () => {
      const nullCmd = defineCommand({
        id: 'null',
        description: 'Returns null',
        inputSchema: z.object({}),
        execute: async () => null as unknown,
      });
      const nullCli = defineCli({
        name: 'test',
        version: '1.0.0',
        description: 'test',
        commands: [nullCmd],
        interactive: { welcome: '' },
      });
      const s = createReplSession({
        cli: nullCli,
        context: { workspace: createMemoryWorkspace(), config: {} },
      });
      const result = await s.processInput('/null');
      expect(result.type).toBe('result');
      expect(result.text).toBe('');
    });
  });

  describe('getCompletions', () => {
    it('completes command names', () => {
      const result = session.getCompletions('/gr');
      expect(result).toEqual(['/greet']);
    });

    it('returns all commands for /', () => {
      const result = session.getCompletions('/');
      expect(result).toContain('/greet');
      expect(result).toContain('/echo');
      expect(result).toContain('/fail');
      expect(result).toContain('/help');
      expect(result).toContain('/exit');
    });
  });

  describe('getCommandSignature', () => {
    it('returns signature for known command', () => {
      const sig = session.getCommandSignature('/greet');
      expect(sig).toContain('--name <name>');
      expect(sig).toContain('[--loud]');
    });

    it('returns null when args present', () => {
      expect(session.getCommandSignature('/greet --name')).toBeNull();
    });

    it('returns null for unknown command', () => {
      expect(session.getCommandSignature('/unknown')).toBeNull();
    });
  });
});

describe('headless interactive mode via run()', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone by name',
    inputSchema: z.object({
      name: z.string().describe('Name'),
    }),
    execute: async ({ name }) => `Hello, ${name}!`,
  });

  const cli = defineCli({
    name: 'test',
    version: '1.0.0',
    description: 'Test CLI',
    commands: [greet],
    interactive: { welcome: 'Welcome!' },
  });

  it('runs commands from interactiveInput and prints output', async () => {
    const output: string[] = [];
    const inputs = ['/greet --name Alice', '/exit'];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        for (const input of inputs) yield input;
      })(),
    });

    expect(output[0]).toBe('Welcome!');
    expect(output).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Hello, Alice!'),
      ]),
    );
    expect(output).toContain('Goodbye!');
  });

  it('shows welcome message', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/exit';
      })(),
    });

    expect(output[0]).toBe('Welcome!');
  });

  it('handles /help in headless mode', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/help';
        yield '/exit';
      })(),
    });

    const helpOutput = output.find((o) => o.includes('greet'));
    expect(helpOutput).toBeDefined();
  });

  it('rejects -i when interactive is not configured', async () => {
    const noInteractive = defineCli({
      name: 'test',
      version: '1.0.0',
      description: 'No interactive',
      commands: [greet],
    });

    const errors: string[] = [];
    let exitCode: number | undefined;

    await noInteractive.run(['node', 'test', '-i'], {
      stdout: () => {},
      stderr: (msg) => errors.push(msg),
      exit: (code) => { exitCode = code; },
    });

    expect(errors[0]).toContain('not configured');
    expect(exitCode).toBe(1);
  });
});
