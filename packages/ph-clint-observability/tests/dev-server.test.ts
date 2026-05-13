import { describe, it, expect } from '@jest/globals';
import { Writable } from 'node:stream';
import { startDevServer, parseCliArgs, envPrefix } from '../src/dev-server.js';

describe('parseCliArgs', () => {
  it('parses --cli-name, --port, --host with defaults', () => {
    const a = parseCliArgs(['node', 'bin', '--cli-name=myapp']);
    expect(a.cliName).toBe('myapp');
    expect(a.port).toBe(4318);
    expect(a.host).toBe('127.0.0.1');
  });

  it('overrides port and host', () => {
    const a = parseCliArgs(['node', 'bin', '--cli-name=x', '--port=5555', '--host=0.0.0.0']);
    expect(a.port).toBe(5555);
    expect(a.host).toBe('0.0.0.0');
  });

  it('defaults cli-name to mycli when missing', () => {
    const a = parseCliArgs(['node', 'bin']);
    expect(a.cliName).toBe('mycli');
  });
});

describe('envPrefix', () => {
  it('uppercases and replaces dashes with underscores', () => {
    expect(envPrefix('my-cli')).toBe('MY_CLI');
    expect(envPrefix('mycli')).toBe('MYCLI');
    expect(envPrefix('a-b-c')).toBe('A_B_C');
  });
});

describe('startDevServer (HTTP smoke)', () => {
  function makeOut() {
    const chunks: string[] = [];
    return {
      stream: new Writable({ write(c, _, cb) { chunks.push(c.toString()); cb(); } }),
      text: () => chunks.join(''),
    };
  }

  it('announces the env var on startup', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'myapp', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const text = out.text();
      expect(text).toContain('MYAPP_OTEL_EXPORTER_OTLP_ENDPOINT');
      expect(text).toContain(handle.url);
    } finally {
      await handle.close();
    }
  });

  it('accepts POST /v1/traces and prints JSON payloads', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const res = await fetch(`${handle.url}/v1/traces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resourceSpans: [{ resource: 'r' }] }),
      });
      expect(res.status).toBe(200);
      // Drain body so the connection closes
      await res.text();
      expect(out.text()).toContain('[TRACE]');
      expect(out.text()).toContain('resourceSpans');
    } finally {
      await handle.close();
    }
  });

  it('accepts POST /v1/metrics with non-JSON payload (protobuf-shaped)', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const res = await fetch(`${handle.url}/v1/metrics`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-protobuf' },
        body: Buffer.from([0x01, 0x02, 0x03]),
      });
      expect(res.status).toBe(200);
      await res.text();
      expect(out.text()).toMatch(/\[METRIC\] 3 bytes/);
    } finally {
      await handle.close();
    }
  });

  it('responds 404 for unknown paths', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const res = await fetch(`${handle.url}/unknown`);
      expect(res.status).toBe(404);
      await res.text();
    } finally {
      await handle.close();
    }
  });
});
