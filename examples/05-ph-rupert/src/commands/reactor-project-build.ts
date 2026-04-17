import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface BuildResult {
  success: boolean;
  exitCode: number;
}

/**
 * Run `ph build` in the given project directory.
 * Streams output via the `onData` callback.
 */
export async function runBuild(projectPath: string, onData?: (chunk: string) => void): Promise<BuildResult> {
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn('ph', ['build'], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    child.stdout.on('data', (chunk: Buffer) => onData?.(chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => onData?.(chunk.toString()));

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('ph build timed out after 2 minutes'));
    }, 120_000);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(code ?? 1);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return { success: exitCode === 0, exitCode };
}

const inputSchema = z.object({
  name: z.string().optional().describe('Project directory name (relative to workdir). Only needed when the workdir is not already a Reactor package project.'),
  log: z.boolean().optional().describe('Whether to log build output to the console. Defaults to false.'),
});

export const reactorProjectBuild = defineCommand({
  id: 'reactor-project-build',
  description: 'Build a Reactor package project (runs ph build)',
  inputSchema,
  execute: async ({ name, log }, { workdir, stdout }) => {
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

    const { success, exitCode } = await runBuild(projectPath, (stdoutChunk) => {
      if (log) {
        stdout(stdoutChunk);
      }
    });

    if (!success) {
      return { text: `**Build failed** (exit code ${exitCode})` };
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
