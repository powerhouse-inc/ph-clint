import path from 'node:path';
import { defineCli, defineService } from 'ph-clint';
import { CLI_NAME, CLI_VERSION, PROJECT_ROOT, configSchema, type Config } from './config.js';
import { initProject } from './commands/init-project.js';
import { createAgent } from './agents/agent-rupert.js';

// ── Service definitions ──────────────────────────────────────────

const vetra = defineService<Config>({
  id: 'vetra',
  label: 'Vetra Dev Server',
  command: 'ph vetra --watch',
  env: (config) => ({
    PORT: String(config.switchboardPort),
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    NODE_OPTIONS: '--max-old-space-size=4096',
  }),
  readiness: {
    patterns: [
      {
        name: 'connect-port',
        pattern: /Local:\s*http:\/\/localhost:(\d+)/,
        captures: { 'connect-studio': 1 },
      },
      {
        name: 'drive-url',
        pattern: /Drive URL:\s*(https?:\/\/[^\s]+)/,
        captures: { 'drive-url': 1 },
      },
      {
        name: 'mcp-server',
        pattern: /MCP server available at (https?:\/\/[^\s]+)/,
        captures: { 'mcp-server': 1 },
      },
    ],
    timeout: 90_000,
  },
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
  restart: { enabled: true, maxRetries: 3, delay: 5_000 },
});

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: 'Vetra Mastra — Reactor development with AI agent',
  configSchema,
  commands: [initProject],
  services: [vetra],
  skillSources: [
    path.join(PROJECT_ROOT, 'skills'),
    path.join(PROJECT_ROOT, 'dist', 'skills'),
  ],

  events: {
    'service:pattern-matched': (event) => {
      console.log(`  \u2713 ${event.name} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      const ep = event.endpoints ?? {};
      console.log(
        `\u2713 ${event.label} is ready` +
          (ep['connect-studio'] ? ` \u2014 Connect Studio on port ${ep['connect-studio']}` : ''),
      );
    },
    'service:failed': (event) => {
      console.log(`\u2717 ${event.label} failed: ${event.error}`);
    },
    'service:restarting': (event) => {
      console.log(`\u21BB ${event.label} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
    'service:stopped': (event) => {
      console.log(`\u25A0 ${event.label} stopped`);
    },
  },

  interactive: {
    welcome: ({ config, workdir }) => {
      const mode = config.apiKey
        ? `Mastra + ${config.model}`
        : 'demo mode \u2014 set VETRA_MASTRA_API_KEY for real LLM responses';
      const G = '\x1b[32m';
      const W = '\x1b[97m';
      const D = '\x1b[2m';
      const R = '\x1b[0m';
      return [
        '',
        `  ${G}\u2556HHHHHHH  \u2565HHHHHH\u2556`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592h'\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Vetra Mastra`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592  \u2559\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Reactor + AI Agent`,
        `  ${G}\u2560\u2592\u2592\u2592\u2592\u255C"     \u2559\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G},\u2556\u2556,         ,,\u2556\u2556,${R}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2565    \u2565\u2592\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592  \u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592hj\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${R}`,
        '',
        `  ${D}Agent:${R} ${mode}`,
        `  ${D}Workdir:${R} ${workdir}`,
        `  ${D}/init-project${R} new project  ${D}/vetra-ps${R} services`,
        '',
      ].join('\n');
    },
  },
});

cli.setAgentLoader(createAgent);
