import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineService, checkWorkdir, checkCommand, checkPort } from 'ph-clint';
import type { Config } from '../config.js';

const vetraParams = z.object({
  watch: z.boolean().default(true).describe('Enable file watching'),
  connectPort: z.coerce.number().optional().describe('Connect Studio port (overrides config)'),
  switchboardPort: z.coerce.number().optional().describe('Vetra Switchboard port (overrides config)'),
});

export const vetra = defineService<Config>({
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
  projectScanner: {
    isProjectFolder: (p) => fs.existsSync(path.join(p, 'powerhouse.config.json'))
                         || fs.existsSync(path.join(p, 'powerhouse.config.ts')),
  },
});
