#!/usr/bin/env node
/**
 * Test fixture that simulates Reactor Projects (Vetra) startup output.
 *
 * Prints the four readiness patterns that Vetra produces:
 *   1. "Local: http://localhost:PORT"           (Vetra Studio)
 *   2. "Drive URL: http://..."                  (Drive URL)
 *   3. "Switchboard: http://..."                (Switchboard GraphQL)
 *   4. "MCP server available at http://..."     (MCP server)
 *
 * Modes (TEST_SERVICE_MODE):
 *   reactor-project — prints all four patterns with staggered timing (default)
 *   partial          — prints only vetra-studio and vetra-drive-url (never Switchboard/MCP)
 *   single           — prints only "Server listening on http://localhost:PORT"
 *
 * Env vars:
 *   PORT                — port number (default: 3000)
 *   TEST_SERVICE_MODE   — mode (default: reactor-project)
 */

const port = process.env.PORT || '3000';
const mode = process.env.TEST_SERVICE_MODE || 'reactor-project';

switch (mode) {
  case 'reactor-project':
    console.log('Starting Reactor Projects dev server...');
    setTimeout(() => console.log(`  Local:   http://localhost:${port}`), 50);
    setTimeout(() => console.log(`  Drive URL: http://localhost:${port}/drives/main`), 100);
    setTimeout(() => console.log(`  Switchboard: http://localhost:${port}/graphql`), 150);
    setTimeout(() => console.log(`  MCP server available at http://localhost:${port}/mcp`), 200);
    setInterval(() => {}, 60_000);
    break;

  case 'partial':
    console.log('Starting Reactor Projects dev server...');
    setTimeout(() => console.log(`  Local:   http://localhost:${port}`), 50);
    setTimeout(() => console.log(`  Drive URL: http://localhost:${port}/drives/main`), 100);
    // Switchboard and MCP patterns never printed
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
