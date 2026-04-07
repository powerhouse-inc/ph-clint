import { defineCli, defineCommand, defineService } from 'ph-clint';
import type { InferConfig } from 'ph-clint';
import { z } from 'zod';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ── Config ───────────────────────────────────────────────────────

const configSchema = z.object({
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  startupTimeout: z.number().default(90_000).describe('Service startup timeout (ms)'),
  phVersion: z.string().default('staging').describe('Powerhouse version (staging, dev, latest)'),
});

type Config = InferConfig<typeof configSchema>;

// ── Service definitions ──────────────────────────────────────────

/**
 * Powerhouse Vetra development server.
 * Runs `ph vetra --watch` and detects readiness via three stdout patterns:
 *   1. Connect Studio port ("Local: http://localhost:PORT")
 *   2. Drive URL ("Drive URL: http://...")
 *   3. MCP server ("MCP server available at http://...")
 * The service is ready only when all three have matched.
 */
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

// ── Commands ─────────────────────────────────────────────────────

/**
 * Initialize a new Powerhouse Reactor project.
 * Runs `ph init <name> --<version> --pnpm` in the workdir.
 * Idempotent: succeeds if the project already has valid config files.
 */
const initInput = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z0-9-_]+$/)
    .describe('Project name (alphanumeric, hyphens, underscores)'),
  version: z
    .enum(['staging', 'dev', 'latest'])
    .optional()
    .describe('Powerhouse version (overrides config)'),
});

const init = defineCommand<typeof initInput, { text: string }, Config>({
  id: 'init',
  description: 'Initialize a new Reactor project',
  inputSchema: initInput,
  execute: async ({ name, version }, { workdir, config }) => {
    const projectPath = path.join(workdir, name);
    const phVersion = version ?? config.phVersion ?? 'staging';

    // Idempotent: if project already has valid config, succeed
    if (fs.existsSync(projectPath)) {
      const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
      const hasConfig = fs.existsSync(path.join(projectPath, 'powerhouse.config.json'));
      if (hasPackageJson && hasConfig) {
        return { text: `Project ${name} already exists at ${projectPath}` };
      }
      if (fs.existsSync(projectPath) && !hasPackageJson) {
        return { text: `Error: ${projectPath} exists but is missing config files` };
      }
    }

    // Run ph init
    try {
      execFileSync('ph', ['init', name, `--${phVersion}`, '--pnpm'], {
        cwd: workdir,
        stdio: 'pipe',
        env: { ...process.env, CI: 'true' },
        timeout: 300_000,
      });
    } catch (err: any) {
      const stderr = err.stderr?.toString() || err.message;
      return { text: `Failed to initialize project: ${stderr}` };
    }

    // Verify
    const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
    const hasConfig = fs.existsSync(path.join(projectPath, 'powerhouse.config.json'));
    if (hasPackageJson && hasConfig) {
      return { text: `Project ${name} initialized at ${projectPath}` };
    }
    return { text: `Project created but missing expected config files at ${projectPath}` };
  },
});

const up = defineCommand({
  id: 'up',
  description: 'Start Vetra dev server',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    await services!.start('vetra');
    const status = services!.list().find((s) => s.id === 'vetra')!;
    const parts = [`Vetra is ready`];
    if (status.endpoints?.['connect-studio']) {
      parts.push(`Connect Studio: http://localhost:${status.endpoints['connect-studio']}`);
    }
    if (status.endpoints?.['drive-url']) {
      parts.push(`Drive URL: ${status.endpoints['drive-url']}`);
    }
    if (status.endpoints?.['mcp-server']) {
      parts.push(`MCP server: ${status.endpoints['mcp-server']}`);
    }
    return { text: parts.join('\n') };
  },
});

const down = defineCommand({
  id: 'down',
  description: 'Stop Vetra dev server',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    await services!.stop('vetra');
    return { text: 'Vetra stopped' };
  },
});

