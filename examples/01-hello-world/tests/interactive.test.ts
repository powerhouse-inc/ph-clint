import { describe, it, expect } from '@jest/globals';
import { defineCli, createReplSession, createMemoryWorkdirStore } from 'ph-clint';
import { greet } from '../src/commands/greet.js';

const cli = defineCli({
  name: 'hello',
  version: '1.0.0',
  description: 'A minimal ph-clint example',
  commands: [greet],
  interactive: {
    welcome: 'Hello World CLI — type /help for commands',
  },
});

describe('Interactive mode', () => {
  function makeSession() {
    return createReplSession({
      cli,
      context: { workdir: '', workspace: createMemoryWorkdirStore(), config: {} },
    });
  }

  it('has welcome message', () => {
    const session = makeSession();
    expect(session.welcome).toBe('Hello World CLI — type /help for commands');
  });

  it('/greet --name Alice returns greeting', async () => {
    const session = makeSession();
    const result = await session.processInput('/greet --name Alice');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Hello, Alice!');
  });

  it('/greet --name Alice --loud returns uppercase greeting', async () => {
    const session = makeSession();
    const result = await session.processInput('/greet --name Alice --loud');
    expect(result.type).toBe('result');
    expect(result.text).toContain('HELLO, ALICE!');
  });

  it('/greet without --name returns error', async () => {
    const session = makeSession();
    const result = await session.processInput('/greet');
    expect(result.type).toBe('error');
    expect(result.text).toContain('name');
  });

  it('/help lists the greet command', async () => {
    const session = makeSession();
    const result = await session.processInput('/help');
    expect(result.type).toBe('help');
    expect(result.text).toContain('greet');
    expect(result.text).toContain('Greet someone by name');
  });

  it('/exit returns exit response', async () => {
    const session = makeSession();
    const result = await session.processInput('/exit');
    expect(result.type).toBe('exit');
  });

  it('auto-completes /gr to /greet', () => {
    const session = makeSession();
    const completions = session.getCompletions('/gr');
    expect(completions).toEqual(['/greet']);
  });

  it('auto-completes / to include greet and builtins', () => {
    const session = makeSession();
    const completions = session.getCompletions('/');
    expect(completions).toContain('/greet');
    expect(completions).toContain('/help');
    expect(completions).toContain('/exit');
  });

  it('shows ghost suggestion for /greet with first flag', () => {
    const session = makeSession();
    const ghost = session.getGhostSuggestion('/greet ');
    expect(ghost).toContain('--name');
  });

  it('returns null ghost suggestion for non-command input', () => {
    const session = makeSession();
    expect(session.getGhostSuggestion('hello')).toBeNull();
  });
});

describe('Headless interactive mode via run()', () => {
  it('processes commands via interactiveInput', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/greet --name Alice';
        yield '/exit';
      })(),
    });

    expect(output[0]).toBe('Hello World CLI — type /help for commands');
    expect(output).toEqual(
      expect.arrayContaining([expect.stringContaining('Hello, Alice!')]),
    );
  });
});
