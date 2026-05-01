import { describe, it, expect, afterEach, afterAll, beforeAll } from '@jest/globals';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  detectCliName,
  formatStartupOutput,
  createRegistryServer,
  createGraphqlRegistryServer,
} from '../../src/registries/shared.js';

function postJson(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: string) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode!, body }));
      },
    );
    req.on('error', reject);
    req.end(data);
  });
}

function getJson(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    http.get({ hostname: u.hostname, port: u.port, path: u.pathname }, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode!, body }));
    }).on('error', reject);
  });
}

// Track servers to close after each test
const servers: http.Server[] = [];
afterEach(async () => {
  for (const s of servers) {
    await new Promise<void>((r) => s.close(() => r()));
  }
  servers.length = 0;
});

function listenOnRandom(server: http.Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      servers.push(server);
      resolve(`http://localhost:${addr.port}`);
    });
  });
}

describe('detectCliName', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'detect-cli-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns placeholder when no project context found', () => {
    expect(detectCliName('/tmp')).toBe('<CLI_NAME>');
  });

  it('strips -cli suffix in split layout (e.g. ph-nimby-cli → PH_NIMBY)', () => {
    // Create split layout: root/ph-nimby-cli/ + root/ph-nimby-app/
    const root = path.join(tmpDir, 'split');
    const cliDir = path.join(root, 'ph-nimby-cli');
    const appDir = path.join(root, 'ph-nimby-app');
    fs.mkdirSync(cliDir, { recursive: true });
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(path.join(cliDir, 'package.json'), JSON.stringify({
      name: '@powerhousedao/ph-nimby-cli',
      dependencies: { '@powerhousedao/ph-clint': '0.0.1' },
    }));
    fs.writeFileSync(path.join(appDir, 'package.json'), '{}');

    expect(detectCliName(cliDir)).toBe('PH_NIMBY');
  });

  it('flat layout name without -cli suffix is unchanged', () => {
    const flat = path.join(tmpDir, 'ph-test-fresh');
    fs.mkdirSync(flat, { recursive: true });
    fs.writeFileSync(path.join(flat, 'package.json'), JSON.stringify({
      name: 'ph-test-fresh',
      dependencies: { '@powerhousedao/ph-clint': '0.0.1' },
    }));

    expect(detectCliName(flat)).toBe('PH_TEST_FRESH');
  });
});

describe('formatStartupOutput', () => {
  it('formats output without auth token', () => {
    const out = formatStartupOutput('json-post', 'http://localhost:3000', 'MY_CLI');
    expect(out).toContain('json-post registry listening on http://localhost:3000');
    expect(out).toContain('MY_CLI_SERVICE_ANNOUNCE_URL=http://localhost:3000');
    expect(out).not.toContain('TOKEN');
  });

  it('formats output with auth token', () => {
    const out = formatStartupOutput('vetra-graphql', 'http://localhost:3000', 'MY_CLI', 'secret123');
    expect(out).toContain('vetra-graphql registry listening on http://localhost:3000');
    expect(out).toContain('MY_CLI_SERVICE_ANNOUNCE_URL=http://localhost:3000');
    expect(out).toContain('MY_CLI_SERVICE_ANNOUNCE_TOKEN=secret123');
  });
});

describe('createRegistryServer (JSON POST)', () => {
  it('stores announcements and returns them via GET', async () => {
    const { server } = createRegistryServer({});
    const url = await listenOnRandom(server);

    const post = await postJson(url, { name: 'test-service' });
    expect(post.status).toBe(200);
    expect(JSON.parse(post.body)).toEqual({ ok: true });

    const get = await getJson(`${url}/announcements`);
    expect(get.status).toBe(200);
    expect(JSON.parse(get.body)).toEqual([{ name: 'test-service' }]);
  });

  it('returns 404 for unknown paths', async () => {
    const { server } = createRegistryServer({});
    const url = await listenOnRandom(server);
    const get = await getJson(`${url}/unknown`);
    expect(get.status).toBe(404);
  });

  it('with auth — rejects POST without token', async () => {
    const { server } = createRegistryServer({ withAuth: true });
    const url = await listenOnRandom(server);
    const post = await postJson(url, { name: 'x' });
    expect(post.status).toBe(401);
  });

  it('with auth — rejects POST with wrong token', async () => {
    const { server } = createRegistryServer({ withAuth: true });
    const url = await listenOnRandom(server);
    const post = await postJson(url, { name: 'x' }, { Authorization: 'Bearer wrong' });
    expect(post.status).toBe(401);
  });

  it('with auth — accepts POST with correct token', async () => {
    const { server, token } = createRegistryServer({ withAuth: true });
    const url = await listenOnRandom(server);
    const post = await postJson(url, { name: 'x' }, { Authorization: `Bearer ${token}` });
    expect(post.status).toBe(200);
  });
});

describe('createGraphqlRegistryServer', () => {
  it('stores mutation input and returns success response', async () => {
    const { server } = createGraphqlRegistryServer({});
    const url = await listenOnRandom(server);

    const mutation = {
      query: 'mutation { announceClintEndpoints(input: $input) { ok count } }',
      variables: { input: { endpoints: [{ url: 'http://a' }, { url: 'http://b' }] } },
    };
    const post = await postJson(url, mutation);
    expect(post.status).toBe(200);
    const body = JSON.parse(post.body);
    expect(body.data.announceClintEndpoints.ok).toBe(true);
    expect(body.data.announceClintEndpoints.count).toBe(2);

    const get = await getJson(`${url}/announcements`);
    expect(JSON.parse(get.body)).toEqual([mutation.variables.input]);
  });

  it('rejects missing query', async () => {
    const { server } = createGraphqlRegistryServer({});
    const url = await listenOnRandom(server);
    const post = await postJson(url, { variables: { input: {} } });
    expect(post.status).toBe(400);
    expect(post.body).toContain('missing query');
  });

  it('rejects missing variables.input', async () => {
    const { server } = createGraphqlRegistryServer({});
    const url = await listenOnRandom(server);
    const post = await postJson(url, { query: 'mutation {}', variables: {} });
    expect(post.status).toBe(400);
    expect(post.body).toContain('missing query or variables.input');
  });

  it('with auth — rejects unauthorized', async () => {
    const { server } = createGraphqlRegistryServer({ withAuth: true });
    const url = await listenOnRandom(server);
    const post = await postJson(url, {
      query: 'mutation {}',
      variables: { input: {} },
    });
    expect(post.status).toBe(401);
  });

  it('with auth — accepts authorized', async () => {
    const { server, token } = createGraphqlRegistryServer({ withAuth: true });
    const url = await listenOnRandom(server);
    const post = await postJson(
      url,
      { query: 'mutation {}', variables: { input: { endpoints: [] } } },
      { Authorization: `Bearer ${token}` },
    );
    expect(post.status).toBe(200);
  });
});
