import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  defineCli,
  defineCommand,
  createReplSession,
  createMemoryWorkspace,
  createEventBus,
  createProcessManager,
} from 'ph-clint';
import type { ReplSession, CommandContext } from 'ph-clint';
import { z } from 'zod';

// Simplified versions of file-watcher commands for testing.
// We avoid importing the real trigger to keep tests fast and deterministic.
const build = defineCommand({
  id: 'build',
  description: 'Run the build command',
  inputSchema: z.object({}),
  execute: async (_, { config, processes }) => {
    const command = (config as any).buildCommand ?? 'echo build-ok';
    const result = await processes!.run(command, { label: 'build', timeout: 5000 });
    return { text: result.success ? 'Build succeeded' : 'Build failed' };
  },
});

const status = defineCommand({
  id: 'status',
  description: 'Show watcher and build status',
  inputSchema: z.object({}),
  execute: async (_, { routine, processes }) => {
    const running = processes!.list().filter((p) => p.status === 'running');
    return {
      text: [`Routine: ${routine?.status ?? 'not configured'}`, `Running processes: ${running.length}`].join(
        '\n',
      ),
    };
  },
});

const configSchema = z.object({
  watchDir: z.string().default('./src'),
  buildCommand: z.string().default('echo test-build'),
});

const cli = defineCli({
  name: 'watcher',
  version: '1.0.0',
  description: 'A file watcher that triggers builds on changes',
  configSchema,
  commands: [build, status],
  interactive: {
    welcome: 'File Watcher — /watch to start, /status to check',
  },
});

describe('Interactive mode', () => {
  let session: ReplSession;
  let processManager: ReturnType<typeof createProcessManager>;
  let context: CommandContext;

  beforeEach(() => {
    processManager = createProcessManager();
    context = {
      workdir: '',
      workspace: createMemoryWorkspace(),
      config: { watchDir: './src', buildCommand: 'echo test-build' },
      processes: processManager,
    };
    session = createReplSession({ cli, context });
  });

  it('has welcome message', () => {
    expect(session.welcome).toBe(
      'File Watcher — /watch to start, /status to check',
    );
  });

  it('/status shows routine and process status', async () => {
    const result = await session.processInput('/status');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Routine:');
    expect(result.text).toContain('Running processes: 0');
  });

  it('/build runs the build command', async () => {
    const result = await session.processInput('/build');
    expect(result.type).toBe('result');
    expect(result.text).toContain('Build succeeded');
  });

  it('/help lists commands', async () => {
    const result = await session.processInput('/help');
    expect(result.type).toBe('help');
    expect(result.text).toContain('build');
    expect(result.text).toContain('status');
  });

  describe('auto-completion', () => {
    it('completes /b to /build', () => {
      expect(session.getCompletions('/b')).toEqual(['/build']);
    });

    it('completes /s to /status', () => {
      expect(session.getCompletions('/s')).toEqual(['/status']);
    });
  });
});

describe('Headless interactive mode via run()', () => {
  it('shows welcome and processes help', async () => {
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

    expect(output[0]).toBe(
      'File Watcher — /watch to start, /status to check',
    );
    const helpOutput = output.find((o) => o.includes('build'));
    expect(helpOutput).toBeDefined();
  });
});
