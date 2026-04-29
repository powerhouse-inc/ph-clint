import { describe, it, expect, jest, afterEach, beforeEach } from '@jest/globals';
import http from 'node:http';
import os from 'node:os';
import { jsonPostAnnounce, vetraGraphqlAnnounce } from '../src/core/announce-helpers.js';
import type { AnnouncementPayload, CommandContext, Logger } from '../src/core/types.js';

function createMockLogger(): Logger {
  return {
    debug: jest.fn<Logger['debug']>(),
    info: jest.fn<Logger['info']>(),
    warn: jest.fn<Logger['warn']>(),
    error: jest.fn<Logger['error']>(),
    level: 'debug',
  };
}

function createMockContext(config: Record<string, unknown> = {}): CommandContext {
  return {
    workdir: '/tmp/test',
    workspace: {
      getWorkdir: () => '/tmp/test',
      getLocalConfigPath: () => '/tmp/test/.ph/test.config.local.json',
      getStoreFolder: () => '/tmp/test/.ph/test',
      loadJsonObject: async <T>(_f: string, fallback: T) => fallback,
      storeJsonObject: async () => {},
      loadLocalConfig: async <T>(fallback: T) => fallback,
      storeLocalConfig: async () => {},
    },
    config,
    stdout: () => {},
    log: createMockLogger(),
    runProcess: async () => ({ success: true, output: '' }),
  };
}

function createPayload(services: AnnouncementPayload['services'] = []): AnnouncementPayload {
  return {
    node: { hostname: 'test-host', type: 'clint', clintId: 'test-cli' },
    services,
    reportedAt: new Date().toISOString(),
  };
}

describe('jsonPostAnnounce', () => {
  let server: http.Server | undefined;

  afterEach(() => {
    if (server) {
      server.close();
      server = undefined;
    }
  });

  it('POSTs payload as JSON to configured URL', async () => {
    const received: { body: string; headers: http.IncomingHttpHeaders }[] = [];
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        received.push({ body, headers: req.headers });
        res.writeHead(200);
        res.end();
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}/announce`,
      serviceAnnounceToken: 'test-token',
    });
    const payload = createPayload();
    await jsonPostAnnounce(payload, ctx);

    expect(received).toHaveLength(1);
    expect(JSON.parse(received[0]!.body)).toEqual(payload);
    expect(received[0]!.headers['authorization']).toBe('Bearer test-token');
  });

  it('logs info and returns when no URL configured', async () => {
    const ctx = createMockContext({});
    await jsonPostAnnounce(createPayload(), ctx);
    expect((ctx.log!.info as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('sends without auth header when no token', async () => {
    const received: { headers: http.IncomingHttpHeaders }[] = [];
    server = http.createServer((req, res) => {
      received.push({ headers: req.headers });
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        res.writeHead(200);
        res.end();
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}/announce`,
    });
    await jsonPostAnnounce(createPayload(), ctx);

    expect(received).toHaveLength(1);
    expect(received[0]!.headers['authorization']).toBeUndefined();
  });

  it('logs warning on HTTP failure without throwing', async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(500);
      res.end('Internal Server Error');
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}/announce`,
    });
    await jsonPostAnnounce(createPayload(), ctx);
    expect((ctx.log!.warn as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('vetraGraphqlAnnounce', () => {
  let server: http.Server | undefined;

  afterEach(() => {
    if (server) {
      server.close();
      server = undefined;
    }
  });

  it('sends GraphQL mutation with documentId from URL param and hostname prefix', async () => {
    const received: { body: string; headers: http.IncomingHttpHeaders }[] = [];
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        received.push({ body, headers: req.headers });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: { announceClintEndpoints: { ok: true, count: 1 } } }));
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}?documentId=doc-123`,
      serviceAnnounceToken: 'my-token',
    });
    const payload = createPayload([
      { id: 'svc-1', name: 'svc-1', type: 'api-graphql', url: 'http://localhost:3000', port: '3000', status: 'ready' },
    ]);
    await vetraGraphqlAnnounce(payload, ctx);

    expect(received).toHaveLength(1);
    const parsed = JSON.parse(received[0]!.body);
    expect(parsed.query).toContain('announceClintEndpoints');
    expect(parsed.variables.input.documentId).toBe('doc-123');
    expect(parsed.variables.input.prefix).toBe(os.hostname());
    expect(parsed.variables.input.endpoints).toEqual([
      { id: 'svc-1', type: 'api-graphql', port: '3000', status: 'enabled' },
    ]);
    expect(received[0]!.headers['authorization']).toBe('Bearer my-token');
  });

  it('logs info and returns when no URL configured', async () => {
    const ctx = createMockContext({});
    await vetraGraphqlAnnounce(createPayload(), ctx);
    expect((ctx.log!.info as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('logs info when URL has no documentId parameter', async () => {
    const ctx = createMockContext({
      serviceAnnounceUrl: 'http://localhost:9999/graphql',
    });
    await vetraGraphqlAnnounce(createPayload(), ctx);
    const infoCalls = (ctx.log!.info as jest.Mock).mock.calls;
    expect(infoCalls.some((c: unknown[]) => (c[0] as string).includes('documentId'))).toBe(true);
  });

  it('sends without auth header when no token', async () => {
    const received: { headers: http.IncomingHttpHeaders }[] = [];
    server = http.createServer((req, res) => {
      received.push({ headers: req.headers });
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: { announceClintEndpoints: { ok: true, count: 0 } } }));
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}?documentId=doc-1`,
    });
    await vetraGraphqlAnnounce(createPayload(), ctx);
    expect(received[0]!.headers['authorization']).toBeUndefined();
  });

  it('maps ready status to enabled and other status to disabled', async () => {
    const received: string[] = [];
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        received.push(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: { announceClintEndpoints: { ok: true, count: 2 } } }));
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}?documentId=doc-1`,
    });
    const payload = createPayload([
      { id: 's1', name: 's1', type: 'api-graphql', url: 'http://localhost:3000', port: '3000', status: 'ready' },
      { id: 's2', name: 's2', type: 'api-mcp', url: 'http://localhost:3001', port: '3001', status: 'starting' },
    ]);
    await vetraGraphqlAnnounce(payload, ctx);

    const parsed = JSON.parse(received[0]!);
    expect(parsed.variables.input.endpoints[0].status).toBe('enabled');
    expect(parsed.variables.input.endpoints[1].status).toBe('disabled');
  });

  it('logs warning on GraphQL error response', async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errors: [{ message: 'bad input' }] }));
      });
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}?documentId=doc-1`,
    });
    await vetraGraphqlAnnounce(createPayload(), ctx);
    expect((ctx.log!.warn as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('logs warning on HTTP failure without throwing', async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(500);
      res.end('error');
    });
    await new Promise<void>(resolve => server!.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const ctx = createMockContext({
      serviceAnnounceUrl: `http://localhost:${port}?documentId=doc-1`,
    });
    await vetraGraphqlAnnounce(createPayload(), ctx);
    expect((ctx.log!.warn as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
