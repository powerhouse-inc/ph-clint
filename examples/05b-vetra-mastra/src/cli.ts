import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineCli, defineService, checkWorkdir, checkCommand, checkPort } from 'ph-clint';
import { CLI_NAME, CLI_VERSION, PROJECT_ROOT, configSchema, secretsSchema, type Config } from './config.js';
import { reactorPackageInit } from './commands/reactor-package-init.js';
import { reactorPackagesList } from './commands/reactor-packages-list.js';
import { fusionProjectInit } from './commands/fusion-project-init.js';
import { fusionProjectsList } from './commands/fusion-projects-list.js';
import { createAgent } from './agents/agent-rupert.js';
// MCP client management is handled automatically by the Mastra integration

// ── Service definitions ──────────────────────────────────────────

const vetraParams = z.object({
  watch: z.boolean().default(true).describe('Enable file watching'),
  connectPort: z.coerce.number().optional().describe('Connect Studio port (overrides config)'),
  switchboardPort: z.coerce.number().optional().describe('Vetra Switchboard port (overrides config)'),
});

const vetra = defineService<Config>({
  id: 'vetra',
  label: 'Vetra Dev Server',
  command: (params) => {
    const parts = ['ph', 'vetra'];
    if (params?.watch !== false) parts.push('--watch');
    if (params?.connectPort) parts.push('--connect-port', String(params.connectPort));
    if (params?.switchboardPort) parts.push('--switchboard-port', String(params.switchboardPort));
    return parts.join(' ');
  },
  paramsSchema: vetraParams,
  env: (config, params) => ({
    // PORT workaround: https://github.com/powerhouse-inc/powerhouse/commit/9830c16b
    PORT: String(params?.switchboardPort ?? config.switchboardPort),
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
        captures: { 'mcp-server': { group: 1, type: 'api-mcp' } },
      },
    ],
    timeout: 90_000,
  },
  preflight: [
    checkWorkdir(
      (cwd) => fs.existsSync(path.join(cwd, 'powerhouse.config.ts'))
             || fs.existsSync(path.join(cwd, 'powerhouse.config.json')),
      'Not a Reactor Package project',
      'Run vetra-start --workdir <project>, or create one with /reactor-package-init',
    ),
    checkCommand('ph', {
      hint: 'Install the Powerhouse CLI: npm install -g ph-cli',
    }),
    checkPort((ctx) => (ctx.params?.connectPort as number) ?? 3000, 'Connect Studio'),
    checkPort((ctx) => (ctx.params?.switchboardPort as number) ?? 4001, 'Switchboard'),
  ],
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
  restart: { enabled: true, maxRetries: 3, delay: 5_000 },
});

const fusionProjectParams = z.object({
  fusionPort: z.coerce.number().default(8000).describe('Next.js dev server port'),
  switchboardUrl: z
    .string()
    .default('http://localhost:4001/graphql')
    .describe('Switchboard backend URL'),
});

const fusionProject = defineService<Config>({
  id: 'fusion-project',
  label: 'Fusion Dev Server',
  command: (params) => `pnpm dev -p ${params?.fusionPort ?? 8000}`,
  paramsSchema: fusionProjectParams,
  env: (_config, params) => ({
    NODE_ENV: 'development',
    PH_SWITCHBOARD_URL: String(params?.switchboardUrl ?? 'http://localhost:4001/graphql'),
  }),
  preflight: [
    checkWorkdir(
      (cwd) => fs.existsSync(path.join(cwd, 'package.json')),
      'Not a Node.js project',
      'Run fusion-project-start --workdir <project>, or create one with /fusion-project-init',
    ),
    checkPort((ctx) => (ctx.params?.fusionPort as number) ?? 8000, 'Fusion Dev Server'),
  ],
  readiness: {
    patterns: [
      {
        name: 'fusion-port',
        pattern: /Local:\s*http:\/\/localhost:(\d+)/,
        captures: { 'fusion-url': 1 },
      },
    ],
    timeout: 60_000,
  },
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
});

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: 'Vetra Mastra — Reactor development with AI agent',
  configSchema,
  secretsSchema,
  commands: [reactorPackageInit, reactorPackagesList, fusionProjectInit, fusionProjectsList],
  services: [vetra, fusionProject],
  skills: {
    sources: [
      path.join(PROJECT_ROOT, 'skills'),
      path.join(PROJECT_ROOT, 'dist', 'skills'),
    ],
    agents: {
      'rupert-dev-agent': [
        'document-modeling', 'document-editor-creation',
        'fusion-development', 'fusion-project-management',
        'handle-stakeholder-message', 'playwright-cli',
        'reactor-package-project-management',
      ],
    },
  },

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
      if (event.id === 'vetra' && /exited before becoming ready/.test(event.error ?? '')) {
        console.log('  Hint: Is the working directory a Reactor package project? Try: vetra-start --workdir <project-name>');
      }
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
        `  ${D}/reactor-package-init${R} new project   ${D}/reactor-packages-list${R} browse`,
        `  ${D}/fusion-project-init${R} new fusion    ${D}/fusion-projects-list${R} browse`,
        `  ${D}/vetra-start${R} dev server  ${D}/fusion-project-start${R} fusion server`,
        '',
        `  Type a message to talk to the agent`,
        `  ${D}Try:${R} "Create a document model for invoices"`,
        '',
      ].join('\n');
    },
  },
});

cli.setAgentLoader(createAgent);
