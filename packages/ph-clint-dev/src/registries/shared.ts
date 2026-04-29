import http from 'node:http';
import crypto from 'node:crypto';
import { detectLayout } from '../project/layout.js';
import fs from 'node:fs';
import path from 'node:path';

export interface RegistryServerOptions {
  port?: number;
  withAuth?: boolean;
}

export interface RegistryServer {
  server: http.Server;
  announcements: unknown[];
  token?: string;
}

/**
 * Detect CLI name from project context. Reads the CLI package.json `name` field,
 * strips scope, and converts to UPPER_SNAKE for env var prefix.
 */
export function detectCliName(startDir: string): string {
  const layout = detectLayout(startDir);
  if (!layout) return '<CLI_NAME>';

  const pkgJsonPath = path.join(layout.cli, 'package.json');
  try {
    const raw = fs.readFileSync(pkgJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);
    const name: string = pkg.name ?? '';
    // Strip scope (e.g. @acme/foo-cli → foo-cli), then convert to UPPER_SNAKE
    const bare = name.replace(/^@[^/]+\//, '');
    return bare
      .replace(/-/g, '_')
      .toUpperCase();
  } catch {
    return '<CLI_NAME>';
  }
}

/**
 * Format the startup output block with copy-paste env vars.
 */
export function formatStartupOutput(
  type: 'json-post' | 'vetra-graphql',
  url: string,
  envPrefix: string,
  token?: string,
): string {
  const lines: string[] = [
    `${type} registry listening on ${url}`,
    '',
    'Add to your environment:',
    `  ${envPrefix}_SERVICE_ANNOUNCE_URL=${url}`,
  ];
  if (token) {
    lines.push(`  ${envPrefix}_SERVICE_ANNOUNCE_TOKEN=${token}`);
  }
  return lines.join('\n');
}

/** Generate a random bearer token. */
export function generateToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Create a JSON POST registry server.
 * POST / — stores JSON body, returns {"ok":true}
 * GET /announcements — returns stored array
 */
export function createRegistryServer(options: RegistryServerOptions): RegistryServer {
  const announcements: unknown[] = [];
  const token = options.withAuth ? generateToken() : undefined;

  const server = http.createServer((req, res) => {
    // Auth middleware
    if (options.withAuth && req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${token}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end('{"error":"unauthorized"}');
        return;
      }
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: string) => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          announcements.push(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"invalid json"}');
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/announcements') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(announcements));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return { server, announcements, token };
}

/**
 * Create a GraphQL registry server (Vetra-style).
 * POST / — validates GraphQL mutation shape, stores input, returns success
 * GET /announcements — returns stored inputs
 */
export function createGraphqlRegistryServer(options: RegistryServerOptions): RegistryServer {
  const announcements: unknown[] = [];
  const token = options.withAuth ? generateToken() : undefined;

  const server = http.createServer((req, res) => {
    // Auth middleware
    if (options.withAuth && req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${token}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end('{"error":"unauthorized"}');
        return;
      }
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: string) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (!parsed.query || !parsed.variables?.input) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end('{"errors":[{"message":"missing query or variables.input"}]}');
            return;
          }
          const input = parsed.variables.input;
          announcements.push(input);
          const count = (input.endpoints as unknown[])?.length ?? 0;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              announceClintEndpoints: { ok: true, count },
            },
          }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"invalid json"}');
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/announcements') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(announcements));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return { server, announcements, token };
}
