import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'node:http';
import { shouldSetLatest } from '../../src/publish/npm.js';

/**
 * Create a minimal local npm-registry-like server that serves package metadata.
 * Returns the registry URL and a function to set the response data.
 */
function createMockRegistry() {
  let responseData: Record<string, unknown> | null = null;
  let statusCode = 200;

  const server = http.createServer((_req, res) => {
    if (responseData === null) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{"error":"not found"}');
      return;
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseData));
  });

  return {
    server,
    setResponse(data: Record<string, unknown> | null, status = 200) {
      responseData = data;
      statusCode = status;
    },
    async start(): Promise<string> {
      return new Promise((resolve) => {
        server.listen(0, () => {
          const addr = server.address();
          const port = typeof addr === 'object' && addr ? addr.port : 0;
          resolve(`http://localhost:${port}`);
        });
      });
    },
    stop(): Promise<void> {
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

describe('shouldSetLatest', () => {
  const registry = createMockRegistry();
  let registryUrl: string;

  beforeAll(async () => {
    registryUrl = await registry.start();
  });

  afterAll(async () => {
    await registry.stop();
  });

  it('returns true for production tag (always)', async () => {
    registry.setResponse(null); // 404
    expect(await shouldSetLatest('test-pkg', 'production', registryUrl)).toBe(true);
  });

  it('returns true for new package (404)', async () => {
    registry.setResponse(null); // 404
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(true);
    expect(await shouldSetLatest('test-pkg', 'staging', registryUrl)).toBe(true);
  });

  it('returns true for dev when only dev versions exist', async () => {
    registry.setResponse({
      'dist-tags': { dev: '0.1.0-dev.3', latest: '0.1.0-dev.3' },
      versions: { '0.1.0-dev.0': {}, '0.1.0-dev.3': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(true);
  });

  it('returns false for dev when staging exists', async () => {
    registry.setResponse({
      'dist-tags': { dev: '0.1.0-dev.5', staging: '0.1.0-staging.0', latest: '0.1.0-staging.0' },
      versions: { '0.1.0-dev.5': {}, '0.1.0-staging.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(false);
  });

  it('returns true for staging when only dev+staging versions exist', async () => {
    registry.setResponse({
      'dist-tags': { dev: '0.1.0-dev.5', staging: '0.1.0-staging.0', latest: '0.1.0-dev.5' },
      versions: { '0.1.0-dev.5': {}, '0.1.0-staging.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'staging', registryUrl)).toBe(true);
  });

  it('returns false for staging when production exists', async () => {
    registry.setResponse({
      'dist-tags': { latest: '1.0.0', dev: '1.1.0-dev.0', staging: '1.1.0-staging.0' },
      versions: { '1.0.0': {}, '1.1.0-dev.0': {}, '1.1.0-staging.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'staging', registryUrl)).toBe(false);
  });

  it('returns false for dev when production owns latest', async () => {
    registry.setResponse({
      'dist-tags': { latest: '1.0.0', dev: '1.1.0-dev.0' },
      versions: { '1.0.0': {}, '1.1.0-dev.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(false);
  });

  it('returns true when no dist-tags exist at all', async () => {
    registry.setResponse({
      versions: { '0.1.0-dev.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(true);
  });

  it('returns true when latest tag is missing', async () => {
    registry.setResponse({
      'dist-tags': { dev: '0.1.0-dev.0' },
      versions: { '0.1.0-dev.0': {} },
    });
    expect(await shouldSetLatest('test-pkg', 'dev', registryUrl)).toBe(true);
  });
});
