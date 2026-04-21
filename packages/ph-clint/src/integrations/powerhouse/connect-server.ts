/**
 * Standalone static file server for pre-built Connect SPA assets.
 *
 * Usage: node connect-server.js --dir <path> --port <port>
 *
 * NOT exported from the barrel — compiled by tsc to
 * dist/integrations/powerhouse/connect-server.js and invoked as a child process.
 */

import { createServer } from 'node:http';
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const filePath = join(dir, url.pathname);
  const ext = extname(filePath);

  // Try to serve the requested file
  if (ext && existsSync(filePath)) {
    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
      res.end(content);
      return;
    } catch {
      // Fall through to SPA fallback
    }
  }

  // SPA fallback: serve index.html for non-file routes
  try {
    const content = await readFile(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`  Local: http://localhost:${port}/`);
});
