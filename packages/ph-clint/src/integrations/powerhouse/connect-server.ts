// Static file server for pre-built Connect SPA assets; applies a one-time
// dynamic-base token substitution to HTML docs (see substituteDynamicBase).

import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

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

export interface ConnectServerOptions {
  /** Directory containing the built SPA (must hold an index.html). */
  dir: string;
  // Deploy base path the SPA is mounted under (proxy mount, not a per-route
  // prefix). Normalized to leading+trailing-slash form ('/' | '/x/'). Default '/'.
  base?: string;
}

/** Normalize a deploy base to leading+trailing-slash form ('/' | '/x/'). */
function normalizeBase(base: string | undefined): string {
  const trimmed = base?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

const DYNAMIC_BASE_TOKEN = '/__PH_DYNAMIC_BASE__/';

// Replace the dynamic-base token with the deploy base and set
// `globalThis.__PH_DYNAMIC_BASE__` before the entry bundle runs; no token = unchanged.
function substituteDynamicBase(html: string, base: string): string {
  if (!html.includes(DYNAMIC_BASE_TOKEN)) return html;
  const replaced = html.split(DYNAMIC_BASE_TOKEN).join(base);
  if (/globalThis\.__PH_DYNAMIC_BASE__\s*=/.test(replaced)) return replaced;
  const inject = `<script>globalThis.__PH_DYNAMIC_BASE__=${JSON.stringify(base)};</script>`;
  const headOpen = replaced.match(/<head[^>]*>/i);
  if (headOpen?.index !== undefined) {
    const at = headOpen.index + headOpen[0].length;
    return replaced.slice(0, at) + inject + replaced.slice(at);
  }
  return inject + replaced;
}

// Create the Connect static server (not yet listening). Throws when `dir`
// holds no index.html.
export function createConnectServer(options: ConnectServerOptions): Server {
  const { dir } = options;
  const base = normalizeBase(options.base);
  const indexPath = join(dir, 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error(`index.html not found in ${dir}`);
  }

  // HTML docs are transformed (dynamic-base substitution) once per file path
  // and cached; the assets dir is a static build.
  const htmlCache = new Map<string, string>();

  async function loadHtmlDocument(path: string): Promise<string> {
    let doc = htmlCache.get(path);
    if (doc === undefined) {
      const raw = await readFile(path, 'utf-8');
      doc = substituteDynamicBase(raw, base);
      htmlCache.set(path, doc);
    }
    return doc;
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    const filePath = join(dir, url.pathname);
    const ext = extname(filePath);

    // A missing file under /assets/ is a 404, not the SPA shell — serving
    // HTML as a .js/.css masks broken asset references.
    if (url.pathname.startsWith('/assets/') && !existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    if (ext && ext !== '.html' && existsSync(filePath)) {
      try {
        const content = await readFile(filePath);
        // Vite content-hashes filenames under /assets/, so they're immutable;
        // other top-level static files (e.g. /icon.ico) aren't, cache modestly.
        const cacheControl = url.pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600';
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
          'Cache-Control': cacheControl,
        });
        res.end(content);
        return;
      } catch {
        // Fall through to SPA fallback
      }
    }

    try {
      const target = ext === '.html' && existsSync(filePath) ? filePath : indexPath;
      const body = await loadHtmlDocument(target);
      // SPA shell carries the per-deployment dynamic base, must revalidate.
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
}

function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
}

if (isMain()) {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string' },
      port: { type: 'string' },
      base: { type: 'string' },
    },
  });

  const dir = values.dir;
  const port = parseInt(values.port ?? '3000', 10);

  if (!dir) {
    console.error('Usage: node connect-server.js --dir <path> --port <port> [--base </deploy/base/>]');
    process.exit(1);
  }

  let server: Server;
  try {
    server = createConnectServer({ dir, base: values.base });
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  server.listen(port, () => {
    console.log(`  Local: http://localhost:${port}/`);
  });
}
