/**
 * Integration test: ServiceAnnouncer receives announcements when a real
 * service comes online via defineCli + bootstrap.
 *
 * Spins up an in-process HTTP registry, creates a CLI with a service
 * definition backed by test-service.js, bootstraps it with the registry
 * URL injected via env var, starts the service, and asserts that the
 * registry receives a valid announcement payload once the service is ready.
 */
import { describe, it, expect, afterEach } from '@jest/globals';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineCli } from '../src/core/cli.js';
import { defineService } from '../src/core/services.js';
import { z } from 'zod';
import { SERVICE_TEST_TIMEOUT } from './fixtures/timing.js';
import type { AnnouncementPayload } from '../src/core/service-announcer.js';

const TEST_SERVICE = path.resolve(import.meta.dirname, 'fixtures/test-service.js');

// ── In-process HTTP helpers ──────────────────────────────────────

interface Registry {
  url: string;
  announcements: AnnouncementPayload[];
  close: () => Promise<void>;
}

function startRegistry(): Promise<Registry> {
  return new Promise((resolve) => {
    const announcements: AnnouncementPayload[] = [];

    const server = http.createServer((req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', () => {
          try {
            announcements.push(JSON.parse(body));
          } catch { /* ignore */ }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({
        url: `http://localhost:${addr.port}`,
        announcements,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

/** HTTP server that always returns 500 — for testing the retry path. */
function startFailingServer(): Promise<{ url: string; hits: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    let hits = 0;
    const server = http.createServer((_req, res) => {
      hits++;
      res.writeHead(500);
      res.end('Internal Server Error');
    });

    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({
        url: `http://localhost:${addr.port}`,
        get hits() { return hits; },
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-announce-int-'));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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
        if (!fs.statSync(subDir).isDirectory()) continue;
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

function killServicesFor(cliName: string): void {
  const svcDir = path.join(os.homedir(), '.ph', cliName, 'services');
  for (const pid of collectPids(svcDir)) safeKill(pid);
}

function buildTestService() {
  return defineService({
    id: 'test-api',
    name: 'Test API',
    command: `node ${TEST_SERVICE}`,
    readiness: {
      pattern: /Server listening on (http:\/\/\S+)/,
      captures: {
        'api-endpoint': { group: 1, type: 'api-graphql' },
      },
      timeout: 5000,
    },
  });
}

// ── Tests ────────────────────────────────────────────────────────

describe('ServiceAnnouncer integration', () => {
  let servers: Array<{ close: () => Promise<void> }> = [];
  let tmpDir: string | undefined;
  let cliName: string | undefined;

  afterEach(async () => {
    if (cliName) killServicesFor(cliName);
    for (const s of servers) await s.close();
    servers = [];
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.SA_TEST_SERVICE_ANNOUNCE_URL;
    delete process.env.SA_NOURL_SERVICE_ANNOUNCE_URL;
    delete process.env.SA_FAIL_SERVICE_ANNOUNCE_URL;
  });

  it('receives announcement when a service becomes ready', async () => {
    const registry = await startRegistry();
    servers.push(registry);
    tmpDir = makeTmpDir();
    cliName = 'sa-test';

    process.env.SA_TEST_SERVICE_ANNOUNCE_URL = registry.url;

    const cli = defineCli({
      name: 'sa-test',
      version: '0.0.1',
      description: 'test',
      configSchema: z.object({}),
      commands: [],
      services: [buildTestService()],
      serviceAnnouncement: { enabled: true },
    });

    const result = await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: () => {},
    });

    await result.context.services!.start('test-api');

    // Wait for service ready + debounce window (2s) + buffer
    await sleep(3500);

    expect(registry.announcements.length).toBeGreaterThanOrEqual(1);

    const latest = registry.announcements[registry.announcements.length - 1];

    expect(latest.node.type).toBe('clint');
    expect(latest.node.clintId).toBe('sa-test');
    expect(typeof latest.node.hostname).toBe('string');
    expect(new Date(latest.reportedAt).toISOString()).toBe(latest.reportedAt);

    const apiService = latest.services.find((s) => s.name === 'service-test-api-api-endpoint');
    expect(apiService).toBeDefined();
    expect(apiService!.type).toBe('api-graphql');
    expect(apiService!.status).toBe('ready');
    expect(apiService!.url).toMatch(/^http:\/\/localhost:\d+$/);
    expect(apiService!.port).toBeTruthy();
  }, SERVICE_TEST_TIMEOUT);

  it('logs info and skips announcement when URL is not configured', async () => {
    tmpDir = makeTmpDir();
    cliName = 'sa-nourl';
    const logged: string[] = [];

    // No env var set for SA_NOURL_SERVICE_ANNOUNCE_URL

    const cli = defineCli({
      name: 'sa-nourl',
      version: '0.0.1',
      description: 'test',
      configSchema: z.object({}),
      commands: [],
      services: [buildTestService()],
      serviceAnnouncement: { enabled: true },
    });

    await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: (msg: string) => { logged.push(msg); },
    });

    expect(logged.some((m) => m.includes('no URL configured'))).toBe(true);
  });

  it('retries once on HTTP failure then logs warnings', async () => {
    const failing = await startFailingServer();
    servers.push(failing);
    tmpDir = makeTmpDir();
    cliName = 'sa-fail';

    process.env.SA_FAIL_SERVICE_ANNOUNCE_URL = failing.url;

    const warnings: string[] = [];
    const cli = defineCli({
      name: 'sa-fail',
      version: '0.0.1',
      description: 'test',
      configSchema: z.object({}),
      commands: [],
      services: [buildTestService()],
      serviceAnnouncement: { enabled: true },
    });

    await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: (msg: string) => { warnings.push(msg); },
    });

    // bootstrap calls announce() immediately — first attempt hits 500
    // Wait for the 5s retry to fire
    await sleep(6000);

    // Should have received 2 hits: initial + retry
    expect(failing.hits).toBe(2);

    // Both failures are logged as warnings
    const failWarnings = warnings.filter((w) => w.includes('announcement'));
    expect(failWarnings.length).toBeGreaterThanOrEqual(2);
    expect(failWarnings.some((w) => w.includes('failed'))).toBe(true);
    expect(failWarnings.some((w) => w.includes('retry failed'))).toBe(true);
  }, SERVICE_TEST_TIMEOUT);
});
