/**
 * Standalone static file server for pre-built Connect SPA assets.
 *
 * Usage: node connect-server.js --dir <path> --port <port>
 *
 * Exposes a `/__reload` channel so external publishers (e.g. ph-clint's
 * publish-reload trigger) can force loaded SPA clients to refresh, and
 * a `POST /__reload/error` endpoint so browser tabs can report module-
 * load failures back to the server for downstream observers.
 *
 *   GET  /__reload         — SSE stream. Emits two event types:
 *                              `reload` → clients run location.reload().
 *                              `package-error` → carries a JSON
 *                                {message, filename, stack?} payload.
 *   POST /__reload         — broadcast a `reload` event. Returns 204
 *                            with `X-Reload-Clients` count header.
 *   POST /__reload/error   — accept a browser-side error report; body
 *                            is JSON {message, filename, stack?}.
 *                            Broadcasts as a `package-error` SSE event.
 *                            Returns 204.
 *
 * Every served HTML response is rewritten to include a small `<script>` that:
 *   - subscribes to /__reload and runs location.reload() on `reload`.
 *   - hooks `window.error` and `unhandledrejection`, filters to CDN-loaded
 *     module URLs (those matching `/-/cdn/`), and POSTs the error to
 *     /__reload/error so the trigger (and any other listener) sees it.
 *
 * NOT exported from the barrel — compiled by tsc to
 * dist/integrations/powerhouse/connect-server.js and invoked as a child process.
 */

import { createServer, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    port: { type: 'string' },
  },
});

const dir = values.dir;
const port = parseInt(values.port ?? '3000', 10);

if (!dir) {
  console.error('Usage: node connect-server.js --dir <path> --port <port>');
  process.exit(1);
}

const indexPath = join(dir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`index.html not found in ${dir}`);
  process.exit(1);
}

const RELOAD_SCRIPT = `
<script>(function(){
  try {
    var es = new EventSource('/__reload');
    es.addEventListener('reload', function () { location.reload(); });
  } catch (_) {}
  function report(payload) {
    try {
      fetch('/__reload/error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (_) {}
  }
  function isCdnUrl(u) { return typeof u === 'string' && u.indexOf('/-/cdn/') !== -1; }
  window.addEventListener('error', function (e) {
    if (!isCdnUrl(e.filename)) return;
    report({
      message: (e.message || String(e.error || 'error')),
      filename: e.filename,
      stack: e.error && e.error.stack || undefined,
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    var stack = e.reason && e.reason.stack;
    var match = typeof stack === 'string' ? stack.match(/https?:\\/\\/[^\\s)]+\\/-\\/cdn\\/[^\\s)]+/) : null;
    if (!match) return;
    report({
      message: (e.reason && e.reason.message) || String(e.reason || 'rejection'),
      filename: match[0],
      stack: stack,
    });
  });
})();</script>
`;

function injectReloadScript(html: string): string {
  const lower = html.toLowerCase();
  const idx = lower.lastIndexOf('</body>');
  if (idx !== -1) {
    return html.slice(0, idx) + RELOAD_SCRIPT + html.slice(idx);
  }
  // Fallback for malformed HTML: just append.
  return html + RELOAD_SCRIPT;
}

const sseClients = new Set<ServerResponse>();

function broadcastReload(): number {
  return broadcast('reload', '{}');
}

function broadcast(eventName: string, data: string): number {
  const payload = `event: ${eventName}\ndata: ${data}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      // Drop broken clients; their `close` handler will clean up.
    }
  }
  return sseClients.size;
}

async function readJsonBody(
  req: import('node:http').IncomingMessage,
  maxBytes = 64 * 1024,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  if (url.pathname === '/__reload') {
    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`event: connected\ndata: {}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }
    if (req.method === 'POST') {
      const count = broadcastReload();
      res.writeHead(204, { 'X-Reload-Clients': String(count) });
      res.end();
      return;
    }
    res.writeHead(405);
    res.end();
    return;
  }

  if (url.pathname === '/__reload/error') {
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const data = JSON.stringify(body ?? {});
    broadcast('package-error', data);
    res.writeHead(204);
    res.end();
    return;
  }

  const filePath = join(dir, url.pathname);
  const ext = extname(filePath);

  if (ext && ext !== '.html' && existsSync(filePath)) {
    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
      res.end(content);
      return;
    } catch {
      // Fall through to SPA fallback
    }
  }

  try {
    const target = ext === '.html' && existsSync(filePath) ? filePath : indexPath;
    const content = await readFile(target, 'utf-8');
    const body = injectReloadScript(content);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`  Local: http://localhost:${port}/`);
});
