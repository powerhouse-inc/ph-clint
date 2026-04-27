import { defineCommand } from '../framework.js';
import { z } from 'zod';
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
  execute: async ({ name }, { workdir, runProcess }) => {
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
    const clone = await runProcess(
      `git clone https://github.com/powerhouse-inc/fusion-boilerplate.git ${name}`,
      { label: 'git-clone', timeout: 300_000, cwd: workdir },
    );
    if (!clone.success) {
      return { text: `Failed to clone fusion-boilerplate` };
    }

    // Step 2: rename project in package.json
    const sed = await runProcess(
      `sed -i -e s/fusion-boilerplate/${name}/g ./package.json`,
      { label: 'sed-rename', cwd: projectPath },
    );
    if (!sed.success) {
      return { text: `Failed to update package.json` };
    }

    // Step 3: install dependencies
    const install = await runProcess('pnpm install', {
      label: 'pnpm-install',
      timeout: 300_000,
      cwd: projectPath,
      env: { CI: 'true' },
    });
    if (!install.success) {
      return { text: `Failed to install dependencies` };
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
