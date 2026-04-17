import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { checkWorkdir, checkPort } from 'ph-clint';
import { defineService } from '../framework.js';

const fusionProjectParams = z.object({
  fusionPort: z.coerce.number().default(8000).describe('Next.js dev server port'),
  switchboardUrl: z
    .string()
    .default('http://localhost:4001/graphql')
    .describe('Switchboard backend URL'),
});

export const fusionProject = defineService({
  id: 'fusion-project',
  name: 'Fusion Dev Server',
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
  projectScanner: {
    isProjectFolder: (p) => fs.existsSync(path.join(p, 'next.config.ts')),
  },
});
