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
  documentId?: string;
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
    // Strip scope and -cli suffix (e.g. @acme/foo-cli → foo), then convert to UPPER_SNAKE
    const bare = name.replace(/^@[^/]+\//, '').replace(/-cli$/, '');
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
  documentId?: string,
): string {
  const announceUrl = documentId ? `${url}?documentId=${documentId}` : url;
  const lines: string[] = [
    `${type} registry listening on ${url}`,
    '',
    'Add to your environment:',
    `  ${envPrefix}_SERVICE_ANNOUNCE_URL=${announceUrl}`,
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
    console.log(`${req.method} ${req.url}`);

    // Auth middleware
    if (options.withAuth && req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${token}`) {
        console.log('  AUTH REJECTED (invalid or missing Bearer token)');
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
          console.log('  Announcement received:', JSON.stringify(payload, null, 2));
          announcements.push(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch {
          console.log('  ERROR: invalid JSON body');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"invalid json"}');
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/announcements') {
      console.log(`  Returning ${announcements.length} announcement(s)`);
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
  const documentId = crypto.randomUUID();

  const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Auth middleware
    if (options.withAuth && req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth || auth !== `Bearer ${token}`) {
        console.log('  AUTH REJECTED (invalid or missing Bearer token)');
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
            console.log('  ERROR: missing query or variables.input');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end('{"errors":[{"message":"missing query or variables.input"}]}');
            return;
          }
          const input = parsed.variables.input;
          console.log('  Announcement received:', JSON.stringify(input, null, 2));
          announcements.push(input);
          const count = (input.endpoints as unknown[])?.length ?? 0;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: {
              announceClintEndpoints: { ok: true, count },
            },
          }));
        } catch {
          console.log('  ERROR: invalid JSON body');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"invalid json"}');
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/announcements') {
      console.log(`  Returning ${announcements.length} announcement(s)`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(announcements));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return { server, announcements, token, documentId };
}
