#!/usr/bin/env node
/**
 * Minimal HTTP server that accepts GraphQL announceClintEndpoints mutations.
 *
 * Startup:
 *   Prints "Registry listening on http://localhost:{port}" on stdout
 *   so callers can detect readiness and discover the assigned port.
 *
 * Endpoints:
 *   POST /              — accepts GraphQL mutation JSON body, validates shape,
 *                         stores input variables, returns success response
 *   GET  /announcements — returns all stored mutation inputs as a JSON array
 *
 * Env vars:
 *   PORT — listen port (default 0 = OS-assigned)
 */
import http from 'node:http';

const port = parseInt(process.env.PORT || '0', 10);
const announcements = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
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
        const count = input.endpoints?.length ?? 0;
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

server.listen(port, () => {
  const addr = server.address();
  const assignedPort = typeof addr === 'object' ? addr.port : port;
  console.log(`Registry listening on http://localhost:${assignedPort}`);
});
