import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z0-9-_]+$/)
    .describe('Project name (alphanumeric, hyphens, underscores)'),
});

export const fusionProjectInit = defineCommand({
  id: 'fusion-project-init',
  description: 'Initialize a new Fusion project from the boilerplate',
  inputSchema,
  execute: async ({ name }, { workdir, stdout }) => {
    const projectPath = path.join(workdir, name);

    // Idempotent: if project already has valid structure, succeed
    if (fs.existsSync(projectPath)) {
      const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
      const hasNextConfig = fs.existsSync(path.join(projectPath, 'next.config.ts'));
      if (hasPackageJson && hasNextConfig) {
        return { text: `Project ${name} already exists at ${projectPath}` };
      }
      if (!hasPackageJson) {
        return { text: `Error: ${projectPath} exists but is missing expected files` };
      }
    }

    // Step 1: git clone
    const cloneCode = await runCommand(
      'git',
      ['clone', 'https://github.com/powerhouse-inc/fusion-boilerplate.git', name],
      workdir,
      stdout,
    );
    if (cloneCode !== 0) {
      return { text: `Failed to clone fusion-boilerplate (exit code ${cloneCode})` };
    }

    // Step 2: rename project in package.json
    const sedCode = await runCommand(
      'sed',
      ['-i', '-e', `s/fusion-boilerplate/${name}/g`, './package.json'],
      projectPath,
      stdout,
    );
    if (sedCode !== 0) {
      return { text: `Failed to update package.json (exit code ${sedCode})` };
    }

    // Step 3: install dependencies
    const installCode = await runCommand('pnpm', ['install'], projectPath, stdout);
    if (installCode !== 0) {
      return { text: `Failed to install dependencies (exit code ${installCode})` };
    }

    // Verify
    const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
    const hasNextConfig = fs.existsSync(path.join(projectPath, 'next.config.ts'));
    if (hasPackageJson && hasNextConfig) {
      return { text: `Fusion project ${name} initialized at ${projectPath}` };
    }
    return { text: `Project created but missing expected config files at ${projectPath}` };
  },
});

function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  stdout: (text: string) => void,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' },
    });

    child.stdout.on('data', (chunk: Buffer) => stdout(chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => stdout(chunk.toString()));

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${cmd} timed out after 5 minutes`));
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
}
