import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineService, createServiceManager } from '../src/core/services.js';
import { createEventBus } from '../src/core/events.js';
import type { ServiceDefinition, EventBus } from '../src/core/types.js';
import {
  PROCESS_CLEANUP_WAIT,
  PROCESS_TEST_TIMEOUT,
  SERVICE_CRASH_DELAY,
  SERVICE_CRASH_WAIT,
  SERVICE_RESTART_WAIT,
  SERVICE_TEST_TIMEOUT,
  FORCE_KILL_SHUTDOWN_TIMEOUT,
  LOG_WATCH_WAIT,
} from './fixtures/timing.js';

const TEST_SERVICE = path.resolve(import.meta.dirname, 'fixtures/test-service.js');

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-svc-test-'));
}

/** Kill a process by PID, ignoring errors. */
function safeKill(pid: number): void {
  try { process.kill(-pid, 'SIGKILL'); } catch { /* ignore */ }
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
}

/** Collect all PIDs from state files in a services dir. */
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

describe('defineService', () => {
  it('returns the definition unchanged', () => {
    const def = defineService({
      id: 'test',
      label: 'Test',
      command: 'echo hello',
    });
    expect(def.id).toBe('test');
    expect(def.label).toBe('Test');
    expect(def.command).toBe('echo hello');
  });

  it('preserves readiness config', () => {
    const def = defineService({
      id: 'test',
      label: 'Test',
      command: 'node server.js',
      readiness: {
        pattern: /listening on port (\d+)/,
        timeout: 5000,
        captures: { port: 1 },
      },
    });
    expect(def.readiness?.pattern).toBeInstanceOf(RegExp);
    expect(def.readiness?.captures).toEqual({ port: 1 });
  });
});

