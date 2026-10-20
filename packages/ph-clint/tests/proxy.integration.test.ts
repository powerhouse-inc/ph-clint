import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { defineCli } from '../src/core/cli.js';
import type { RunOptions } from '../src/core/types.js';
import net from 'node:net';

describe('proxy integration with defineCli', () => {
  it('proxyEnabled injects proxyPort and proxyHost config fields', () => {
    const cli = defineCli({
      name: 'test-proxy',
      version: '0.0.1',
      description: 'test',
      commands: [],
      configSchema: z.object({}),
      proxyEnabled: true,
    });

    const envVars = cli.configEnvVars();
    const envNames = envVars.map(e => e.name);
    expect(envNames).toContain('TEST_PROXY_PROXY_PORT');
    expect(envNames).toContain('TEST_PROXY_PROXY_HOST');
  });

  it('without proxyEnabled, no proxy config fields', () => {
    const cli = defineCli({
      name: 'test-noproxy',
      version: '0.0.1',
      description: 'test',
      commands: [],
      configSchema: z.object({}),
    });

    const envVars = cli.configEnvVars();
    const envNames = envVars.map(e => e.name);
    expect(envNames).not.toContain('TEST_NOPROXY_PROXY_PORT');
    expect(envNames).not.toContain('TEST_NOPROXY_PROXY_HOST');
  });

  it('proxy keeps the process alive', async () => {
    const cli = defineCli({
      name: 'test-proxy-alive',
      version: '0.0.1',
      description: 'test',
      commands: [],
      configSchema: z.object({}),
      proxyEnabled: true,
      interactive: {
        welcome: 'hello',
      },
    });

    const output: string[] = [];
    const opts: RunOptions = {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      // Use streaming interactive mode with immediate EOF to trigger keep-alive path
      interactiveInput: (async function* () {
        // yield nothing — EOF immediately
      })(),
    };

    // Run with --wait flag to trigger headless keep-alive mode
    // Use a short timeout to avoid hanging
    const runPromise = cli.run(['-i'], opts);
    // Give it a moment to start up
    await new Promise(r => setTimeout(r, 500));

    // Check that proxy listening message appeared
    const hasProxyMessage = output.some(l => l.includes('Proxy listening on'));
    expect(hasProxyMessage).toBe(true);

    // The run should not have exited (keep-alive due to proxy)
    // Clean up by stopping (the proxy teardown should handle this)
  }, 10000);

  it('holds /switchboard at 503 from the moment the proxy listens, before lifecycle init', async () => {
    // Lifecycle init (and, interactively, the agent + reactor boot) runs
    // between the proxy binding and the switchboard routes. A 404 there makes
    // a syncing browser stop syncing for good; 503 makes it retry.
    const port = await new Promise<number>((resolve) => {
      const srv = net.createServer();
      srv.listen(0, '127.0.0.1', () => {
        const p = (srv.address() as net.AddressInfo).port;
        srv.close(() => resolve(p));
      });
    });
    let statusDuringLifecycleInit: number | undefined;
    const cli = defineCli({
      name: 'test-proxy-pending',
      version: '0.0.1',
      description: 'test',
      commands: [],
      configSchema: z.object({}),
      proxyEnabled: true,
      interactive: { welcome: 'hello' },
      lifecycle: [{
        name: 'probe',
        onInit: async () => {
          const res = await fetch(`http://127.0.0.1:${port}/switchboard/graphql/r`);
          statusDuringLifecycleInit = res.status;
          await res.text();
          return {};
        },
      }],
    });
    cli.configureReactor({
      create: async () => ({ client: {} as never, driveId: 'd', shutdown: async () => {} }),
      switchboard: { enabled: true, port: 19993 },
    });

    process.env.TEST_PROXY_PENDING_PROXY_PORT = String(port);
    process.env.TEST_PROXY_PENDING_PROXY_HOST = '127.0.0.1';
    try {
      // Like the keep-alive test above: the proxy keeps the run alive, so
      // don't await it; wait for the probe instead.
      void cli.run(['-i', '-S', '-R'], {
        stdout: () => {},
        stderr: () => {},
        exit: () => {},
        interactiveInput: (async function* () {})(),
      });
      for (let i = 0; i < 100 && statusDuringLifecycleInit === undefined; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
    } finally {
      delete process.env.TEST_PROXY_PENDING_PROXY_PORT;
      delete process.env.TEST_PROXY_PENDING_PROXY_HOST;
    }

    expect(statusDuringLifecycleInit).toBe(503);
  }, 20000);
});
