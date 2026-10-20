import { describe, it, expect, jest } from '@jest/globals';
import { createProxyServer } from '../src/core/proxy.js';
import { buildSwitchboardPendingRoute } from '../src/core/proxy-routes.js';
import { createLogger } from '../src/core/logger.js';
import { createMemoryWorkdirStore } from '../src/core/store.js';
import type { CliRuntimeDeps } from '../src/core/runtime.js';
import type { CommandContext } from '../src/core/types.js';

// The real switchboard is heavy; stand in for it with a plain HTTP upstream.
const upstreamHits: string[] = [];
const http = await import('node:http');
const upstream = http.createServer((req, res) => {
  upstreamHits.push(req.url ?? '');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end('{"data":{}}');
});
await new Promise<void>((r) => upstream.listen(0, '127.0.0.1', () => r()));
const upstreamPort = (upstream.address() as { port: number }).port;

jest.unstable_mockModule('../src/integrations/powerhouse/switchboard.js', () => ({
  startSwitchboard: async () => ({
    switchboardUrl: `http://127.0.0.1:${upstreamPort}/graphql`,
    driveUrl: `http://127.0.0.1:${upstreamPort}/d/drive-1`,
    mcpUrl: `http://127.0.0.1:${upstreamPort}/mcp`,
    shutdown: async () => {},
  }),
}));
const { createCliRuntime } = await import('../src/core/runtime.js');

const logger = createLogger('warn', () => {});

describe('/switchboard "starting" placeholder across a switchboard boot', () => {
  it('answers 503 from proxy start until the switchboard is up, then proxies', async () => {
    const proxy = await createProxyServer({ port: 0, host: '127.0.0.1', logger });
    // What cli.ts does right after the proxy starts listening — before
    // lifecycle init, an interactive agent boot, or the reactor.
    proxy.addRoute(buildSwitchboardPendingRoute());

    let statusDuringReactorBoot: number | undefined;
    const context = { workdir: '/tmp', config: {}, workspace: createMemoryWorkdirStore(), stdout: () => {} } as unknown as CommandContext;
    const runtime = createCliRuntime({
      cliName: 'pending-test',
      cliVersion: '0.0.1',
      workdir: '/tmp',
      workspace: createMemoryWorkdirStore(),
      config: {},
      context,
      log: logger,
      commandMap: new Map(),
      skillIds: new Set<string>(),
      resolvedSkills: [],
      proxyInstance: proxy,
      enableConnect: false,
      reactorConfig: {
        create: async () => {
          const res = await fetch(`${proxy.url}/switchboard/graphql/r`, { method: 'POST' });
          statusDuringReactorBoot = res.status;
          await res.text();
          return {
            client: {} as never,
            driveId: 'drive-1',
            shutdown: async () => {},
            _module: {} as never,
            attachments: {} as never,
          };
        },
        switchboard: { enabled: true, port: 0 },
      } as unknown as CliRuntimeDeps['reactorConfig'],
    } as unknown as CliRuntimeDeps);

    try {
      await runtime.startupSequence(() => {});

      expect(statusDuringReactorBoot).toBe(503);
      expect(proxy.getRoutes().some((r) => r.source === 'switchboard-pending')).toBe(false);
      const res = await fetch(`${proxy.url}/switchboard/graphql/r`, { method: 'POST' });
      expect(res.status).toBe(200);
      await res.text();
      expect(upstreamHits).toContain('/graphql/r');
    } finally {
      await proxy.stop();
      upstream.close();
    }
  });
});