describe('createServiceManager', () => {
  let tmpDir: string;
  let servicesDir: string;
  let eventBus: EventBus;
  let trackedPids: number[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    servicesDir = path.join(tmpDir, 'services');
    eventBus = createEventBus();
    trackedPids = [];
  });

  afterEach(() => {
    // Clean up any spawned processes
    const pids = [...trackedPids, ...collectPids(servicesDir)];
    for (const pid of pids) {
      safeKill(pid);
    }
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createManager(defs: ServiceDefinition<any>[], config: Record<string, unknown> = {}) {
    return createServiceManager(defs, { config, servicesDir, eventBus });
  }

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

  describe('start()', () => {
    it('starts a service and detects readiness', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');

      const statuses = mgr.list();
      expect(statuses).toHaveLength(1);
      expect(statuses[0]!.status).toBe('ready');
      expect(statuses[0]!.endpoints?.port).toBe('4567');
      expect(statuses[0]!.pid).toBeGreaterThan(0);
      trackedPids.push(statuses[0]!.pid!);
    });

    it('creates state file and log file', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');

      const statePath = path.join(servicesDir, 'test-svc.json');
      const logPath = path.join(servicesDir, 'test-svc.log');

      expect(fs.existsSync(statePath)).toBe(true);
      expect(fs.existsSync(logPath)).toBe(true);

      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      expect(state.status).toBe('ready');
      expect(state.pid).toBeGreaterThan(0);
      trackedPids.push(state.pid);

      const logContent = fs.readFileSync(logPath, 'utf-8');
      expect(logContent).toContain('listening');
    });

    it('throws when starting an already-running service', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');

      const statuses = mgr.list();
      trackedPids.push(statuses[0]!.pid!);

      await expect(mgr.start('test-svc')).rejects.toThrow(/already running/);
    });

    it('throws for unknown service', async () => {
      const mgr = createManager([readyDef]);
      await expect(mgr.start('nonexistent')).rejects.toThrow(/Unknown service/);
    });

    it('throws "already running" when status is starting', async () => {
      // Start a service with wait=false so it stays in "starting" via state file
      const slowDef: ServiceDefinition = {
        id: 'slow-svc',
        label: 'Slow Service',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'slow', READY_DELAY: '10000' }),
        readiness: {
          pattern: /Server listening/,
          timeout: 15000,
          wait: false,
        },
      };
      const mgr = createManager([slowDef]);
      await mgr.start('slow-svc');

      const statuses = mgr.list();
      trackedPids.push(statuses[0]!.pid!);

      // Manually write state as 'starting' to simulate an in-progress service
      const statePath = path.join(servicesDir, 'slow-svc.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      state.status = 'starting';
      fs.writeFileSync(statePath, JSON.stringify(state));

      await expect(mgr.start('slow-svc')).rejects.toThrow(/already running/);
    });

    it('marks ready immediately when readiness.wait is false', async () => {
      const noWaitDef: ServiceDefinition = {
        id: 'no-wait',
        label: 'No Wait',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'slow', READY_DELAY: '5000' }),
        readiness: {
          pattern: /Server listening/,
          timeout: 10000,
          wait: false,
        },
      };
      const mgr = createManager([noWaitDef]);
      await mgr.start('no-wait');

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('ready');
      trackedPids.push(statuses[0]!.pid!);
    });

    it('marks ready immediately when no readiness config', async () => {
      const noReadinessDef: ServiceDefinition = {
        id: 'no-check',
        label: 'No Check',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'no-ready' }),
      };
      const mgr = createManager([noReadinessDef]);
      await mgr.start('no-check');

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('ready');
      trackedPids.push(statuses[0]!.pid!);
    });

    it('fails on readiness timeout', async () => {
      const timeoutDef: ServiceDefinition = {
        id: 'timeout',
        label: 'Timeout',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'no-ready' }),
        readiness: {
          pattern: /will never match/,
          timeout: 500,
        },
      };
      const mgr = createManager([timeoutDef]);
      await expect(mgr.start('timeout')).rejects.toThrow(/timeout/i);

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('failed');
    }, PROCESS_TEST_TIMEOUT);

    it('emits service:ready event', async () => {
      const events: any[] = [];
      eventBus.on('service:ready', (data) => events.push(data));

      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');
      trackedPids.push(mgr.list()[0]!.pid!);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('test-svc');
      expect(events[0].label).toBe('Test Service');
      expect(events[0].endpoints?.port).toBe('4567');
    });

    it('emits service:failed on timeout', async () => {
      const events: any[] = [];
      eventBus.on('service:failed', (data) => events.push(data));

      const timeoutDef: ServiceDefinition = {
        id: 'fail-svc',
        label: 'Fail',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'no-ready' }),
        readiness: { pattern: /nope/, timeout: 500 },
      };
      const mgr = createManager([timeoutDef]);
      await mgr.start('fail-svc').catch(() => {});

      expect(events).toHaveLength(1);
      expect(events[0].error).toContain('timeout');
    }, PROCESS_TEST_TIMEOUT);
  });

  describe('stop()', () => {
    it('stops a running service', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');

      const pid = mgr.list()[0]!.pid!;
      trackedPids.push(pid);

      await mgr.stop('test-svc');

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('idle');

      // PID should be dead
      let alive = false;
      try { process.kill(pid, 0); alive = true; } catch { /* expected */ }
      expect(alive).toBe(false);
    });

    it('emits service:stopped event', async () => {
      const events: any[] = [];
      eventBus.on('service:stopped', (data) => events.push(data));

      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');
      trackedPids.push(mgr.list()[0]!.pid!);

      await mgr.stop('test-svc');

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('test-svc');
    });

    it('removes state file after stop', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');
      trackedPids.push(mgr.list()[0]!.pid!);

      await mgr.stop('test-svc');

      const statePath = path.join(servicesDir, 'test-svc.json');
      expect(fs.existsSync(statePath)).toBe(false);
    });

    it('throws for not-running service', async () => {
      const mgr = createManager([readyDef]);
      await expect(mgr.stop('test-svc')).rejects.toThrow(/not running/);
    });

    it('throws for unknown service', async () => {
      const mgr = createManager([readyDef]);
      await expect(mgr.stop('nonexistent')).rejects.toThrow(/Unknown service/);
    });
  });

  describe('list()', () => {
    it('returns idle for services with no state file', () => {
      const mgr = createManager([readyDef]);
      const statuses = mgr.list();
      expect(statuses).toHaveLength(1);
      expect(statuses[0]!.status).toBe('idle');
      expect(statuses[0]!.id).toBe('test-svc');
    });

    it('reconnects to a running service via PID', async () => {
      const mgr1 = createManager([readyDef]);
      await mgr1.start('test-svc');
      const pid = mgr1.list()[0]!.pid!;
      trackedPids.push(pid);

      // Create a second manager instance (simulates CLI restart)
      const mgr2 = createManager([readyDef]);
      const statuses = mgr2.list();
      expect(statuses[0]!.status).toBe('ready');
      expect(statuses[0]!.pid).toBe(pid);
    });

    it('detects dead process and marks as failed', async () => {
      const mgr = createManager([{
        ...readyDef,
        id: 'crash-svc',
        label: 'Crash Service',
        env: () => ({ TEST_SERVICE_MODE: 'crash', CRASH_DELAY: String(SERVICE_CRASH_DELAY), TEST_SERVICE_PORT: '4567' }),
      }]);

      await mgr.start('crash-svc');
      // Wait for crash
      await new Promise((r) => setTimeout(r, SERVICE_CRASH_WAIT));

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('failed');
    }, PROCESS_TEST_TIMEOUT);
  });

  describe('logs()', () => {
    it('returns log file content', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');
      trackedPids.push(mgr.list()[0]!.pid!);

      const logContent = mgr.logs('test-svc');
      expect(logContent).toContain('listening');
    });

    it('returns empty string when no log file', () => {
      const mgr = createManager([readyDef]);
      const logContent = mgr.logs('test-svc');
      expect(logContent).toBe('');
    });

    it('throws for unknown service', () => {
      const mgr = createManager([readyDef]);
      expect(() => mgr.logs('nonexistent')).toThrow(/Unknown service/);
    });
  });

  describe('watchLogs()', () => {
    it('calls onLine when new log data appears', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');
      trackedPids.push(mgr.list()[0]!.pid!);

      const lines: string[] = [];
      // The log file already has content from start, but watchLogs starts from current position
      // Write some additional content to the log to trigger the watcher
      const logPath = path.join(servicesDir, 'test-svc.log');
      const cleanup = mgr.watchLogs('test-svc', (line) => lines.push(line));

      // Append to log file to trigger watcher
      fs.appendFileSync(logPath, 'new log line\n');
      await new Promise((r) => setTimeout(r, LOG_WATCH_WAIT));

      cleanup();
      expect(lines.some((l) => l.includes('new log line'))).toBe(true);
    });

    it('throws for unknown service', () => {
      const mgr = createManager([readyDef]);
      expect(() => mgr.watchLogs('nonexistent', () => {})).toThrow(/Unknown service/);
    });
  });

  describe('restart on crash', () => {
    it('triggers restart when dead PID is found in list()', async () => {
      const events: any[] = [];
      eventBus.on('service:restarting', (data) => events.push(data));

      const crashDef: ServiceDefinition = {
        ...readyDef,
        id: 'restart-svc',
        label: 'Restart Service',
        env: () => ({ TEST_SERVICE_MODE: 'crash', CRASH_DELAY: String(SERVICE_CRASH_DELAY), TEST_SERVICE_PORT: '4567' }),
        restart: { enabled: true, maxRetries: 2, delay: SERVICE_CRASH_DELAY },
      };

      const mgr = createManager([crashDef]);
      await mgr.start('restart-svc');

      // Wait for crash
      await new Promise((r) => setTimeout(r, SERVICE_CRASH_WAIT));

      // list() should detect dead PID and trigger restart
      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('starting');
      expect(statuses[0]!.restartAttempt).toBe(1);

      expect(events).toHaveLength(1);
      expect(events[0].attempt).toBe(1);
      expect(events[0].maxRetries).toBe(2);

      // Wait for restart to complete
      await new Promise((r) => setTimeout(r, SERVICE_RESTART_WAIT));
      // Clean up whatever is running
      const finalStatuses = mgr.list();
      if (finalStatuses[0]?.pid) trackedPids.push(finalStatuses[0].pid);
    }, SERVICE_TEST_TIMEOUT);
  });

  describe('multiple readiness patterns', () => {
    const vetraDef: ServiceDefinition = {
      id: 'vetra',
      label: 'Vetra Server',
      command: `node ${TEST_SERVICE}`,
      env: () => ({ TEST_SERVICE_MODE: 'vetra', TEST_SERVICE_PORT: '4567' }),
      readiness: {
        patterns: [
          {
            name: 'connect-port',
            pattern: /Local:\s*http:\/\/localhost:(\d+)/,
            captures: { 'connect-studio': 1 },
          },
          {
            name: 'drive-url',
            pattern: /Drive URL:\s*(https?:\/\/[^\s]+)/,
            captures: { 'drive-url': 1 },
          },
          {
            name: 'mcp-server',
            pattern: /MCP server available at (https?:\/\/[^\s]+)/,
            captures: { 'mcp-server': 1 },
          },
        ],
        timeout: 5000,
      },
      shutdown: { signal: 'SIGTERM', timeout: 3000 },
    };

    it('becomes ready only when all patterns match', async () => {
      const mgr = createManager([vetraDef]);
      await mgr.start('vetra');

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('ready');
      expect(statuses[0]!.endpoints?.['connect-studio']).toBe('4567');
      expect(statuses[0]!.endpoints?.['drive-url']).toBe('http://localhost:4567/drives/main');
      expect(statuses[0]!.endpoints?.['mcp-server']).toBe('http://localhost:4567/mcp');
      trackedPids.push(statuses[0]!.pid!);
    });

    it('emits service:pattern-matched for each pattern', async () => {
      const events: any[] = [];
      eventBus.on('service:pattern-matched', (data) => events.push(data));

      const mgr = createManager([vetraDef]);
      await mgr.start('vetra');
      trackedPids.push(mgr.list()[0]!.pid!);

      expect(events.length).toBe(3);
      const names = events.map((e) => e.name).sort();
      expect(names).toEqual(['connect-port', 'drive-url', 'mcp-server']);
      // Last event should have remaining === 0
      expect(events[events.length - 1].remaining).toBe(0);
    });

    it('times out when not all patterns match', async () => {
      const partialDef: ServiceDefinition = {
        ...vetraDef,
        id: 'partial',
        label: 'Partial',
        env: () => ({ TEST_SERVICE_MODE: 'multi-partial', TEST_SERVICE_PORT: '4567' }),
        readiness: {
          ...vetraDef.readiness!,
          timeout: 800,
        },
      };

      const mgr = createManager([partialDef]);

      let error: Error | undefined;
      try {
        await mgr.start('partial');
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error!.message).toMatch(/timeout/i);
      expect(error!.message).toContain('mcp-server');
    }, PROCESS_TEST_TIMEOUT);

    it('collects endpoints from all matched patterns', async () => {
      const mgr = createManager([vetraDef]);
      await mgr.start('vetra');

      const statuses = mgr.list();
      const endpoints = statuses[0]!.endpoints!;
      expect(Object.keys(endpoints)).toHaveLength(3);
      trackedPids.push(statuses[0]!.pid!);
    });
  });

  describe('process exits before readiness', () => {
    it('marks service as failed when process dies before pattern matches', async () => {
      const failedEvents: any[] = [];
      eventBus.on('service:failed', (data) => failedEvents.push(data));

      const exitFastDef: ServiceDefinition = {
        id: 'exit-fast',
        label: 'Exit Fast',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'exit-fast' }),
        readiness: {
          pattern: /Server listening/,
          timeout: 5000,
        },
      };
      const mgr = createManager([exitFastDef]);

      await expect(mgr.start('exit-fast')).rejects.toThrow(/exited before becoming ready/);

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('failed');

      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].error).toContain('exited before becoming ready');
    }, PROCESS_TEST_TIMEOUT);
  });

  describe('stop() edge cases', () => {
    it('cleans up state file when process is already dead', async () => {
      const mgr = createManager([readyDef]);
      await mgr.start('test-svc');

      const pid = mgr.list()[0]!.pid!;
      trackedPids.push(pid);

      // Kill the process externally
      try { process.kill(-pid, 'SIGKILL'); } catch { /* ignore */ }
      try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
      // Wait for it to die
      await new Promise((r) => setTimeout(r, PROCESS_CLEANUP_WAIT));

      // stop() should detect dead PID, remove state file, and return cleanly
      await mgr.stop('test-svc');

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('idle');
    });

    it('force-kills a service that ignores SIGTERM', async () => {
      const stubbornDef: ServiceDefinition = {
        id: 'stubborn',
        label: 'Stubborn Service',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'ignore-sigterm', TEST_SERVICE_PORT: '4567' }),
        readiness: {
          pattern: /Server listening on http:\/\/localhost:(\d+)/,
          timeout: 5000,
          captures: { port: 1 },
        },
        shutdown: { signal: 'SIGTERM', timeout: FORCE_KILL_SHUTDOWN_TIMEOUT },
      };

      const mgr = createManager([stubbornDef]);
      await mgr.start('stubborn');
      const pid = mgr.list()[0]!.pid!;
      trackedPids.push(pid);

      // stop() sends SIGTERM → process ignores it → timeout → SIGKILL
      await mgr.stop('stubborn');

      // Verify process is dead
      let alive = false;
      try { process.kill(pid, 0); alive = true; } catch { /* expected */ }
      expect(alive).toBe(false);

      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('idle');
    }, SERVICE_TEST_TIMEOUT);
  });

  describe('watchLogs() edge cases', () => {
    it('returns fallback message when log file does not exist', () => {
      const mgr = createManager([readyDef]);
      const lines: string[] = [];
      const cleanup = mgr.watchLogs('test-svc', (line) => lines.push(line));
      cleanup();

      expect(lines).toEqual(['Log file not found']);
    });
  });

  describe('max restart retries exceeded', () => {
    it('emits service:failed when max retries are exceeded', async () => {
      const failedEvents: any[] = [];
      eventBus.on('service:failed', (data) => failedEvents.push(data));

      // A service that starts ok (no readiness → immediate ready), then crashes.
      // maxRetries: 0 means no restarts allowed — any crash goes straight to "exceeded".
      const crashDef: ServiceDefinition = {
        id: 'max-retry',
        label: 'Max Retry Service',
        command: `node ${TEST_SERVICE}`,
        env: () => ({ TEST_SERVICE_MODE: 'crash', CRASH_DELAY: String(SERVICE_CRASH_DELAY) }),
        // No readiness → marked ready immediately
        restart: { enabled: true, maxRetries: 0, delay: SERVICE_CRASH_DELAY },
      };

      const mgr = createManager([crashDef]);
      await mgr.start('max-retry');

      // Wait for crash
      await new Promise((r) => setTimeout(r, SERVICE_CRASH_WAIT));

      // list() sees dead PID, restartAttempt (0) >= maxRetries (0) → failed
      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('failed');
      expect(statuses[0]!.restartAttempt).toBe(0);

      const maxRetryFailed = failedEvents.find((e) => e.error?.includes('Max restart'));
      expect(maxRetryFailed).toBeDefined();
    }, SERVICE_TEST_TIMEOUT);
  });

  describe('env config', () => {
    it('passes config to env function', async () => {
      const envDef: ServiceDefinition<{ apiPort: number }> = defineService({
        id: 'env-svc',
        label: 'Env Service',
        command: `node ${TEST_SERVICE}`,
        env: (config) => ({
          TEST_SERVICE_MODE: 'ready',
          TEST_SERVICE_PORT: String(config.apiPort),
        }),
        readiness: {
          pattern: /Server listening on http:\/\/localhost:(\d+)/,
          timeout: 5000,
          captures: { port: 1 },
        },
      });

      const mgr = createManager([envDef as any], { apiPort: 9999 });
      await mgr.start('env-svc');

      const statuses = mgr.list();
      expect(statuses[0]!.endpoints?.port).toBe('9999');
      trackedPids.push(statuses[0]!.pid!);
    });
  });
});
