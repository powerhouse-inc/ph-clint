import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineService, checkWorkdir, checkPort } from 'ph-clint';
import type { Config } from '../config.js';

const previewServerParams = z.object({
  directory: z.string().default('site').describe('Directory to serve'),
  port: z.coerce.number().optional().describe('Server port (overrides config)'),
});

export const previewServer = defineService<Config>({
  id: 'preview-server',
  name: 'Preview Server',
  description: 'Static file server for previewing HTML outputs',
  command: (params) => {
    const dir = params?.directory ?? 'site';
    const port = params?.port ?? 3000;
    return `npx serve ${dir} -l ${port}`;
  },
  paramsSchema: previewServerParams,
  env: () => ({}),
  readiness: {
    patterns: [
      {
        name: 'serve-url',
        pattern: /Local:\s*(http:\/\/localhost:\d+)/,
        captures: { 'preview-url': { group: 1, type: 'website' } },
      },
    ],
    timeout: 15_000,
  },
  preflight: [
    checkWorkdir(
      (cwd) => {
        // Check the serve directory (not cwd itself) for index.html
        // The directory param isn't available here, so check common locations
        return fs.existsSync(path.join(cwd, 'index.html'))
            || fs.existsSync(path.join(cwd, 'site', 'index.html'))
            || fs.existsSync(path.join(cwd, 'deck', 'index.html'))
            || fs.existsSync(path.join(cwd, 'design-system', 'preview.html'));
      },
      'No serveable HTML found',
      'Run /04-site-prototype first to generate the site, or specify --directory',
    ),
    checkPort((ctx) => (ctx.params?.port as number) ?? 3000, 'Preview Server'),
  ],
  shutdown: { signal: 'SIGTERM', timeout: 5_000 },
});
