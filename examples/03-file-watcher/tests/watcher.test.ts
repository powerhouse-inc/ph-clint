import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  defineCli,
  defineCommand,
  defineTrigger,
  createMemoryWorkspace,
  createEventBus,
  createProcessManager,
  createRoutine,
} from 'ph-clint';
import { z } from 'zod';

// ── Trigger definition ────────────────────────────────────────────

const configSchema = z.object({
  watchDir: z.string().default('./src').describe('Directory to watch'),
  buildCommand: z.string().default('echo build-ok').describe('Build command to execute'),
});

let changeDetected = false;

const fileChangeTrigger = defineTrigger({
  id: 'file-change',
  type: 'condition',
  setup: async (context) => {
    context.state.lastCheck = Date.now();
  },
  poll: async (context) => {
    if (changeDetected) {
      changeDetected = false;
      return {
        type: 'command' as const,
        params: { commandId: 'build', args: {} },
        callbacks: {
          onSuccess: () => context.emit('build:complete'),
          onFailure: (err: Error) => context.emit('build:failed', err),
        },
      };
    }
    return null;
  },
});

// ── Command definitions ───────────────────────────────────────────

const build = defineCommand({
  id: 'build',
  description: 'Run the build command',
  inputSchema: z.object({}),
  execute: async (_, { config, processes }) => {
    const result = await processes!.run(config.buildCommand as string, {
      label: 'build',
      timeout: 5_000,
    });
    return { text: result.success ? 'Build succeeded' : 'Build failed' };
  },
});

const watch = defineCommand({
  id: 'watch',
  description: 'Start watching for file changes',
  inputSchema: z.object({}),
  execute: async (_, { routine }) => {
    routine!.start();
    return { text: 'Watching for changes...' };
  },
});

const status = defineCommand({
  id: 'status',
  description: 'Show watcher and build status',
  inputSchema: z.object({}),
  execute: async (_, { routine, processes }) => {
    const running = processes!.list().filter(p => p.status === 'running');
    return {
      text: [
        `Routine: ${routine!.status}`,
        `Running processes: ${running.length}`,
      ].join('\n'),
    };
  },
});

// ── Tests ─────────────────────────────────────────────────────────

describe('defineTrigger', () => {
  it('returns a trigger with id and type', () => {
    expect(fileChangeTrigger.id).toBe('file-change');
    expect(fileChangeTrigger.type).toBe('condition');
  });

  it('has setup and poll functions', () => {
    expect(typeof fileChangeTrigger.setup).toBe('function');
    expect(typeof fileChangeTrigger.poll).toBe('function');
  });
});

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = createEventBus();
    const received: unknown[] = [];
    bus.on('test', (data) => received.push(data));
    bus.emit('test', { value: 42 });
    expect(received).toEqual([{ value: 42 }]);
  });

  it('removes listeners with off()', () => {
    const bus = createEventBus();
    const received: unknown[] = [];
    const handler = (data: unknown) => received.push(data);
    bus.on('test', handler);
    bus.emit('test', 1);
    bus.off('test', handler);
    bus.emit('test', 2);
    expect(received).toEqual([1]);
  });
});

describe('ProcessManager', () => {
  it('runs a command and returns success', async () => {
    const pm = createProcessManager();
    const result = await pm.run('echo hello', { label: 'echo-test' });
    expect(result.success).toBe(true);
    expect(result.output).toContain('hello');
  });

  it('returns failure for a bad command', async () => {
    const pm = createProcessManager();
    const result = await pm.run('exit 1', { label: 'fail-test' });
    expect(result.success).toBe(false);
  });

  it('lists running processes (empty when all complete)', async () => {
    const pm = createProcessManager();
    await pm.run('echo done', { label: 'done-test' });
    const running = pm.list().filter(p => p.status === 'running');
    expect(running).toHaveLength(0);
  });

  it('times out long-running commands', async () => {
    const pm = createProcessManager();
    const result = await pm.run('node -e "setTimeout(()=>{},30000)"', { label: 'timeout-test', timeout: 300 });
    expect(result.success).toBe(false);
    // Wait for process cleanup
    await new Promise(r => setTimeout(r, 200));
  }, 10_000);
});

