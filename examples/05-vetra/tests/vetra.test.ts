import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineService, defineCli, defineCommand, createServiceManager, createEventBus } from 'ph-clint';
import type { ServiceDefinition } from 'ph-clint';
import { z } from 'zod';

const FIXTURE = path.resolve(import.meta.dirname, 'fixtures/test-server.js');

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-svc-ex05-'));
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

// ── Vetra-like service definition using test fixture ──────────────

const vetraDef: ServiceDefinition = defineService({
  id: 'vetra',
  label: 'Vetra Dev Server',
  command: `node ${FIXTURE}`,
  env: (config: any) => ({
    PORT: String(config.switchboardPort ?? 4001),
    TEST_SERVICE_MODE: 'vetra',
  }),
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
  restart: { enabled: true, maxRetries: 3, delay: 2000 },
});

describe('Example 05 — Vetra', () => {
  let tmpDir: string;
  let servicesDir: string;
  let trackedPids: number[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    servicesDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids = [];
  });

  afterEach(() => {
    const pids = [...trackedPids, ...collectPids(servicesDir)];
    for (const pid of pids) {
      safeKill(pid);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Multi-pattern readiness ────────────────────────────────────

  describe('multi-pattern readiness (Vetra-style)', () => {
    it('becomes ready only when all three patterns match', async () => {
      const eventBus = createEventBus();
      const mgr = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr.start('vetra');
      const statuses = mgr.list();
      expect(statuses[0]!.status).toBe('ready');
      trackedPids.push(statuses[0]!.pid!);
    });

    it('captures endpoints from all patterns', async () => {
      const eventBus = createEventBus();
      const mgr = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr.start('vetra');
      const statuses = mgr.list();
      const ep = statuses[0]!.endpoints!;

      expect(ep['connect-studio']).toBe('4567');
      expect(ep['drive-url']).toBe('http://localhost:4567/drives/main');
      expect(ep['mcp-server']).toBe('http://localhost:4567/mcp');
      trackedPids.push(statuses[0]!.pid!);
    });

    it('emits service:pattern-matched for each pattern', async () => {
      const matched: any[] = [];
      const eventBus = createEventBus();
      eventBus.on('service:pattern-matched', (data) => matched.push(data));

      const mgr = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr.start('vetra');
      trackedPids.push(mgr.list()[0]!.pid!);

      expect(matched).toHaveLength(3);
      const names = matched.map((m) => m.name).sort();
      expect(names).toEqual(['connect-port', 'drive-url', 'mcp-server']);
    });

    it('times out when not all patterns match', async () => {
      const partialDef: ServiceDefinition = {
        ...vetraDef,
        id: 'partial',
        label: 'Partial',
        env: () => ({ PORT: '4567', TEST_SERVICE_MODE: 'partial' }),
        readiness: {
          ...(vetraDef.readiness as any),
          timeout: 800,
        },
      };

      const eventBus = createEventBus();
      const mgr = createServiceManager([partialDef], {
        config: {},
        servicesDir,
        eventBus,
      });

      let error: Error | undefined;
      try {
        await mgr.start('partial');
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error!.message).toMatch(/timeout/i);
      expect(error!.message).toContain('mcp-server');
    }, 10000);
  });

  // ── Service lifecycle ──────────────────────────────────────────

  describe('service lifecycle', () => {
    it('reconnects to running service after CLI restart', async () => {
      const eventBus = createEventBus();
      const mgr1 = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr1.start('vetra');
      const pid = mgr1.list()[0]!.pid!;
      trackedPids.push(pid);

      // Simulate CLI restart — new manager, same state dir
      const mgr2 = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      const statuses = mgr2.list();
      expect(statuses[0]!.status).toBe('ready');
      expect(statuses[0]!.pid).toBe(pid);
      expect(statuses[0]!.endpoints?.['connect-studio']).toBe('4567');
    });

    it('stop() kills process and cleans up state', async () => {
      const eventBus = createEventBus();
      const mgr = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr.start('vetra');
      const pid = mgr.list()[0]!.pid!;
      trackedPids.push(pid);

      await mgr.stop('vetra');

      expect(mgr.list()[0]!.status).toBe('idle');
      let alive = false;
      try { process.kill(pid, 0); alive = true; } catch { /* expected */ }
      expect(alive).toBe(false);
    });

    it('logs() returns captured output', async () => {
      const eventBus = createEventBus();
      const mgr = createServiceManager([vetraDef], {
        config: { switchboardPort: 4567 },
        servicesDir,
        eventBus,
      });

      await mgr.start('vetra');
      trackedPids.push(mgr.list()[0]!.pid!);

      const logContent = mgr.logs('vetra');
      expect(logContent).toContain('Vetra development server');
      expect(logContent).toContain('Local:');
    });
  });

  // ── CLI integration ────────────────────────────────────────────

  describe('CLI integration', () => {
    it('services are available in CommandContext', async () => {
      let hasServices = false;

      const checkCmd = defineCommand({
        id: 'check',
        description: 'Check context',
        inputSchema: z.object({}),
        execute: async (_, ctx) => {
          hasServices = ctx.services !== undefined;
          return { text: hasServices ? 'yes' : 'no' };
        },
      });

      const cli = defineCli({
        name: 'svc',
        version: '1.0.0',
        description: 'test',
        commands: [checkCmd],
        services: [vetraDef],
      });

      await cli.run(['node', 'svc', 'check'], {
        stdout: () => {},
        stderr: () => {},
        exit: () => {},
        workdir: tmpDir,
      });

      expect(hasServices).toBe(true);
    });

    it('event handlers fire on service:ready and service:stopped', async () => {
      const events: string[] = [];

      const startCmd = defineCommand({
        id: 'start-svc',
        description: 'Start vetra',
        inputSchema: z.object({}),
        execute: async (_, { services }) => {
          await services!.start('vetra');
          return { text: 'started' };
        },
      });

      const stopCmd = defineCommand({
        id: 'stop-svc',
        description: 'Stop vetra',
        inputSchema: z.object({}),
        execute: async (_, { services }) => {
          await services!.stop('vetra');
          return { text: 'stopped' };
        },
      });

      const cli = defineCli({
        name: 'svc',
        version: '1.0.0',
        description: 'test',
        commands: [startCmd, stopCmd],
        services: [vetraDef],
        events: {
          'service:ready': () => events.push('ready'),
          'service:stopped': () => events.push('stopped'),
          'service:pattern-matched': (e) => events.push(`matched:${e.name}`),
        },
      });

      await cli.run(['node', 'svc', 'start-svc'], {
        stdout: () => {},
        stderr: () => {},
        exit: () => {},
        workdir: tmpDir,
      });

      expect(events).toContain('ready');
      expect(events).toContain('matched:connect-port');
      expect(events).toContain('matched:drive-url');
      expect(events).toContain('matched:mcp-server');

      // Collect PIDs for cleanup
      const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
      trackedPids.push(...collectPids(svcDir));

      await cli.run(['node', 'svc', 'stop-svc'], {
        stdout: () => {},
        stderr: () => {},
        exit: () => {},
        workdir: tmpDir,
      });

      expect(events).toContain('stopped');
    });

    it('config port flows through to service env', async () => {
      const configSchema = z.object({
        switchboardPort: z.number().default(4001),
      });

      let capturedEndpoints: Record<string, string> | undefined;

      const startCmd = defineCommand({
        id: 'start',
        description: 'Start',
        inputSchema: z.object({}),
        execute: async (_, { services }) => {
          await services!.start('vetra');
          capturedEndpoints = services!.list()[0]!.endpoints;
          return { text: 'ok' };
        },
      });

      const cli = defineCli({
        name: 'svc',
        version: '1.0.0',
        description: 'test',
        configSchema,
        commands: [startCmd],
        services: [vetraDef],
      });

      await cli.run(['node', 'svc', 'start'], {
        stdout: () => {},
        stderr: () => {},
        exit: () => {},
        workdir: tmpDir,
      });

      const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
      trackedPids.push(...collectPids(svcDir));

      // Default port from configSchema is 4001
      expect(capturedEndpoints?.['connect-studio']).toBe('4001');
    });
  });

});
