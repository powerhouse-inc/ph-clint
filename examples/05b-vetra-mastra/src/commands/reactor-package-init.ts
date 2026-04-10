import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function getPhVersion(): string {
  try {
    const output = execFileSync('ph', ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
    });
    const match = output.match(/PH CMD version:\s*(\S+)/);
    if (match?.[1]) return match[1];
    throw new Error('Could not parse version from ph --version output');
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      throw new Error(
        'ph CLI is not installed. Install it with: pnpm install -g ph-cmd@latest',
      );
    }
    throw err;
  }
}

const inputSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z0-9-_]+$/)
    .describe('Project name (alphanumeric, hyphens, underscores)'),
  version: z
    .string()
    .refine(
      (v) =>
        ['dev', 'staging', 'latest'].includes(v) ||
        /^\d+\.\d+\.\d+/.test(v),
      'Must be dev, staging, latest, or an exact semver version (e.g. 6.0.0-dev.163)',
    )
    .optional()
    .describe(
      'Powerhouse version: release tag (dev|staging|latest) or exact semver (e.g. 6.0.0-dev.163)',
    ),
});

interface Config {
  phVersion?: string;
}

export const reactorPackageInit = defineCommand<typeof inputSchema, { text: string }, Config>({
  id: 'reactor-package-init',
  description: 'Initialize a new Reactor package project',
  inputSchema,
  execute: async ({ name, version }, { workdir, config, stdout }) => {
    const projectPath = path.join(workdir, name);
    const phVersion = version ?? config.phVersion ?? getPhVersion();

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
    const tags = ['dev', 'staging', 'latest'];
    const exitCode = await new Promise<number>((resolve, reject) => {
      const versionArgs = tags.includes(phVersion)
        ? [`--${phVersion}`]
        : ['--version', phVersion];
      const phCmd = ['ph', 'init', name, ...versionArgs, '--pnpm'].join(' ');
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
