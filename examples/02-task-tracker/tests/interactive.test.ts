import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  defineCli,
  createReplSession,
  createMemoryWorkdirStore,
} from 'ph-clint';
import type { WorkdirStore, ReplSession } from 'ph-clint';
import { z } from 'zod';
import { add } from '../src/commands/add.js';
import { list } from '../src/commands/list.js';
import { done } from '../src/commands/done.js';
import { remove } from '../src/commands/remove.js';

const configSchema = z.object({
  defaultPriority: z
    .enum(['low', 'medium', 'high'])
    .default('medium')
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

describe('Interactive mode', () => {
  let workspace: WorkdirStore;
  let session: ReplSession;

  beforeEach(() => {
    workspace = createMemoryWorkdirStore();
    session = createReplSession({
      cli,
      context: { workdir: '', workspace, config: { defaultPriority: 'medium' } },
    });
  });

  it('has welcome message', () => {
    expect(session.welcome).toBe('Task Tracker — type /help for commands');
  });

  it('/add --title creates a task with default priority', async () => {
    const result = await session.processInput('/add --title "Write tests"');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Write tests');
    expect(result.text).toContain('medium');
  });

  it('/add --title --priority creates task with specified priority', async () => {
    const result = await session.processInput(
      '/add --title "Urgent" --priority high',
    );
    expect(result.type).toBe('result');
    expect(result.text).toContain('Urgent');
    expect(result.text).toContain('high');
  });

  it('/add without args prompts for required title then optional priority', async () => {
    const r1 = await session.processInput('/add');
    expect(r1.type).toBe('prompt');
    expect(r1.promptLabel).toBe('title');

    const r2 = await session.processInput('Buy milk');
    expect(r2.type).toBe('prompt');
    expect(r2.promptLabel).toBe('priority');

    // Accept default
    const r3 = await session.processInput('');
    expect(r3.type).toBe('result');
    expect(r3.text).toContain('Buy milk');
    expect(r3.text).toContain('medium');
  });

  it('/list shows tasks', async () => {
    await session.processInput('/add --title "Task 1"');
    await session.processInput('/add --title "Task 2"');
    const result = await session.processInput('/list');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Task 1');
    expect(result.text).toContain('Task 2');
  });

  it('/done marks a task as completed', async () => {
    await session.processInput('/add --title "Write tests"');
    const result = await session.processInput('/done --title tests');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Completed');
    expect(result.text).toContain('Write tests');
  });

  it('/list --filter done shows completed tasks', async () => {
    await session.processInput('/add --title "Write tests"');
    await session.processInput('/done --title tests');
    const result = await session.processInput('/list --filter done');
    expect(result.type).toBe('result');
    expect(result.text).toContain('[x]');
    expect(result.text).toContain('Write tests');
  });

  it('/remove removes a task', async () => {
    await session.processInput('/add --title "Temp task"');
    const result = await session.processInput('/remove --title Temp');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Removed');
  });

  it('/help lists all commands', async () => {
    const result = await session.processInput('/help');
    expect(result.type).toBe('help');
    expect(result.text).toContain('add');
    expect(result.text).toContain('list');
    expect(result.text).toContain('done');
    expect(result.text).toContain('remove');
  });

  describe('auto-completion', () => {
    it('completes command names', () => {
      expect(session.getCompletions('/a')).toEqual(['/add']);
      expect(session.getCompletions('/l')).toEqual(['/list']);
    });

    it('completes --filter enum values', () => {
      const result = session.getCompletions('/list --filter d');
      expect(result).toEqual(['done']);
    });

    it('completes all --filter values', () => {
      const result = session.getCompletions('/list --filter ');
      expect(result).toContain('all');
      expect(result).toContain('open');
      expect(result).toContain('done');
    });
  });
});

describe('Headless interactive mode via run()', () => {
  it('runs a task workflow', async () => {
    const output: string[] = [];

    await cli.run(['node', 'test', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/add --title "Write tests" --priority high';
        yield '/list';
        yield '/exit';
      })(),
    });

    expect(output[0]).toBe('Task Tracker — type /help for commands');
    expect(output).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Write tests'),
        expect.stringContaining('high'),
      ]),
    );
  });
});