describe('Routine', () => {
  let routine: ReturnType<typeof createRoutine>;

  afterEach(async () => {
    if (routine && routine.status === 'running') {
      await routine.stop();
    }
  });

  it('starts in init status', () => {
    routine = createRoutine({
      triggers: [],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    expect(routine.status).toBe('init');
  });

  it('transitions to running on start()', async () => {
    routine = createRoutine({
      triggers: [],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();
    // Give the loop a tick to transition
    await new Promise(r => setTimeout(r, 50));
    expect(routine.status).toBe('running');
  });

  it('transitions to ready on stop()', async () => {
    routine = createRoutine({
      triggers: [],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();
    await new Promise(r => setTimeout(r, 50));
    await routine.stop();
    expect(routine.status).toBe('ready');
  });

  it('executes work items from triggers', async () => {
    let executed = false;
    let triggerFired = false;

    const trigger = defineTrigger({
      id: 'test-trigger',
      type: 'condition',
      poll: async () => {
        if (!triggerFired) {
          triggerFired = true;
          return {
            type: 'function' as const,
            params: {
              fn: async () => { executed = true; },
            },
          };
        }
        return null;
      },
    });

    routine = createRoutine({
      triggers: [trigger],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();

    // Wait for a couple ticks
    await new Promise(r => setTimeout(r, 350));
    await routine.stop();

    expect(executed).toBe(true);
  });

  it('dispatches command work items to registered commands', async () => {
    let buildCalled = false;
    let triggerFired = false;

    const trigger = defineTrigger({
      id: 'build-trigger',
      type: 'condition',
      poll: async () => {
        if (!triggerFired) {
          triggerFired = true;
          return {
            type: 'command' as const,
            params: { commandId: 'build', args: {} },
          };
        }
        return null;
      },
    });

    const buildCmd = defineCommand({
      id: 'build',
      description: 'Build',
      inputSchema: z.object({}),
      execute: async () => {
        buildCalled = true;
        return { text: 'built' };
      },
    });

    const commands = new Map([['build', buildCmd]]);

    routine = createRoutine({
      triggers: [trigger],
      commands,
      tickInterval: 100,
      idleInterval: 50,
      context: {
        workspace: createMemoryWorkspace(),
        config: {},
      },
    });
    routine.start();

    await new Promise(r => setTimeout(r, 350));
    await routine.stop();

    expect(buildCalled).toBe(true);
  });

  it('calls onSuccess callback on successful work item', async () => {
    let successCalled = false;
    let triggerFired = false;

    const trigger = defineTrigger({
      id: 'cb-trigger',
      type: 'condition',
      poll: async () => {
        if (!triggerFired) {
          triggerFired = true;
          return {
            type: 'function' as const,
            params: { fn: async () => 'ok' },
            callbacks: {
              onSuccess: () => { successCalled = true; },
            },
          };
        }
        return null;
      },
    });

    routine = createRoutine({
      triggers: [trigger],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();

    await new Promise(r => setTimeout(r, 350));
    await routine.stop();

    expect(successCalled).toBe(true);
  });

  it('calls onFailure callback on failed work item', async () => {
    let failureCalled = false;
    let triggerFired = false;

    const trigger = defineTrigger({
      id: 'fail-trigger',
      type: 'condition',
      poll: async () => {
        if (!triggerFired) {
          triggerFired = true;
          return {
            type: 'function' as const,
            params: { fn: async () => { throw new Error('boom'); } },
            callbacks: {
              onFailure: () => { failureCalled = true; },
            },
          };
        }
        return null;
      },
    });

    routine = createRoutine({
      triggers: [trigger],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();

    await new Promise(r => setTimeout(r, 350));
    await routine.stop();

    expect(failureCalled).toBe(true);
  });

  it('calls trigger setup before first poll', async () => {
    let setupCalled = false;

    const trigger = defineTrigger({
      id: 'setup-trigger',
      type: 'condition',
      setup: async () => { setupCalled = true; },
      poll: async () => null,
    });

    routine = createRoutine({
      triggers: [trigger],
      commands: new Map(),
      tickInterval: 100,
      idleInterval: 50,
    });
    routine.start();

    await new Promise(r => setTimeout(r, 150));
    await routine.stop();

    expect(setupCalled).toBe(true);
  });
});

describe('CLI integration', () => {
  it('accepts triggers and routine config in defineCli', () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build, watch, status],
      triggers: [fileChangeTrigger],
      routine: {
        tickInterval: 1000,
        idleInterval: 500,
      },
      interactive: {
        welcome: 'File Watcher — /watch to start, /status to check',
      },
    });

    expect(cli.name).toBe('watcher');
    expect(cli.listCommands()).toHaveLength(3);
  });

  it('executes build command with process manager', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build, watch, status],
      triggers: [fileChangeTrigger],
      routine: { tickInterval: 1000, idleInterval: 500 },
    });

    const result = await cli.execute('build', {}) as any;
    expect(result.text).toBe('Build succeeded');
  });

  it('executes status command with routine info', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build, watch, status],
      triggers: [fileChangeTrigger],
      routine: { tickInterval: 1000, idleInterval: 500 },
    });

    const result = await cli.execute('status', {}) as any;
    expect(result.text).toContain('Routine:');
    expect(result.text).toContain('Running processes:');
  });

  it('watch command starts the routine', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build, watch, status],
      triggers: [fileChangeTrigger],
      routine: { tickInterval: 100, idleInterval: 50 },
    });

    const result = await cli.execute('watch', {}) as any;
    expect(result.text).toBe('Watching for changes...');

    // Give it a tick
    await new Promise(r => setTimeout(r, 50));

    const statusResult = await cli.execute('status', {}) as any;
    expect(statusResult.text).toContain('Routine: running');

    // Clean up — stop the routine via internal handle
    await cli.stopRoutine?.();
  });

  it('config env vars are derived from config schema', () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
    });

    const envVars = cli.configEnvVars();
    expect(envVars).toContainEqual({
      name: 'WATCHER_WATCH_DIR',
      field: 'watchDir',
      description: 'Directory to watch',
    });
    expect(envVars).toContainEqual({
      name: 'WATCHER_BUILD_COMMAND',
      field: 'buildCommand',
      description: 'Build command to execute',
    });
  });
});
