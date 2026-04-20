import { describe, it, expect, afterEach } from '@jest/globals';
import {
  defineCli,
  defineCommand,
  defineTrigger,
  createMemoryWorkdirStore,
  createEventBus,
  createProcessManager,
  createRoutine,
} from '@powerhousedao/ph-clint';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
  teardown: async (context) => {
    context.state.lastModified = 0;
  },
  poll: async (context) => {
    if (changeDetected) {
      changeDetected = false;
      return {
        type: 'command' as const,
        params: { commandId: 'build', args: {} },
        callbacks: {
          onSuccess: () => context.context.emit?.('build:complete'),
          onFailure: (err: Error) => context.context.emit?.('build:failed', err),
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

// ── Tests ─────────────────────────────────────────────────────────

describe('defineTrigger', () => {
  it('returns a trigger with id and type', () => {
    expect(fileChangeTrigger.id).toBe('file-change');
    expect(fileChangeTrigger.type).toBe('condition');
  });

  it('has setup, teardown, and poll functions', () => {
    expect(typeof fileChangeTrigger.setup).toBe('function');
    expect(typeof fileChangeTrigger.teardown).toBe('function');
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
        workdir: '',
        workspace: createMemoryWorkdirStore(),
        stdout: () => {},
        config: {},
      },
    });
    routine.start();
    await new Promise(r => setTimeout(r, 350));
    await routine.stop();
    expect(buildCalled).toBe(true);
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

  it('calls trigger teardown on stop', async () => {
    let teardownCalled = false;

    const trigger = defineTrigger({
      id: 'teardown-trigger',
      type: 'condition',
      poll: async () => null,
      teardown: async () => { teardownCalled = true; },
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
    expect(teardownCalled).toBe(true);
  });
});

describe('CLI integration — routine as service', () => {
  it('auto-injects routine service commands (build + config + cli-docs + 7 service commands = 10)', () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 1000,
        idleInterval: 500,
        projectScanner: {
          isProjectFolder: (p: string) => existsSync(join(p, 'src')),
        },
      },
      interactive: {
        welcome: 'File Watcher — /watcher-start to begin, /watcher-ps to check',
      },
    });

    const commands = cli.listCommands();
    const ids = commands.map(c => c.id);

    // Domain command
    expect(ids).toContain('build');

    // Auto-injected service commands
    expect(ids).toContain('watcher-start');
    expect(ids).toContain('watcher-stop');
    expect(ids).toContain('watcher-restart');
    expect(ids).toContain('watcher-ps');
    expect(ids).toContain('watcher-logs');
    expect(ids).toContain('watcher-manage');
    expect(ids).toContain('watcher-ls');

    // Built-in commands
    expect(ids).toContain('config');
    expect(ids).toContain('cli-docs');

    // build + config + cli-docs + 7 service commands = 10
    expect(commands).toHaveLength(10);
  });

  it('watcher-ps shows idle status before start', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 100,
        idleInterval: 50,
      },
    });

    const output: string[] = [];
    await cli.run(['node', 'test', 'watcher-ps'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });

    expect(output.join('\n')).toContain('idle');
  });

  it('watcher-start starts routine, auto-stops in command mode', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 100,
        idleInterval: 50,
      },
    });

    const output: string[] = [];
    await cli.run(['node', 'test', 'watcher-start'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });

    // Should have started and shown status
    const text = output.join('\n');
    expect(text).toContain('File Watcher');
  });

  it('watcher-ls scans for projects', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 1000,
        idleInterval: 500,
        projectScanner: {
          isProjectFolder: (p: string) => existsSync(join(p, 'src')),
        },
      },
    });

    const output: string[] = [];
    await cli.run(['node', 'test', 'watcher-ls'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });

    // Should show something — either found projects or "No File Watcher projects found"
    expect(output.length).toBeGreaterThan(0);
  });

  it('executes build command with process manager', async () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 1000,
        idleInterval: 500,
      },
    });

    const result = await cli.execute('build', {}) as any;
    expect(result.text).toBe('Build succeeded');
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

  it('help output groups routine commands under service name', () => {
    const cli = defineCli({
      name: 'watcher',
      version: '1.0.0',
      description: 'File watcher',
      configSchema,
      commands: [build],
      triggers: [fileChangeTrigger],
      routine: {
        id: 'watcher',
        name: 'File Watcher',
        tickInterval: 1000,
        idleInterval: 500,
      },
    });

    const help = cli.generateHelp();
    expect(help).toContain('File Watcher:');
    expect(help).toContain('watcher-start');
    expect(help).toContain('watcher-ps');
  });
});
