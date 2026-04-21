import path from 'node:path';
import { spawn } from 'node:child_process';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import { detectLayout } from '@powerhousedao/ph-clint-dev';

const inputSchema = z.object({
  dir: z.string().optional().describe('Project root directory (default: cwd)'),
  verbose: z.boolean().default(false),
});

function execInDir(dir: string, cmd: string, verbose: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, {
      cwd: dir,
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    let stderr = '';
    if (!verbose && proc.stderr) {
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd}" failed in ${dir} (exit ${code})${stderr ? `:\n${stderr}` : ''}`));
    });
    proc.on('error', (err) => reject(err));
  });
}

export const build = defineCommand({
  id: 'clint-project-build',
  description: 'Build all packages in the project',
  inputSchema,
  execute: async (input, { workdir, stdout }) => {
    const dir = path.resolve(input.dir ?? workdir);
    const layout = detectLayout(dir);

    if (layout?.type === 'split') {
      stdout(`Building app package (${layout.app})...\n`);
      await execInDir(layout.app, 'pnpm build', input.verbose);
      stdout(`Building cli package (${layout.cli})...\n`);
      await execInDir(layout.cli, 'pnpm build', input.verbose);
    } else {
      stdout(`Building project...\n`);
      await execInDir(layout?.cli ?? dir, 'pnpm build', input.verbose);
    }

    return { text: 'Build complete.' };
  },
});
