import { describe, it, expect } from '@jest/globals';
import { Writable } from 'node:stream';
import { startDevServer, parseCliArgs, envPrefix, printSentryEnvelope } from '../src/dev-server.js';

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

  it('announces both OTLP and Sentry DSN env vars on startup', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'myapp', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const text = out.text();
      expect(text).toContain('MYAPP_OTEL_EXPORTER_OTLP_ENDPOINT');
      expect(text).toContain('MYAPP_SENTRY_DSN');
      expect(text).toContain(handle.url);
      expect(text).toContain(handle.sentryDsn);
      // Sentry DSN should embed the receiver's host:port and a project id.
      expect(handle.sentryDsn).toMatch(/^http:\/\/dev@127\.0\.0\.1:\d+\/1$/);
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

  it('accepts POST /api/<projectId>/envelope/ and prints event payload', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      // A minimal Sentry envelope: header line + item header + item payload,
      // newline-delimited. The Sentry SDK constructs this for each event.
      const envelopeHeader = JSON.stringify({ event_id: 'evt-1', sent_at: '2026-05-13T10:00:00Z' });
      const itemHeader = JSON.stringify({ type: 'event' });
      const itemPayload = JSON.stringify({
        event_id: 'evt-1',
        level: 'error',
        exception: { values: [{ type: 'Error', value: 'kaboom' }] },
      });
      const body = `${envelopeHeader}\n${itemHeader}\n${itemPayload}\n`;
      const res = await fetch(`${handle.url}/api/1/envelope/`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-sentry-envelope' },
        body,
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');
      const respBody = await res.text();
      expect(respBody).toBe('{}');
      const text = out.text();
      expect(text).toContain('[SENTRY] envelope');
      expect(text).toContain('event_id');
      expect(text).toContain('item.type=event');
      expect(text).toContain('kaboom');
    } finally {
      await handle.close();
    }
  });

  it('accepts envelope path with query params (Sentry SDK appends ?sentry_key=...)', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const body = `${JSON.stringify({})}\n${JSON.stringify({ type: 'session' })}\n${JSON.stringify({ sid: 'abc' })}\n`;
      const res = await fetch(`${handle.url}/api/1/envelope/?sentry_key=pub&sentry_version=7`, {
        method: 'POST',
        body,
      });
      expect(res.status).toBe(200);
      await res.text();
      expect(out.text()).toContain('item.type=session');
    } finally {
      await handle.close();
    }
  });

  it('handles malformed envelope body without crashing', async () => {
    const out = makeOut();
    const handle = await startDevServer({ cliName: 'app', host: '127.0.0.1', port: 0, out: out.stream });
    try {
      const res = await fetch(`${handle.url}/api/1/envelope/`, {
        method: 'POST',
        body: Buffer.from('not-an-envelope'),
      });
      expect(res.status).toBe(200);
      await res.text();
      expect(out.text()).toMatch(/\[SENTRY\] \d+ bytes \(could not parse envelope header\)/);
    } finally {
      await handle.close();
    }
  });
});

describe('printSentryEnvelope', () => {
  function collect(body: string): string {
    const chunks: string[] = [];
    const stream = new Writable({ write(c, _, cb) { chunks.push(c.toString()); cb(); } });
    printSentryEnvelope(Buffer.from(body), stream);
    return chunks.join('');
  }

  it('decodes event payloads as pretty JSON', () => {
    const body = [
      JSON.stringify({ event_id: 'e1' }),
      JSON.stringify({ type: 'event' }),
      JSON.stringify({ event_id: 'e1', message: 'hello' }),
      '',
    ].join('\n');
    const out = collect(body);
    expect(out).toContain('item.type=event');
    expect(out).toContain('"message": "hello"');
  });

  it('decodes transaction payloads as pretty JSON', () => {
    const body = [
      JSON.stringify({}),
      JSON.stringify({ type: 'transaction' }),
      JSON.stringify({ transaction: 'GET /thing' }),
      '',
    ].join('\n');
    expect(collect(body)).toContain('"transaction": "GET /thing"');
  });

  it('shows non-event item types by type + size only', () => {
    const body = [
      JSON.stringify({}),
      JSON.stringify({ type: 'attachment', length: 5 }),
      'binarystuff',
      '',
    ].join('\n');
    const out = collect(body);
    expect(out).toContain('item.type=attachment');
    expect(out).not.toContain('binarystuff'); // raw payload not shown for non-event types
  });

  it('falls back to size message when an event payload is not JSON', () => {
    const body = [
      JSON.stringify({}),
      JSON.stringify({ type: 'event' }),
      'not-json',
      '',
    ].join('\n');
    expect(collect(body)).toContain('payload not JSON-parseable');
  });

  it('skips malformed item headers and continues', () => {
    const body = [
      JSON.stringify({}),
      'not-a-json-header',
      JSON.stringify({ type: 'event' }),
      JSON.stringify({ ok: true }),
      '',
    ].join('\n');
    const out = collect(body);
    // Should still find and decode the event item after skipping the malformed line
    expect(out).toContain('item.type=event');
    expect(out).toContain('"ok": true');
  });
});
