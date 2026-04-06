import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { MCPServer } from '@mastra/mcp';
import { weatherTool } from './tools/weather-tool.js';

const useHttps = process.argv.includes('--https');
const HOST = process.env.MCP_HOST || '0.0.0.0';
const PORT = parseInt(process.env.MCP_PORT || '4112', 10);
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
const CERTS_DIR = path.resolve('certs');
const KEY_PATH = path.join(CERTS_DIR, 'localhost-key.pem');
const CERT_PATH = path.join(CERTS_DIR, 'localhost-cert.pem');

function ensureCerts() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) return;

  fs.mkdirSync(CERTS_DIR, { recursive: true });
  execSync(
    `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 ` +
    `-keyout ${KEY_PATH} -out ${CERT_PATH} ` +
    `-subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`,
    { stdio: 'pipe' },
  );
  console.log(`Generated self-signed certificate in certs/

To use with Claude Code, add to .claude/settings.json:

  {
    "mcpServers": {
      "agent-rupert": {
        "url": "https://localhost:${PORT}/mcp"
      }
    }
  }

Then start Claude Code with the cert trusted:

  NODE_EXTRA_CA_CERTS=./certs/localhost-cert.pem claude
`);
}

const mcpServer = new MCPServer({
  name: 'agent-rupert',
  version: '1.0.0',
  tools: { weatherTool },
});

const protocol = useHttps ? 'https' : 'http';

const requestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '', `${protocol}://localhost:${PORT}`);

  // Health check — unauthenticated
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Bearer token auth (when MCP_AUTH_TOKEN is set)
  if (AUTH_TOKEN) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }

  await mcpServer.startHTTP({
    url,
    httpPath: '/mcp',
    req,
    res,
    options: { sessionIdGenerator: () => randomUUID() },
  });
};

let server: http.Server | https.Server;

if (useHttps) {
  ensureCerts();
  server = https.createServer(
    { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) },
    requestHandler,
  );
} else {
  server = http.createServer(requestHandler);
}

server.listen(PORT, HOST, () => {
  console.log(`MCP server listening on ${protocol}://${HOST}:${PORT}/mcp`);
  if (AUTH_TOKEN) {
    console.log('Bearer token auth enabled');
  }
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);
  await mcpServer.close();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
