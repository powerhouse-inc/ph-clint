/**
 * Standalone static file server for pre-built Connect SPA assets.
 *
 * Usage: node connect-server.js --dir <path> --port <port> [--base </deploy/base/>]
 *
 * Exposes a `/__packages` channel so external publishers (e.g. ph-clint's
 * publish-reload trigger) can push the live package list to running SPA
 * clients, and a `POST /__packages/error` endpoint so browser tabs can
 * report module-load failures back to the server for downstream observers.
 *
 *   GET  /__packages         — SSE stream. On connect, emits a `connected`
 *                              event followed immediately by a
 *                              `packages-changed` event carrying the current
 *                              list, so a tab that opens after a publish
 *                              still sees the latest state without polling
 *                              `/ph-packages.json`. Further events:
 *                                `packages-changed` → JSON `{ packages: string[] }`
 *                                `package-error` → JSON `{ message, filename, stack? }`
 *   POST /__packages         — body JSON `{ packages: string[] }`. Replaces
 *                              the in-memory dynamic list served by
 *                              `/ph-packages.json` and broadcasts
 *                              `packages-changed`. Returns 204 with
 *                              `X-Subscribers` count header.
 *   POST /__packages/error   — accept a browser-side error report; body is
 *                              JSON {message, filename, stack?}.
 *                              Broadcasts as a `package-error` SSE event.
 *                              Returns 204.
 *   GET  /ph-packages.json   — served dynamically: reads the baked file from
 *                              `<dir>` and replaces its `packages` array with
 *                              the merged baked + dynamic list, so a fresh
 *                              page load picks up newly-published packages.
 *
 * HTML documents get two startup-time transforms, applied once per file and
 * cached:
 *   - Dynamic-base substitution: a dynamic-base Connect build bakes the
 *     literal token `/__PH_DYNAMIC_BASE__/` into its entry tags and resolves
 *     runtime asset URLs against `globalThis.__PH_DYNAMIC_BASE__`. When the
 *     document carries the token, every occurrence is replaced with the
 *     deploy base (`--base`) and a `<script>` setting the global is injected
 *     right after `<head>`. A token-free (concrete-base) document is left
 *     untouched by this step.
 *   - An error-report `<script>` that hooks `window.error` and
 *     `unhandledrejection`, filters to CDN-loaded module URLs (those matching
 *     `/-/cdn/`), and POSTs the error to /__packages/error so observers
 *     (e.g. the publish-reload trigger) see it.
 * The SPA itself is expected to open its own `EventSource('/__packages')`
 * and call `packageManager.addPackage` / `removePackage` on each
 * `packages-changed` event — full page reloads are no longer used.
 *
 * NOT exported from the barrel — compiled by tsc to
 * dist/integrations/powerhouse/connect-server.js and invoked as a child process.
 */

import { createServer, type Server, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
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
  /**
   * Deploy base path the SPA is mounted under — the proxy mount, not any
   * per-route prefix. Normalized to leading+trailing-slash form ('/' or
   * '/myagent/'). Default '/'.
   */
  base?: string;
}

