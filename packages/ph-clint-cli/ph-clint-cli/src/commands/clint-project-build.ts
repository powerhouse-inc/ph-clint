import path from 'node:path';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import { detectLayout } from '@powerhousedao/ph-clint-dev';

const inputSchema = z.object({
  dir: z.string().optional().describe('Project root directory (default: cwd)'),
  verbose: z.boolean().default(false),
});

export const build = defineCommand({
  id: 'clint-project-build',
  description: 'Build all packages in the project',
  inputSchema,
  execute: async (input, { workdir, stdout, runProcess }) => {
    const dir = path.resolve(input.dir ?? workdir);
    const layout = detectLayout(dir);

    if (layout?.type === 'split') {
      stdout(`Building app package (${layout.app})...\n`);
      const appResult = await runProcess('pnpm build', { cwd: layout.app, timeout: 120_000 });
      if (!appResult.success) return { text: `App build failed.` };
      stdout(`Building cli package (${layout.cli})...\n`);
      const cliResult = await runProcess('pnpm build', { cwd: layout.cli, timeout: 120_000 });
      if (!cliResult.success) return { text: `CLI build failed.` };
    } else {
      stdout(`Building project...\n`);
      const result = await runProcess('pnpm build', { cwd: layout?.cli ?? dir, timeout: 120_000 });
      if (!result.success) return { text: `Build failed.` };
    }

    return { text: 'Build complete.' };
  },
});
