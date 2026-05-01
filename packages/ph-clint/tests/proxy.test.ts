import { describe, it, expect, afterEach } from '@jest/globals';
import http from 'node:http';
import { createProxyServer } from '../src/core/proxy.js';
import type { ProxyServerInstance } from '../src/core/proxy.js';
import type { ProxyRoute } from '../src/core/proxy-routes.js';
import { buildSwitchboardRoutes, buildServiceRoutes } from '../src/core/proxy-routes.js';
import type { ServiceDefinition, ServiceInstanceStatus } from '../src/core/types.js';
import { createLogger } from '../src/core/logger.js';

const logger = createLogger('warn', () => {});

// Track servers for cleanup
const servers: Array<{ close: () => Promise<void> | void }> = [];

afterEach(async () => {
  for (const s of servers) {
    await s.close();
  }
  servers.length = 0;
});

/** Create a simple upstream HTTP server that echoes the request. */
function createUpstream(response = 'ok'): Promise<{ url: string; server: http.Server }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ echo: true, path: req.url, body: response }));
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      servers.push({ close: () => new Promise<void>(r => server.close(() => r())) });
      resolve({ url: `http://127.0.0.1:${addr.port}`, server });
    });
  });
}

/** Simple HTTP GET. */
function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode!, body }));
    }).on('error', reject);
  });
}

describe('createProxyServer', () => {
  let proxy: ProxyServerInstance;

  async function startProxy(): Promise<ProxyServerInstance> {
    proxy = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    servers.push({ close: () => proxy.stop() });
    return proxy;
  }

  it('starts and reports port/url', async () => {
    const p = await startProxy();
    expect(p.port).toBeGreaterThan(0);
    expect(p.url).toContain(`http://127.0.0.1:${p.port}`);
  });

  it('health endpoint returns ok', async () => {
    const p = await startProxy();
    const res = await httpGet(`${p.url}/_proxy/health`);
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true, routes: 0 });
  });

  it('routes endpoint returns empty array initially', async () => {
    const p = await startProxy();
    const res = await httpGet(`${p.url}/_proxy/routes`);
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('returns 404 for unmatched routes', async () => {
    const p = await startProxy();
    const res = await httpGet(`${p.url}/unknown`);
    expect(res.status).toBe(404);
  });

  it('forwards requests to upstream', async () => {
    const upstream = await createUpstream('hello');
    const p = await startProxy();

    const route: ProxyRoute = {
      prefix: '/api',
      upstream: new URL(upstream.url),
      ws: false,
      source: 'test',
    };
    p.addRoute(route);

    const res = await httpGet(`${p.url}/api/some/path`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.echo).toBe(true);
    expect(body.path).toBe('/some/path');
  });

  it('returns 502 when upstream is unreachable', async () => {
    const p = await startProxy();

    const route: ProxyRoute = {
      prefix: '/dead',
      upstream: new URL('http://127.0.0.1:1'), // unreachable port
      ws: false,
      source: 'test',
    };
    p.addRoute(route);

    const res = await httpGet(`${p.url}/dead/path`);
    expect(res.status).toBe(502);
  });

  it('manages routes: add, remove, sort', async () => {
    const p = await startProxy();

    const route1: ProxyRoute = {
      prefix: '/a',
      upstream: new URL('http://localhost:1234'),
      ws: false,
      source: 'src-a',
    };
    const route2: ProxyRoute = {
      prefix: '/a/b',
      upstream: new URL('http://localhost:1235'),
      ws: false,
      source: 'src-b',
    };

    p.addRoute(route1);
    p.addRoute(route2);

    // Sorted longest-prefix-first
    const routes = p.getRoutes();
    expect(routes[0].prefix).toBe('/a/b');
    expect(routes[1].prefix).toBe('/a');

    p.removeRoutesBySource('src-b');
    expect(p.getRoutes()).toHaveLength(1);
    expect(p.getRoutes()[0].prefix).toBe('/a');
  });

  it('health endpoint reflects route count', async () => {
    const p = await startProxy();
    p.addRoute({
      prefix: '/x',
      upstream: new URL('http://localhost:1234'),
      ws: false,
      source: 'x',
    });

    const res = await httpGet(`${p.url}/_proxy/health`);
    expect(JSON.parse(res.body).routes).toBe(1);
  });

  it('routes debug endpoint returns route details', async () => {
    const p = await startProxy();
    p.addRoute({
      prefix: '/foo',
      upstream: new URL('http://localhost:9999/bar'),
      ws: true,
      source: 'test-src',
    });

    const res = await httpGet(`${p.url}/_proxy/routes`);
    const routes = JSON.parse(res.body);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({
      prefix: '/foo',
      upstream: 'http://localhost:9999/bar',
      ws: true,
      source: 'test-src',
    });
  });

  it('stop closes the server', async () => {
    const p = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    await p.stop();
    // After stop, connecting should fail
    await expect(httpGet(`${p.url}/_proxy/health`)).rejects.toThrow();
  });
});