/** Normalize a deploy base to leading+trailing-slash form ('/' | '/x/'). */
function normalizeBase(base: string | undefined): string {
  const trimmed = base?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

const DYNAMIC_BASE_TOKEN = '/__PH_DYNAMIC_BASE__/';

/**
 * Substitute the dynamic-base token with the deploy base and inject the
 * `globalThis.__PH_DYNAMIC_BASE__` global right after `<head>`, so it is set
 * before the entry bundle executes. A token-free (concrete-base) document is
 * returned unchanged; a document that already sets the global keeps it.
 * At the root mount the base is '/', so the token collapses to '/' (no double
 * slash) and the global is "/".
 */
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

const INJECTED_SCRIPT = `
<script>(function(){
  function report(payload) {
    try {
      fetch('/__packages/error', {
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

function injectScript(html: string): string {
  const lower = html.toLowerCase();
  const idx = lower.lastIndexOf('</body>');
  if (idx !== -1) {
    return html.slice(0, idx) + INJECTED_SCRIPT + html.slice(idx);
  }
  return html + INJECTED_SCRIPT;
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

interface PhPackagesConfig {
  packages: string[];
  registryUrl?: string | null;
  localPackage?: { name: string; version: string };
  [key: string]: unknown;
}

/**
 * Create the Connect static server (not yet listening). Throws when `dir`
 * holds no index.html.
 */
export function createConnectServer(options: ConnectServerOptions): Server {
  const { dir } = options;
  const base = normalizeBase(options.base);
  const indexPath = join(dir, 'index.html');
  const phPackagesPath = join(dir, 'ph-packages.json');

  if (!existsSync(indexPath)) {
    throw new Error(`index.html not found in ${dir}`);
  }

  function readBakedPhPackages(): PhPackagesConfig {
    try {
      const raw = readFileSync(phPackagesPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PhPackagesConfig>;
      return {
        ...parsed,
        packages: Array.isArray(parsed.packages) ? parsed.packages : [],
      };
    } catch {
      return { packages: [] };
    }
  }

  // The baked config is read once at startup and represents the always-on
  // state (packages configured at vetra-app build time, registry URL, local
  // package metadata). `dynamicPackages` is the overlay pushed by
  // `POST /__packages` for packages published after startup; it accumulates
  // without ever evicting baked entries. `GET /ph-packages.json` returns
  // `bakedConfig` with `.packages` replaced by the merged-and-deduped list,
  // so the response path has no synchronous disk I/O.
  const bakedConfig: PhPackagesConfig = readBakedPhPackages();
  const bakedPackages: string[] = bakedConfig.packages.slice();
  let dynamicPackages: string[] = [];

  function mergedPackages(): string[] {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const name of [...bakedPackages, ...dynamicPackages]) {
      if (seen.has(name)) continue;
      seen.add(name);
      merged.push(name);
    }
    return merged;
  }

  // HTML documents are transformed (dynamic-base substitution + error-report
  // inject) once per file path and cached; the assets dir is a static build.
  const htmlCache = new Map<string, string>();

  async function loadHtmlDocument(path: string): Promise<string> {
    let doc = htmlCache.get(path);
    if (doc === undefined) {
      const raw = await readFile(path, 'utf-8');
      doc = injectScript(substituteDynamicBase(raw, base));
      htmlCache.set(path, doc);
    }
    return doc;
  }

  const sseClients = new Set<ServerResponse>();

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

  function broadcastPackages(): number {
    return broadcast('packages-changed', JSON.stringify({ packages: mergedPackages() }));
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/__packages') {
      if (req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write(`event: connected\ndata: {}\n\n`);
        res.write(
          `event: packages-changed\ndata: ${JSON.stringify({ packages: mergedPackages() })}\n\n`,
        );
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
      }
      if (req.method === 'POST') {
        let body: unknown;
        try {
          body = await readJsonBody(req);
        } catch {
          res.writeHead(400);
          res.end();
          return;
        }
        if (
          !body ||
          typeof body !== 'object' ||
          !Array.isArray((body as { packages?: unknown }).packages) ||
          !(body as { packages: unknown[] }).packages.every((p) => typeof p === 'string')
        ) {
          res.writeHead(400);
          res.end('expected { packages: string[] }');
          return;
        }
        dynamicPackages = (body as { packages: string[] }).packages.slice();
        const count = broadcastPackages();
        res.writeHead(204, { 'X-Subscribers': String(count) });
        res.end();
        return;
      }
      res.writeHead(405);
      res.end();
      return;
    }

    if (url.pathname === '/__packages/error') {
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

    if (url.pathname === '/ph-packages.json') {
      if (req.method !== 'GET') {
        res.writeHead(405);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...bakedConfig, packages: mergedPackages() }));
      return;
    }

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
