import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import { defineService, defineCli, defineCommand, createServiceManager, createEventBus, formatStatus } from '../src/index.js';
import { createServiceCommands } from '../src/core/service-command.js';
import type { ServiceDefinition, ServiceManager, ServiceInstanceStatus, CommandContext, EventBus } from '../src/core/types.js';
import { createMemoryWorkdirStore } from '../src/core/store.js';

const TEST_SERVICE = path.resolve(import.meta.dirname, 'fixtures/test-service.js');

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-svc-cmd-'));
}

function safeKill(pid: number): void {
  try { process.kill(-pid, 'SIGKILL'); } catch { /* ignore */ }
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
}

function collectPids(servicesDir: string): number[] {
  const pids: number[] = [];
  try {
    for (const dir of fs.readdirSync(servicesDir)) {
      const subDir = path.join(servicesDir, dir);
      try {
        const stat = fs.statSync(subDir);
        if (!stat.isDirectory()) continue;
        for (const f of fs.readdirSync(subDir)) {
          if (f.endsWith('.json')) {
            try {
              const state = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf-8'));
              if (state.pid) pids.push(state.pid);
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return pids;
}

describe('formatStatus', () => {
  it('shows ● icon for ready status', () => {
    const result = formatStatus({ serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'ready', pid: 123 });
    expect(result).toContain('●');
    expect(result).toContain('My Svc');
    expect(result).toContain('ready');
    expect(result).toContain('pid 123');
  });

  it('shows ◐ icon for starting status', () => {
    const result = formatStatus({ serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'starting' });
    expect(result).toContain('◐');
    expect(result).toContain('starting');
  });

  it('shows ✗ icon for failed status', () => {
    const result = formatStatus({ serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'failed' });
    expect(result).toContain('✗');
    expect(result).toContain('failed');
  });

  it('shows ◑ icon for stopping status', () => {
    const result = formatStatus({ serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'stopping' as ServiceInstanceStatus['status'] });
    expect(result).toContain('◑');
    expect(result).toContain('stopping');
  });

  it('shows ○ icon for idle status', () => {
    const result = formatStatus({ serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'idle' });
    expect(result).toContain('○');
    expect(result).toContain('idle');
  });

  it('includes endpoints in output', () => {
    const result = formatStatus({
      serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'ready',
      endpoints: { port: '3000', url: 'http://localhost:3000' },
    });
    expect(result).toContain('port=3000');
    expect(result).toContain('url=http://localhost:3000');
  });

  it('does not show endpoints section when endpoints object is empty', () => {
    const result = formatStatus({
      serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'ready',
      endpoints: {},
    });
    expect(result).not.toContain('=');
  });

  it('includes error in output', () => {
    const result = formatStatus({
      serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'failed',
      error: 'Process crashed',
    });
    expect(result).toContain('error: Process crashed');
  });

  it('includes restart attempt in output', () => {
    const result = formatStatus({
      serviceId: 'svc', instanceId: 'svc', label: 'My Svc', status: 'starting',
      restartAttempt: 2,
    });
    expect(result).toContain('restart #2');
  });
});

describe('createServiceCommands', () => {
  it('generates 6 commands per service', () => {
    const def: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: 'echo start',
    };
    const cmds = createServiceCommands(def);
    expect(cmds).toHaveLength(6);
    const ids = cmds.map((c) => c.id);
    expect(ids).toEqual([
      'vetra-start', 'vetra-stop', 'vetra-restart',
      'vetra-ps', 'vetra-logs', 'vetra-manage',
    ]);
  });

  it('omits --instance flag when maxInstances is 1 (default)', () => {
    const def: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: 'echo start',
    };
    const cmds = createServiceCommands(def);
    const stopCmd = cmds.find((c) => c.id === 'vetra-stop')!;
    const parsed = stopCmd.inputSchema.parse({});
    // instance field should not exist
    expect(parsed).toEqual({});
  });

  it('includes --instance flag when maxInstances > 1', () => {
    const def: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: 'echo start',
      maxInstances: 3,
    };
    const cmds = createServiceCommands(def);
    const stopCmd = cmds.find((c) => c.id === 'vetra-stop')!;
    const parsed = stopCmd.inputSchema.parse({ instance: 'vetra:web' });
    expect(parsed).toEqual({ instance: 'vetra:web' });
  });

  it('includes --name flag in start when maxInstances > 1', () => {
    const def: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: 'echo start',
      maxInstances: 3,
    };
    const cmds = createServiceCommands(def);
    const startCmd = cmds.find((c) => c.id === 'vetra-start')!;
    const parsed = startCmd.inputSchema.parse({ name: 'web' });
    expect(parsed).toEqual({ name: 'web', workdir: undefined });
  });

  it('merges paramsSchema fields into start command', () => {
    const def: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: 'echo start',
      paramsSchema: z.object({
        port: z.coerce.number().default(3000).describe('Port number'),
        watch: z.boolean().default(true).describe('Watch mode'),
      }),
    };
    const cmds = createServiceCommands(def);
    const startCmd = cmds.find((c) => c.id === 'vetra-start')!;
    const parsed = startCmd.inputSchema.parse({ port: '4000' }) as Record<string, unknown>;
    expect(parsed.port).toBe(4000);
    expect(parsed.watch).toBe(true);
  });
});

describe('createServiceCommands — no services', () => {
  it('shows "No instances" when service list is empty', async () => {
    const emptyMgr: ServiceManager = {
      start: async () => 'test',
      stop: async () => {},
      list: () => [],
      getDefinition: () => undefined,
      logs: () => '',
      watchLogs: () => () => {},
    };
    const def: ServiceDefinition = {
      id: 'test-svc',
      label: 'Test Service',
      command: 'echo start',
    };
    const cmds = createServiceCommands(def);
    const psCmd = cmds.find((c) => c.id === 'test-svc-ps')!;
    const ctx: CommandContext = {
      workdir: '/tmp',
      workspace: createMemoryWorkdirStore(),
      config: {},
      stdout: () => {},
      services: emptyMgr,
    };
    const result = await psCmd.execute({}, ctx) as any;
    expect(result.text).toBe('No instances of test-svc');
  });
});

describe('createServiceCommands — with real services', () => {
  let tmpDir: string;
  let servicesDir: string;
  let eventBus: EventBus;
  let mgr: ServiceManager;
  let trackedPids: number[];

  const readyDef: ServiceDefinition = {
    id: 'test-svc',
    label: 'Test Service',
    command: `node ${TEST_SERVICE}`,
    env: () => ({ TEST_SERVICE_MODE: 'ready', TEST_SERVICE_PORT: '4567' }),
    readiness: {
      pattern: /Server listening on http:\/\/localhost:(\d+)/,
      timeout: 5000,
      captures: { port: 1 },
    },
    shutdown: { signal: 'SIGTERM', timeout: 3000 },
  };

  const secondDef: ServiceDefinition = {
    id: 'second-svc',
    label: 'Second Service',
    command: `node ${TEST_SERVICE}`,
    env: () => ({ TEST_SERVICE_MODE: 'ready', TEST_SERVICE_PORT: '4568' }),
    readiness: {
      pattern: /Server listening on http:\/\/localhost:(\d+)/,
      timeout: 5000,
      captures: { port: 1 },
    },
    shutdown: { signal: 'SIGTERM', timeout: 3000 },
  };

  beforeEach(() => {
    tmpDir = makeTmpDir();
    servicesDir = path.join(tmpDir, 'services');
    eventBus = createEventBus();
    trackedPids = [];
    mgr = createServiceManager([readyDef, secondDef], {
      config: {},
      servicesDir,
      eventBus,
    });
  });

  afterEach(() => {
    const pids = [...trackedPids, ...collectPids(servicesDir)];
    for (const pid of pids) safeKill(pid);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeContext(): CommandContext {
    return {
      workdir: tmpDir,
      workspace: createMemoryWorkdirStore(),
      config: {},
      stdout: () => {},
      services: mgr,
    };
  }

  describe('ps command', () => {
    it('shows idle status when no services are running', async () => {
      const cmds = createServiceCommands(readyDef);
      const psCmd = cmds.find((c) => c.id === 'test-svc-ps')!;
      const result = await psCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('idle');
      expect(result.text).toContain('Test Service');
    });

    it('shows ready status after starting', async () => {
      await mgr.start('test-svc');
      trackedPids.push(mgr.list('test-svc').find(s => s.serviceId === 'test-svc')!.pid!);

      const cmds = createServiceCommands(readyDef);
      const psCmd = cmds.find((c) => c.id === 'test-svc-ps')!;
      const result = await psCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('ready');
      expect(result.text).toContain('Test Service');
    });
  });

  describe('start command', () => {
    it('starts a service', async () => {
      const cmds = createServiceCommands(readyDef);
      const startCmd = cmds.find((c) => c.id === 'test-svc-start')!;
      const result = await startCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('ready');
      expect(result.text).toContain('Test Service');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('reports error for already running service', async () => {
      await mgr.start('test-svc', { workdir: tmpDir });
      trackedPids.push(...collectPids(servicesDir));

      const cmds = createServiceCommands(readyDef);
      const startCmd = cmds.find((c) => c.id === 'test-svc-start')!;
      const result = await startCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('already running');
    });
  });

  describe('stop command', () => {
    it('stops a running service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmds = createServiceCommands(readyDef);
      const stopCmd = cmds.find((c) => c.id === 'test-svc-stop')!;
      const result = await stopCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('stopped');
    });

    it('reports error for not-running service', async () => {
      const cmds = createServiceCommands(readyDef);
      const stopCmd = cmds.find((c) => c.id === 'test-svc-stop')!;
      const result = await stopCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('not running');
    });
  });

  describe('restart command', () => {
    it('restarts a running service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmds = createServiceCommands(readyDef);
      const restartCmd = cmds.find((c) => c.id === 'test-svc-restart')!;
      const result = await restartCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('ready');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('starts a non-running service', async () => {
      const cmds = createServiceCommands(readyDef);
      const restartCmd = cmds.find((c) => c.id === 'test-svc-restart')!;
      const result = await restartCmd.execute({}, makeContext()) as any;
      expect(result.text).toContain('ready');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('reports error when restart fails', async () => {
      const failDef: ServiceDefinition = {
        id: 'fail-svc',
        label: 'Failing Service',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'exit-fast' }),
        readiness: { pattern: /Server listening/, timeout: 500 },
      };
      const failMgr = createServiceManager([failDef], {
        config: {},
        servicesDir,
        eventBus,
      });
      const ctx = { ...makeContext(), services: failMgr };
      const cmds = createServiceCommands(failDef);
      const restartCmd = cmds.find((c) => c.id === 'fail-svc-restart')!;
      const result = await restartCmd.execute({}, ctx) as any;
      expect(result.text).toContain('✗');
      expect(result.text).toContain('fail-svc');
    }, 10_000);
  });

  describe('logs command', () => {
    it('shows logs for a service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmds = createServiceCommands(readyDef);
      const logsCmd = cmds.find((c) => c.id === 'test-svc-logs')!;
      const result = await logsCmd.execute({ lines: 50 }, makeContext()) as any;
      expect(result.text).toContain('listening');
    });

    it('shows "No logs available" when no logs exist', async () => {
      const cmds = createServiceCommands(readyDef);
      const logsCmd = cmds.find((c) => c.id === 'test-svc-logs')!;
      const result = await logsCmd.execute({ lines: 50 }, makeContext()) as any;
      expect(result.text).toBe('No logs available');
    });
  });

  it('throws when no services configured', async () => {
    const cmds = createServiceCommands(readyDef);
    const psCmd = cmds.find((c) => c.id === 'test-svc-ps')!;
    const ctx = { ...makeContext(), services: undefined };
    await expect(psCmd.execute({}, ctx)).rejects.toThrow('No services configured');
  });
});

describe('ServiceManager.getDefinition', () => {
  let tmpDir: string;
  let servicesDir: string;

  const readyDef: ServiceDefinition = {
    id: 'test-svc',
    label: 'Test Service',
    command: `node ${TEST_SERVICE}`,
    readiness: {
      pattern: /Server listening/,
      timeout: 5000,
      captures: { port: 1 },
    },
  };

  beforeEach(() => {
    tmpDir = makeTmpDir();
    servicesDir = path.join(tmpDir, 'services');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns definition for known service', () => {
    const mgr = createServiceManager([readyDef], { config: {}, servicesDir });
    const def = mgr.getDefinition('test-svc');
    expect(def).toBeDefined();
    expect(def!.id).toBe('test-svc');
    expect(def!.command).toBe(`node ${TEST_SERVICE}`);
  });

  it('returns undefined for unknown service', () => {
    const mgr = createServiceManager([readyDef], { config: {}, servicesDir });
    expect(mgr.getDefinition('nope')).toBeUndefined();
  });
});

describe('auto-injected service commands in CLI', () => {
  let tmpDir: string;
  let trackedPids: number[];

  const svcDef: ServiceDefinition = defineService({
    id: 'test-svc',
    label: 'Test Service',
    command: `node ${path.resolve(import.meta.dirname, 'fixtures/test-service.js')}`,
    env: () => ({ TEST_SERVICE_MODE: 'ready', TEST_SERVICE_PORT: '4567' }),
    readiness: {
      pattern: /Server listening on http:\/\/localhost:(\d+)/,
      timeout: 5000,
      captures: { port: 1 },
    },
    shutdown: { signal: 'SIGTERM', timeout: 3000 },
  });

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
        workdir: tmpDir,
      },
    };
  }

  beforeEach(() => {
    tmpDir = makeTmpDir();
    trackedPids = [];
  });

  afterEach(() => {
    // Services now live in user-scope (~/.ph/{name}/services/)
    const userSvcDir = path.join(os.homedir(), '.ph', 'svc', 'services');
    const localSvcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    const pids = [...trackedPids, ...collectPids(userSvcDir), ...collectPids(localSvcDir)];
    for (const pid of pids) safeKill(pid);
    fs.rmSync(userSvcDir, { recursive: true, force: true });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('auto-injects per-service commands when services are defined', () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });
    expect(cli.getCommand('test-svc-start')).toBeDefined();
    expect(cli.getCommand('test-svc-stop')).toBeDefined();
    expect(cli.getCommand('test-svc-restart')).toBeDefined();
    expect(cli.getCommand('test-svc-ps')).toBeDefined();
    expect(cli.getCommand('test-svc-logs')).toBeDefined();
    expect(cli.getCommand('test-svc-manage')).toBeDefined();
  });

  it('does not auto-inject when no services', () => {
    const cli = defineCli({
      name: 'no-svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
    });
    expect(cli.getCommand('test-svc-ps')).toBeUndefined();
  });

  it('does not override user-defined command with same id', () => {
    const userCmd = defineCommand({
      id: 'test-svc-ps',
      description: 'My custom ps command',
      inputSchema: z.object({}),
      execute: async () => ({ text: 'custom' }),
    });
    const cli = defineCli({
      name: 'test',
      version: '1.0.0',
      description: 'test',
      commands: [userCmd],
      services: [svcDef],
    });
    expect(cli.getCommand('test-svc-ps')!.description).toBe('My custom ps command');
  });

  it('test-svc-ps via run()', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });

    const cap = capture();
    await cli.run(['node', 'svc', 'test-svc-ps'], cap.options);
    expect(cap.output.join('')).toContain('idle');
  });

  it('test-svc-start + test-svc-stop via run()', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });

    const cap = capture();
    await cli.run(['node', 'svc', 'test-svc-start'], cap.options);
    expect(cap.output.join('')).toContain('ready');

    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids.push(...collectPids(svcDir));

    const cap2 = capture();
    await cli.run(['node', 'svc', 'test-svc-stop'], cap2.options);
    expect(cap2.output.join('')).toContain('stopped');
  });

  it('/test-svc-ps works in headless interactive mode', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
      interactive: { welcome: 'Hello' },
    });

    const output: string[] = [];
    await cli.run(['node', 'svc', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
      interactiveInput: (async function* () {
        yield '/test-svc-ps';
        yield '/exit';
      })(),
    });

    expect(output.join('')).toContain('idle');
  });

  it('registers event handlers from options.events on the event bus', async () => {
    const receivedEvents: any[] = [];

    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
      events: {
        'service:ready': (data) => receivedEvents.push(data),
      },
    });

    const cap = capture();
    await cli.run(['node', 'svc', 'test-svc-start'], cap.options);
    expect(cap.output.join('')).toContain('ready');

    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids.push(...collectPids(svcDir));

    // The event handler should have been called by the service:ready event
    expect(receivedEvents.length).toBeGreaterThan(0);
    expect(receivedEvents[0].id).toBe('test-svc');
  });

  it('test-svc-logs shows "No logs available" when service has no logs', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
      interactive: { welcome: 'Hello' },
    });

    const output: string[] = [];
    await cli.run(['node', 'svc', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
      interactiveInput: (async function* () {
        yield '/test-svc-logs';
        yield '/exit';
      })(),
    });

    expect(output.join('')).toContain('No logs available');
  });

  it('/test-svc-manage returns panel type in session', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
      interactive: { welcome: 'Hello' },
    });

    const output: string[] = [];
    await cli.run(['node', 'svc', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
      interactiveInput: (async function* () {
        yield '/test-svc-manage';
        yield '/exit';
      })(),
    });

    // In headless mode, panel type outputs empty text (panel is visual-only)
    // The command should not error
    expect(output[0]).toBe('Hello');
  });
});
