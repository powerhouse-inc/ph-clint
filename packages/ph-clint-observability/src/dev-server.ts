/**
 * Local OTLP + Sentry-envelope receiver for dev work.
 *
 * Inspired by the deleted service-announcer pattern: prints the endpoints to
 * stdout so the dev knows what env vars to set in another terminal before
 * running their CLI.
 *
 * Routes (one server, two protocols):
 *   POST /v1/traces                 — OTLP traces (OTel)
 *   POST /v1/metrics                — OTLP metrics (OTel)
 *   POST /api/<projectId>/envelope/ — Sentry envelope (error events, transactions, sessions)
 *
 * JSON payloads (e.g. OTEL_EXPORTER_OTLP_PROTOCOL=http/json on the OTel sender)
 * are pretty-printed; protobuf payloads show byte length only. Sentry envelopes
 * are always newline-delimited text so they're parsed and shown per item.
 *
 * This module is library-only — pure exports, no side effects. The bin
 * entry that actually invokes the server lives at `src/bin/ph-telemetry-dev.ts`.
 */
import http from 'node:http';
import { parseArgs } from 'node:util';

interface CliArgs {
  cliName: string;
  port: number;
  host: string;
}

export function parseCliArgs(argv: string[]): CliArgs {
  const { values } = parseArgs({
    args: argv.slice(2),
    options: {
      'cli-name': { type: 'string' },
      port: { type: 'string', default: '4318' },
      host: { type: 'string', default: '127.0.0.1' },
    },
  });
  return {
    cliName: values['cli-name'] ?? 'mycli',
    port: Number(values.port),
    host: values.host ?? '127.0.0.1',
  };
}

export function envPrefix(cliName: string): string {
  return cliName.toUpperCase().replace(/-/g, '_');
}

export interface DevServerOptions {
  cliName: string;
  port: number;
  host: string;
  /** Where to write logs. Defaults to process.stdout. */
  out?: NodeJS.WritableStream;
}

export interface DevServerHandle {
  url: string;
  port: number;
  /** The Sentry-compatible DSN that points at this receiver. */
  sentryDsn: string;
  close: () => Promise<void>;
}

/**
 * Sentry envelope path matcher. Real Sentry SDKs POST to
 * `/api/<projectId>/envelope/` with optional query params like
 * `?sentry_key=...&sentry_version=7`. We accept any projectId.
 */
const SENTRY_ENVELOPE_PATH = /^\/api\/[^/]+\/envelope\/?(?:\?.*)?$/;

/**
 * Pretty-print a Sentry envelope to stdout. The envelope is
 * newline-delimited: first line is the envelope header (JSON), then
 * alternating item-header (JSON, with `type` and optional `length`) and
 * item-payload pairs. Event and transaction payloads are decoded as JSON;
 * other item types show their type only.
 */
export function printSentryEnvelope(body: Buffer, out: NodeJS.WritableStream): void {
  const lines = body.toString('utf-8').split('\n');
  let envelopeHeader: unknown;
  try {
    envelopeHeader = JSON.parse(lines[0]!);
  } catch {
    out.write(`[SENTRY] ${body.length} bytes (could not parse envelope header)\n`);
    return;
  }

  out.write(`[SENTRY] envelope ${JSON.stringify(envelopeHeader)}\n`);

  let i = 1;
  while (i < lines.length) {
    if (!lines[i]) { i++; continue; }
    let itemHeader: { type?: string; length?: number };
    try {
      itemHeader = JSON.parse(lines[i]!) as { type?: string; length?: number };
    } catch {
      i++;
      continue;
    }
    const payloadIdx = i + 1;
    if (payloadIdx >= lines.length) break;

    const kind = itemHeader.type ?? 'unknown';
    if (kind === 'event' || kind === 'transaction') {
      try {
        const payload = JSON.parse(lines[payloadIdx]!);
        out.write(`[SENTRY] item.type=${kind}\n${JSON.stringify(payload, null, 2)}\n`);
      } catch {
        out.write(`[SENTRY] item.type=${kind} (payload not JSON-parseable, ${lines[payloadIdx]!.length} bytes)\n`);
      }
    } else {
      out.write(`[SENTRY] item.type=${kind} (${lines[payloadIdx]!.length} bytes)\n`);
    }

    i = payloadIdx + 1;
  }
}

/**
 * Start the receiver and return a handle for tests / programmatic use. The
 * server listens until `close()` is called or the process exits.
 */
export async function startDevServer(opts: DevServerOptions): Promise<DevServerHandle> {
  const out = opts.out ?? process.stdout;
  const server = http.createServer((req, res) => {
    if (req.url === '/v1/traces' || req.url === '/v1/metrics') {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        const kind = req.url === '/v1/traces' ? 'TRACE' : 'METRIC';
        try {
          const json = JSON.parse(body.toString('utf-8'));
          out.write(`[${kind}] ${JSON.stringify(json, null, 2)}\n`);
        } catch {
          out.write(`[${kind}] ${body.length} bytes (protobuf — set OTEL_EXPORTER_OTLP_PROTOCOL=http/json for readable output)\n`);
        }
        res.writeHead(200, { 'Content-Type': 'application/x-protobuf' });
        res.end();
      });
      return;
    }
    if (req.url && SENTRY_ENVELOPE_PATH.test(req.url)) {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        printSentryEnvelope(Buffer.concat(chunks), out);
        // Sentry SDKs accept 200 with an empty/minimal JSON body. They also
        // parse `X-Sentry-Rate-Limits` if present — we omit it so no client
        // backs off.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port, opts.host, () => resolve());
  });

  const addr = server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : opts.port;
  const url = `http://${opts.host}:${actualPort}`;
  // The DSN key portion is just a routing string; Sentry SDKs require it to be
  // present but our receiver ignores it. Project ID "1" is conventional for
  // dev/test installations.
  const sentryDsn = `http://dev@${opts.host}:${actualPort}/1`;
  const upper = envPrefix(opts.cliName);

  out.write(`\nph-telemetry-dev — local receiver listening on ${url}\n\n`);
  out.write('Point your CLI at this receiver by exporting:\n');
  out.write(`  ${upper}_OTEL_EXPORTER_OTLP_ENDPOINT=${url}\n`);
  out.write(`  ${upper}_SENTRY_DSN=${sentryDsn}\n\n`);
  out.write('Optional (for readable OTLP trace payloads):\n');
  out.write('  OTEL_EXPORTER_OTLP_PROTOCOL=http/json\n\n');

  return {
    url,
    port: actualPort,
    sentryDsn,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())),
  };
}
