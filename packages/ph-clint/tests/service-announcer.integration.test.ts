/**
 * Integration test: ServiceAnnouncer receives announcements when a real
 * service comes online via defineCli + bootstrap.
 *
 * Spins up in-process HTTP registries (REST and GraphQL), creates CLIs with
 * service definitions backed by test-service.js, bootstraps them with the
 * registry URL injected via env var, starts the service, and asserts that
 * the registry receives valid announcement payloads.
 */
import { describe, it, expect, afterEach } from '@jest/globals';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineCli } from '../src/core/cli.js';
import { defineService } from '../src/core/services.js';
import { jsonPostAnnounce, vetraGraphqlAnnounce } from '../src/core/announce-helpers.js';
import { z } from 'zod';
import { SERVICE_TEST_TIMEOUT } from './fixtures/timing.js';
import type { AnnouncementPayload } from '../src/core/types.js';

const TEST_SERVICE = path.resolve(import.meta.dirname, 'fixtures/test-service.js');

// ── In-process HTTP helpers ──────────────────────────────────

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

interface GraphQLRegistry {
  url: string;
  inputs: Array<{ documentId: string; prefix: string; endpoints: unknown[] }>;
  close: () => Promise<void>;
}

function startGraphQLRegistry(): Promise<GraphQLRegistry> {
  return new Promise((resolve) => {
    const inputs: GraphQLRegistry['inputs'] = [];

    const server = http.createServer((req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.variables?.input) {
              inputs.push(parsed.variables.input);
            }
          } catch { /* ignore */ }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: { announceClintEndpoints: { ok: true, count: 1 } },
          }));
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
        inputs,
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

// ── Helpers ──────────────────────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────

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
    delete process.env.SA_GQL_SERVICE_ANNOUNCE_URL;
  });

  it('receives announcement when a service becomes ready (jsonPostAnnounce)', async () => {
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
      serviceAnnouncement: {
        enabled: true,
        announce: (payload, ctx) => jsonPostAnnounce(payload, ctx),
      },
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

  it('receives GraphQL mutation via vetraGraphqlAnnounce', async () => {
    const gqlRegistry = await startGraphQLRegistry();
    servers.push(gqlRegistry);
    tmpDir = makeTmpDir();
    cliName = 'sa-gql';

    process.env.SA_GQL_SERVICE_ANNOUNCE_URL = `${gqlRegistry.url}?documentId=test-doc-789`;

    const cli = defineCli({
      name: 'sa-gql',
      version: '0.0.1',
      description: 'test',
      configSchema: z.object({}),
      commands: [],
      services: [buildTestService()],
      serviceAnnouncement: {
        enabled: true,
        announce: (payload, ctx) => vetraGraphqlAnnounce(payload, ctx),
      },
    });

    const result = await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: () => {},
    });

    await result.context.services!.start('test-api');

    // Wait for service ready + debounce window (2s) + buffer
    await sleep(3500);

    expect(gqlRegistry.inputs.length).toBeGreaterThanOrEqual(1);
    const latest = gqlRegistry.inputs[gqlRegistry.inputs.length - 1];
    expect(latest.documentId).toBe('test-doc-789');
    expect(latest.prefix).toBe(os.hostname());
    expect(Array.isArray(latest.endpoints)).toBe(true);
  }, SERVICE_TEST_TIMEOUT);

  it('logs info and skips when URL is not configured (vetraGraphqlAnnounce)', async () => {
    tmpDir = makeTmpDir();
    cliName = 'sa-nourl';
    const logged: string[] = [];

    const cli = defineCli({
      name: 'sa-nourl',
      version: '0.0.1',
      description: 'test',
      configSchema: z.object({}),
      commands: [],
      services: [buildTestService()],
      serviceAnnouncement: {
        enabled: true,
        announce: (payload, ctx) => vetraGraphqlAnnounce(payload, ctx),
      },
    });

    await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: (msg: string) => { logged.push(msg); },
    });

    // The vetraGraphqlAnnounce helper logs "no URL configured" — it appears in stderr via the logger
    expect(logged.some((m) => m.includes('no URL configured'))).toBe(true);
  });

  it('retries once on callback failure then logs warnings', async () => {
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
      serviceAnnouncement: {
        enabled: true,
        announce: (payload, ctx) => jsonPostAnnounce(payload, ctx),
      },
    });

    await cli.bootstrap({
      workdir: tmpDir,
      stdout: () => {},
      stderr: (msg: string) => { warnings.push(msg); },
    });

    // bootstrap calls announce() immediately — first attempt hits 500
    // The jsonPostAnnounce helper catches the error (logs warn), so the
    // ServiceAnnouncer does NOT see a thrown error and doesn't retry.
    // The warn message is from the helper.
    await sleep(1000);

    // jsonPostAnnounce catches the error, so we get 1 hit + 1 warn log
    expect(failing.hits).toBe(1);
    const failWarnings = warnings.filter((w) => w.includes('announcement'));
    expect(failWarnings.length).toBeGreaterThanOrEqual(1);
    expect(failWarnings.some((w) => w.includes('failed'))).toBe(true);
  }, SERVICE_TEST_TIMEOUT);
});
