import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { createProcessManager } from '@powerhousedao/ph-clint';
import fs from 'node:fs';
import path from 'node:path';

export interface BuildResult {
  success: boolean;
}

/**
 * Run `ph build` in the given project directory.
 * Streams output via the `onData` callback.
 */
export async function runBuild(projectPath: string, onData?: (chunk: string) => void): Promise<BuildResult> {
  const pm = createProcessManager();
  const { success } = await pm.run('ph build', {
    label: 'ph-build',
    timeout: 120_000,
    cwd: projectPath,
    env: { FORCE_COLOR: '1' },
    onOutput: onData ? (line) => onData(line + '\n') : undefined,
  });
  return { success };
}

const inputSchema = z.object({
  name: z.string().optional().describe('Project directory name (relative to workdir). Only needed when the workdir is not already a Reactor package project.'),
  log: z.boolean().optional().describe('Whether to log build output to the console. Defaults to false.'),
});

export const reactorProjectBuild = defineCommand({
  id: 'reactor-project-build',
  description: 'Build a Reactor package project (runs ph build)',
  inputSchema,
  execute: async ({ name, log }, { workdir, stdout, runProcess }) => {
    const projectPath = name ? path.join(workdir, name) : workdir;

    if (!fs.existsSync(projectPath)) {
      return {
        text: `**Error:** Project directory \`${projectPath}\` does not exist.`,
      };
    }

    if (!fs.existsSync(path.join(projectPath, 'powerhouse.config.json'))) {
      return {
        text: `**Error:** \`${projectPath}\` is not a Powerhouse project (missing powerhouse.config.json).`,
      };
    }

    const { success } = await runProcess('ph build', {
      label: 'ph-build',
      timeout: 120_000,
      cwd: projectPath,
      env: { FORCE_COLOR: '1' },
    });

    if (!success) {
      return { text: `**Build failed**` };
    }

    const hasDistDir = fs.existsSync(path.join(projectPath, 'dist'));
    if (hasDistDir) {
      return {
        text: `**Build successful** — output at \`${path.join(name || '.', 'dist')}\``,
      };
    }
    return { text: `**Build completed** (exit code 0)` };
  },
});
