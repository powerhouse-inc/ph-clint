#!/usr/bin/env node
/**
 * ph-telemetry-dev — local OTLP HTTP receiver for dev work.
 *
 * Inspired by the deleted service-announcer pattern: prints the endpoint to
 * stdout so the dev knows what env var to set in another terminal before
 * running their CLI.
 *
 * Receives OTel OTLP HTTP at /v1/traces and /v1/metrics. JSON payloads
 * (OTEL_EXPORTER_OTLP_PROTOCOL=http/json on the sender side) are
 * pretty-printed; protobuf payloads show byte length only.
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
  close: () => Promise<void>;
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
  const upper = envPrefix(opts.cliName);

  out.write(`\nph-telemetry-dev — local OTLP receiver listening on ${url}\n\n`);
  out.write('Point your CLI at this receiver by exporting:\n');
  out.write(`  ${upper}_OTEL_EXPORTER_OTLP_ENDPOINT=${url}\n\n`);
  out.write('Optional (for readable trace payloads):\n');
  out.write('  OTEL_EXPORTER_OTLP_PROTOCOL=http/json\n\n');

  return {
    url,
    port: actualPort,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())),
  };
}

/* istanbul ignore next -- entry-point bootstrap; exercised by manual `pnpm telemetry:dev` */
async function main() {
  const args = parseCliArgs(process.argv);
  const handle = await startDevServer(args);
  process.once('SIGINT', () => { void handle.close().then(() => process.exit(0)); });
  process.once('SIGTERM', () => { void handle.close().then(() => process.exit(0)); });
}

// Only run main when invoked as a script (not when imported by tests).
/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`ph-telemetry-dev: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
