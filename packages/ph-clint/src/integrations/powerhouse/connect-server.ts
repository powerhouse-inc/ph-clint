/**
 * Standalone static file server for pre-built Connect SPA assets.
 *
 * Usage: node connect-server.js --dir <path> --port <port>
 *
 * Exposes a `/__reload` channel so external publishers (e.g. ph-clint's
 * publish-reload trigger) can force loaded SPA clients to refresh.
 *
 *   GET  /__reload   — SSE stream. Clients subscribe and react to `reload`
 *                      events by running `location.reload()`.
 *   POST /__reload   — broadcast a `reload` event to every connected SSE
 *                      client. Returns 204.
 *
 * Every served HTML response is rewritten to include a small `<script>` that
 * subscribes to the SSE stream — so any browser tab open to the SPA picks
 * up the reload signal automatically. The script is appended just before
 * `</body>`; if `</body>` is missing it's prepended to `<html`.
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

const RELOAD_SCRIPT = `\n<script>(function(){try{var e=new EventSource('/__reload');e.addEventListener('reload',function(){location.reload();});}catch(e){}})();</script>\n`;

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
  const payload = `event: reload\ndata: {}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      // Drop broken clients; their `close` handler will clean up.
    }
  }
  return sseClients.size;
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