const ps = defineCommand({
  id: 'ps',
  description: 'Show service status',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    const all = services!.list();
    return {
      text: all
        .map((s) => {
          const icon = s.status === 'ready' ? '●' : '○';
          const ep = s.endpoints ?? {};
          const info: string[] = [];
          if (ep['connect-studio']) info.push(`:${ep['connect-studio']}`);
          if (ep['drive-url']) info.push(ep['drive-url']);
          if (ep['mcp-server']) info.push(`MCP ${ep['mcp-server']}`);
          return `${icon} ${s.label} [${s.status}]` + (info.length ? ` ${info.join(' | ')}` : '');
        })
        .join('\n'),
      data: all,
    };
  },
});

const logs = defineCommand({
  id: 'logs',
  description: 'Show recent logs',
  inputSchema: z.object({
    lines: z.number().default(50).describe('Number of lines'),
  }),
  execute: async ({ lines }, { services }) => {
    return { text: services!.logs('vetra', lines) };
  },
});

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: 'svc',
  version: '1.0.0',
  description: 'Reactor Service Manager — manage Powerhouse Vetra dev server',
  configSchema,
  commands: [init, up, down, ps, logs],
  services: [vetra],
  events: {
    'service:pattern-matched': (event) => {
      console.log(`  ✓ ${event.name} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      const ep = event.endpoints ?? {};
      console.log(
        `✓ ${event.label} is ready` +
          (ep['connect-studio'] ? ` — Connect Studio on port ${ep['connect-studio']}` : ''),
      );
    },
    'service:failed': (event) => {
      console.log(`✗ ${event.label} failed: ${event.error}`);
    },
    'service:restarting': (event) => {
      console.log(`↻ ${event.label} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
    'service:stopped': (event) => {
      console.log(`■ ${event.label} stopped`);
    },
  },
  interactive: {
    welcome: ({ workdir }) => {
      const G = '\x1b[32m';
      const W = '\x1b[97m';
      const D = '\x1b[2m';
      const R = '\x1b[0m';
      return [
        '',
        `  ${G}╓HHHHHHH  ╥HHHHHH╖`,
        `  ${G}▒▒▒▒▒▒▒▒h'▒▒▒▒▒▒▒▒${W}    ▄▄▄     ,▄▄⌐▄▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄▄,▄▄▄▄▄▄▄,       ▄▄▄,`,
        `  ${G}▒▒▒▒▒▒▒▒  ╙▒▒▒▒▒▒▒${W}    ▀██▄    ███ ███████¬█████████▌▐█████████⌐    ▐████`,
        `  ${G}╠▒▒▒▒╜"     ╙▒▒▒▒▒${W}     ▀██⌐  ███  ███▄▄▄     ▐██r   ▐██┐   ▄██▌   )██▀███`,
        `  ${G},╓╓,         ,,╓╓,${W}      ███ ▄██═  █████┘     ▐██r   ▐████████▀    ███▄▄███`,
        `  ${G}▒▒▒▒▒▒╥    ╥▒▒▒▒▒▒${W}       █████▀   ███        ▐██r   ▐██∩ └███,   █████─└██▌`,
        `  ${G}▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒${W}       "███▀    ███████▌   ▐██r   ▐██∩   ▀██▄ ███"    ▐██▌`,
        `  ${G}▒▒▒▒▒▒▒▒hj▒▒▒▒▒▒▒▒${R}`,
        '',
        `  ${D}Reactor Service Manager${R}  ${D}workdir:${R} ${workdir}`,
        `  ${D}/up${R} start  ${D}/down${R} stop  ${D}/ps${R} status  ${D}/logs${R} output`,
        '',
      ].join('\n');
    },
  },
});

// Run when executed directly (not when imported by tests)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('/cli.js') ||
  process.argv[1].endsWith('/cli.ts')
);
if (isDirectRun) {
  cli.run(process.argv);
}
