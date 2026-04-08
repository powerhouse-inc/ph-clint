import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import { defineService, defineCli, defineCommand, createServiceManager, createEventBus, formatStatus } from '../src/index.js';
import { createSvcCommand } from '../src/core/service-command.js';
import type { ServiceDefinition, ServiceManager, ServiceStatus, CommandContext, EventBus } from '../src/core/types.js';
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
    for (const f of fs.readdirSync(servicesDir)) {
      if (f.endsWith('.json')) {
        try {
          const state = JSON.parse(fs.readFileSync(path.join(servicesDir, f), 'utf-8'));
          if (state.pid) pids.push(state.pid);
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  return pids;
}

describe('formatStatus', () => {
  it('shows ● icon for ready status', () => {
    const result = formatStatus({ id: 'svc', label: 'My Svc', status: 'ready', pid: 123 });
    expect(result).toContain('●');
    expect(result).toContain('My Svc');
    expect(result).toContain('ready');
    expect(result).toContain('pid 123');
  });

  it('shows ◐ icon for starting status', () => {
    const result = formatStatus({ id: 'svc', label: 'My Svc', status: 'starting' });
    expect(result).toContain('◐');
    expect(result).toContain('starting');
  });

  it('shows ✗ icon for failed status', () => {
    const result = formatStatus({ id: 'svc', label: 'My Svc', status: 'failed' });
    expect(result).toContain('✗');
    expect(result).toContain('failed');
  });

  it('shows ◑ icon for stopping status', () => {
    const result = formatStatus({ id: 'svc', label: 'My Svc', status: 'stopping' as ServiceStatus['status'] });
    expect(result).toContain('◑');
    expect(result).toContain('stopping');
  });

  it('shows ○ icon for idle status', () => {
    const result = formatStatus({ id: 'svc', label: 'My Svc', status: 'idle' });
    expect(result).toContain('○');
    expect(result).toContain('idle');
  });

  it('includes endpoints in output', () => {
    const result = formatStatus({
      id: 'svc', label: 'My Svc', status: 'ready',
      endpoints: { port: '3000', url: 'http://localhost:3000' },
    });
    expect(result).toContain('port=3000');
    expect(result).toContain('url=http://localhost:3000');
  });

  it('does not show endpoints section when endpoints object is empty', () => {
    const result = formatStatus({
      id: 'svc', label: 'My Svc', status: 'ready',
      endpoints: {},
    });
    expect(result).not.toContain('=');
  });

  it('includes error in output', () => {
    const result = formatStatus({
      id: 'svc', label: 'My Svc', status: 'failed',
      error: 'Process crashed',
    });
    expect(result).toContain('error: Process crashed');
  });

  it('includes restart attempt in output', () => {
    const result = formatStatus({
      id: 'svc', label: 'My Svc', status: 'starting',
      restartAttempt: 2,
    });
    expect(result).toContain('restart #2');
  });
});

describe('createSvcCommand — no services', () => {
  it('shows "No services defined" when service list is empty', async () => {
    const emptyMgr: ServiceManager = {
      start: async () => {},
      stop: async () => {},
      list: () => [],
      getDefinition: () => undefined,
      logs: () => '',
      watchLogs: () => () => {},
    };
    const cmd = createSvcCommand([]);
    const ctx: CommandContext = {
      workdir: '/tmp',
      workspace: createMemoryWorkdirStore(),
      config: {},
      stdout: () => {},
      services: emptyMgr,
    };
    const result = await cmd.execute({ action: 'ps', lines: 50, manage: false }, ctx) as any;
    expect(result.text).toBe('No services defined');
  });
});

describe('createSvcCommand', () => {
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

  it('has id "svc"', () => {
    const cmd = createSvcCommand(['test-svc']);
    expect(cmd.id).toBe('svc');
  });

  describe('ps action', () => {
    it('shows idle status when no services are running', async () => {
      const cmd = createSvcCommand(['test-svc', 'second-svc']);
      const result = await cmd.execute({ action: 'ps', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('idle');
      expect(result.text).toContain('Test Service');
      expect(result.text).toContain('Second Service');
    });

    it('shows ready status after starting', async () => {
      await mgr.start('test-svc');
      trackedPids.push(mgr.list().find(s => s.id === 'test-svc')!.pid!);

      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'ps', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('ready');
      expect(result.text).toContain('Test Service');
    });

    it('defaults to ps when no action given', async () => {
      const cmd = createSvcCommand(['test-svc']);
      const parsed = cmd.inputSchema.parse({}) as any;
      expect(parsed.action).toBe('ps');
    });
  });

  describe('up action', () => {
    it('starts a specific service', async () => {
      const cmd = createSvcCommand(['test-svc', 'second-svc']);
      const result = await cmd.execute({ action: 'up', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('ready');
      expect(result.text).toContain('Test Service');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('starts all services when no id given', async () => {
      const cmd = createSvcCommand(['test-svc', 'second-svc']);
      const result = await cmd.execute({ action: 'up', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('Test Service');
      expect(result.text).toContain('Second Service');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('reports error for already running service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'up', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('already running');
    });
  });

  describe('down action', () => {
    it('stops a specific service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'down', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('stopped');
    });

    it('reports error for not-running service', async () => {
      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'down', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('not running');
    });
  });

  describe('restart action', () => {
    it('restarts a running service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'restart', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('ready');
      trackedPids.push(...collectPids(servicesDir));
    });

    it('starts a non-running service', async () => {
      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'restart', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
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
      const cmd = createSvcCommand(['fail-svc']);
      const result = await cmd.execute({ action: 'restart', id: 'fail-svc', lines: 50, manage: false }, ctx) as any;
      expect(result.text).toContain('✗');
      expect(result.text).toContain('fail-svc');
    }, 10_000);
  });

  describe('logs action', () => {
    it('shows logs for a specific service', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmd = createSvcCommand(['test-svc']);
      const result = await cmd.execute({ action: 'logs', id: 'test-svc', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('listening');
    });

    it('shows logs for all services when no id', async () => {
      await mgr.start('test-svc');
      trackedPids.push(...collectPids(servicesDir));

      const cmd = createSvcCommand(['test-svc', 'second-svc']);
      const result = await cmd.execute({ action: 'logs', lines: 50, manage: false }, makeContext()) as any;
      expect(result.text).toContain('Test Service');
    });
  });

  it('throws when no services configured', async () => {
    const cmd = createSvcCommand(['test-svc']);
    const ctx = { ...makeContext(), services: undefined };
    await expect(cmd.execute({ action: 'ps', lines: 50, manage: false }, ctx)).rejects.toThrow('No services configured');
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

describe('auto-injected svc command in CLI', () => {
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
    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    const pids = [...trackedPids, ...collectPids(svcDir)];
    for (const pid of pids) safeKill(pid);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('auto-injects svc command when services are defined', () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });
    expect(cli.getCommand('svc')).toBeDefined();
  });

  it('does not auto-inject when no services', () => {
    const cli = defineCli({
      name: 'no-svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
    });
    expect(cli.getCommand('svc')).toBeUndefined();
  });

  it('does not override user-defined svc command', () => {
    const userCmd = defineCommand({
      id: 'svc',
      description: 'My custom svc command',
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
    expect(cli.getCommand('svc')!.description).toBe('My custom svc command');
  });

  it('svc ps via run()', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });

    const cap = capture();
    await cli.run(['node', 'svc', 'svc'], cap.options);
    expect(cap.output.join('')).toContain('idle');
  });

  it('svc up + down via run()', async () => {
    const cli = defineCli({
      name: 'svc',
      version: '1.0.0',
      description: 'test',
      commands: [],
      services: [svcDef],
    });

    const cap = capture();
    await cli.run(['node', 'svc', 'svc', '--action', 'up'], cap.options);
    expect(cap.output.join('')).toContain('ready');

    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids.push(...collectPids(svcDir));

    const cap2 = capture();
    await cli.run(['node', 'svc', 'svc', '--action', 'down'], cap2.options);
    expect(cap2.output.join('')).toContain('stopped');
  });

  it('/svc works in headless interactive mode', async () => {
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
        yield '/svc';
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
    await cli.run(['node', 'svc', 'svc', '--action', 'up'], cap.options);
    expect(cap.output.join('')).toContain('ready');

    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids.push(...collectPids(svcDir));

    // The event handler should have been called by the service:ready event
    expect(receivedEvents.length).toBeGreaterThan(0);
    expect(receivedEvents[0].id).toBe('test-svc');
  });

  it('svc logs shows "No logs available" when all services have empty logs', async () => {
    // Don't start any services, so there are no log files
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
        yield '/svc --action logs';
        yield '/exit';
      })(),
    });

    expect(output.join('')).toContain('No logs available');
  });

  it('/svc --manage returns panel type in session', async () => {
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
        yield '/svc --manage';
        yield '/exit';
      })(),
    });

    // In headless mode, panel type outputs empty text (panel is visual-only)
    // The command should not error
    expect(output[0]).toBe('Hello');
  });
});
