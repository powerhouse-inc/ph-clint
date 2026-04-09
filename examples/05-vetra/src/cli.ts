import { defineCli, defineCommand, defineService, checkWorkdir, checkCommand, checkPort } from 'ph-clint';
import type { InferConfig } from 'ph-clint';
import { z } from 'zod';
import { spawn } from 'node:child_process';
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
  preflight: [
    checkWorkdir(
      (cwd) => fs.existsSync(path.join(cwd, 'powerhouse.config.ts'))
             || fs.existsSync(path.join(cwd, 'powerhouse.config.json')),
      'Not a Reactor Package project',
      'Run vetra-start --workdir <project>, or create one with /init',
    ),
    checkCommand('ph', {
      hint: 'Install the Powerhouse CLI: npm install -g ph-cli',
    }),
    checkPort(3000, 'Connect Studio'),
    checkPort(4001, 'Switchboard'),
  ],
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
  execute: async ({ name, version }, { workdir, config, stdout }) => {
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

    // Run ph init with streaming output
    const exitCode = await new Promise<number>((resolve, reject) => {
      // Use `script` to allocate a PTY so the entire process tree (ph, git, npm, etc.)
      // detects a terminal and emits ANSI color codes.
      const phCmd = ['ph', 'init', name, `--${phVersion}` /*, '--pnpm' (temporarily disable due to ph > ph-cli fwd bug)*/].join(' ');
      const child = spawn('script', ['-qec', phCmd, '/dev/null'], {
        cwd: workdir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, TERM: process.env.TERM ?? 'xterm-256color' },
      });

      child.stdout.on('data', (chunk: Buffer) => stdout(chunk.toString()));
      child.stderr.on('data', (chunk: Buffer) => stdout(chunk.toString()));

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('ph init timed out after 5 minutes'));
      }, 300_000);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve(code ?? 1);
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    if (exitCode !== 0) {
      return { text: `Failed to initialize project (exit code ${exitCode})` };
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

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: 'vetra',
  version: '1.0.0',
  description: 'Reactor Service Manager — manage Powerhouse Vetra dev server',
  configSchema,
  commands: [init],
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
        `  ${D}/svc --action up${R} start  ${D}/svc --action down${R} stop  ${D}/svc${R} status  ${D}/svc --manage${R} panel`,
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
