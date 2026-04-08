#!/usr/bin/env node
/**
 * Test fixture that simulates Powerhouse Vetra startup output.
 *
 * Prints the three readiness patterns that Vetra produces:
 *   1. "Local: http://localhost:PORT"       (Connect Studio)
 *   2. "Drive URL: http://..."               (Drive URL)
 *   3. "MCP server available at http://..."  (MCP server)
 *
 * Modes (TEST_SERVICE_MODE):
 *   vetra          — prints all three patterns with staggered timing (default)
 *   partial        — prints only connect-port and drive-url (never MCP)
 *   single         — prints only "Server listening on http://localhost:PORT"
 *
 * Env vars:
 *   PORT                — port number (default: 3000)
 *   TEST_SERVICE_MODE   — mode (default: vetra)
 */

const port = process.env.PORT || '3000';
const mode = process.env.TEST_SERVICE_MODE || 'vetra';

switch (mode) {
  case 'vetra':
    console.log('Starting Vetra development server...');
    setTimeout(() => console.log(`  Local:   http://localhost:${port}`), 50);
    setTimeout(() => console.log(`  Drive URL: http://localhost:${port}/drives/main`), 100);
    setTimeout(() => console.log(`  MCP server available at http://localhost:${port}/mcp`), 150);
    setInterval(() => {}, 60_000);
    break;

  case 'partial':
    console.log('Starting Vetra development server...');
    setTimeout(() => console.log(`  Local:   http://localhost:${port}`), 50);
    setTimeout(() => console.log(`  Drive URL: http://localhost:${port}/drives/main`), 100);
    // MCP pattern never printed
    setInterval(() => {}, 60_000);
    break;

  case 'single':
    console.log(`Server listening on http://localhost:${port}`);
    setInterval(() => {}, 60_000);
    break;

  default:
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
}