describe('proxy routes end-to-end', () => {
  it('switchboard routes forward to correct upstreams', async () => {
    // Simulate switchboard (graphql + d/) and MCP as two separate upstreams
    const sbUpstream = await createUpstream('switchboard');
    const mcpUpstream = await createUpstream('mcp');

    const proxy = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    servers.push({ close: () => proxy.stop() });

    const routes = buildSwitchboardRoutes(sbUpstream.url, mcpUpstream.url);
    for (const r of routes) proxy.addRoute(r);

    // GraphQL endpoint → switchboard upstream
    const gqlRes = await httpGet(`${proxy.url}/switchboard/graphql`);
    expect(gqlRes.status).toBe(200);
    const gqlBody = JSON.parse(gqlRes.body);
    expect(gqlBody.body).toBe('switchboard');
    expect(gqlBody.path).toBe('/graphql');

    // Drive endpoint → switchboard upstream
    const driveRes = await httpGet(`${proxy.url}/switchboard/d/some-drive`);
    expect(driveRes.status).toBe(200);
    const driveBody = JSON.parse(driveRes.body);
    expect(driveBody.body).toBe('switchboard');
    expect(driveBody.path).toBe('/d/some-drive');

    // MCP endpoint → MCP upstream
    const mcpRes = await httpGet(`${proxy.url}/switchboard/mcp`);
    expect(mcpRes.status).toBe(200);
    const mcpBody = JSON.parse(mcpRes.body);
    expect(mcpBody.body).toBe('mcp');
    expect(mcpBody.path).toBe('/mcp');
  });

  it('service routes forward to service upstreams', async () => {
    const svcUpstream = await createUpstream('service-mcp');

    const proxy = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    servers.push({ close: () => proxy.stop() });

    const def: ServiceDefinition = {
      id: 'my-registry',
      command: 'echo',
      readiness: {
        pattern: /listening on (http:\/\/\S+)/,
        captures: {
          mcp: { group: 1, type: 'api-mcp' },
        },
        timeout: 5000,
      },
    };

    const instance: ServiceInstanceStatus = {
      serviceId: 'my-registry',
      instanceId: 'i1',
      name: 'my-registry',
      status: 'ready',
      endpoints: { mcp: `${svcUpstream.url}/mcp` },
    };

    const routes = buildServiceRoutes(def, instance);
    for (const r of routes) proxy.addRoute(r);

    const res = await httpGet(`${proxy.url}/my-registry/mcp`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.body).toBe('service-mcp');
    expect(body.path).toBe('/mcp');
  });

  it('switchboard and service routes coexist with correct routing', async () => {
    const sbUpstream = await createUpstream('sb');
    const mcpUpstream = await createUpstream('mcp-sb');
    const svcUpstream = await createUpstream('svc');

    const proxy = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    servers.push({ close: () => proxy.stop() });

    // Add switchboard routes
    for (const r of buildSwitchboardRoutes(sbUpstream.url, mcpUpstream.url)) {
      proxy.addRoute(r);
    }

    // Add service routes
    const def: ServiceDefinition = {
      id: 'ext-svc',
      command: 'echo',
      readiness: {
        patterns: [
          {
            name: 'rest',
            pattern: /REST at (http:\/\/\S+)/,
            captures: { api: { group: 1, type: 'api-rest' } },
          },
          {
            name: 'mcp',
            pattern: /MCP at (http:\/\/\S+)/,
            captures: { mcp: { group: 1, type: 'api-mcp' } },
          },
        ],
        timeout: 5000,
      },
    };
    const instance: ServiceInstanceStatus = {
      serviceId: 'ext-svc',
      instanceId: 'i1',
      name: 'ext-svc',
      status: 'ready',
      endpoints: {
        api: `${svcUpstream.url}/api`,
        mcp: `${svcUpstream.url}/mcp`,
      },
    };
    for (const r of buildServiceRoutes(def, instance)) {
      proxy.addRoute(r);
    }

    // Switchboard graphql → sb upstream
    const gqlRes = await httpGet(`${proxy.url}/switchboard/graphql`);
    expect(JSON.parse(gqlRes.body).body).toBe('sb');

    // Switchboard MCP → mcp upstream
    const mcpRes = await httpGet(`${proxy.url}/switchboard/mcp`);
    expect(JSON.parse(mcpRes.body).body).toBe('mcp-sb');

    // Service REST → svc upstream
    const apiRes = await httpGet(`${proxy.url}/ext-svc/api/data`);
    expect(apiRes.status).toBe(200);
    expect(JSON.parse(apiRes.body).body).toBe('svc');
    expect(JSON.parse(apiRes.body).path).toBe('/api/data');

    // Service MCP → svc upstream
    const svcMcpRes = await httpGet(`${proxy.url}/ext-svc/mcp`);
    expect(JSON.parse(svcMcpRes.body).body).toBe('svc');
    expect(JSON.parse(svcMcpRes.body).path).toBe('/mcp');

    // Unmatched → 404
    const notFound = await httpGet(`${proxy.url}/unknown`);
    expect(notFound.status).toBe(404);

    // Verify route count
    const health = await httpGet(`${proxy.url}/_proxy/health`);
    expect(JSON.parse(health.body).routes).toBe(5); // 3 switchboard + 2 service

    // Remove service routes, switchboard stays
    proxy.removeRoutesBySource('service:ext-svc');
    const afterRemove = await httpGet(`${proxy.url}/_proxy/health`);
    expect(JSON.parse(afterRemove.body).routes).toBe(3);

    // Service routes gone
    const gone = await httpGet(`${proxy.url}/ext-svc/mcp`);
    expect(gone.status).toBe(404);

    // Switchboard still works
    const stillUp = await httpGet(`${proxy.url}/switchboard/graphql`);
    expect(stillUp.status).toBe(200);
  });
});
