import fs from 'node:fs';
import path from 'node:path';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import type { Config } from '../config.js';

const inputSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z0-9-_]+$/)
    .describe('Project name (alphanumeric, hyphens, underscores)'),
  audience: z
    .string()
    .optional()
    .describe('Target audience description (e.g. "CTO at enterprise SaaS companies")'),
  message: z
    .string()
    .optional()
    .describe('Key message or value proposition'),
});

interface SourcesFile {
  sources: Array<{ type: string; path: string; description?: string; addedAt: string }>;
  audience: string;
  message: string;
}

export const initProject = defineCommand<typeof inputSchema, { text: string }, Config>({
  id: 'init-project',
  description: 'Initialize a new GTM workspace',
  inputSchema,
  execute: async ({ name, audience, message }, { workdir, stdout }) => {
    const projectPath = path.join(workdir, name);

    // Idempotent: if project already has valid sources.json, succeed
    const sourcesPath = path.join(projectPath, 'sources.json');
    if (fs.existsSync(sourcesPath)) {
      try {
        JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
        return { text: `Project ${name} already exists at ${projectPath}` };
      } catch {
        // Invalid sources.json — recreate
      }
    }

    // Create directory structure
    const dirs = [
      '',
      'research',
      'messaging',
      'design-system',
      'site',
      'deck',
      'screenshots',
    ];

    for (const dir of dirs) {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    }

    // Create sources.json
    const sources: SourcesFile = {
      sources: [],
      audience: audience ?? '',
      message: message ?? '',
    };
    fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2) + '\n');

    stdout(`Created GTM workspace at ${projectPath}\n`);
    stdout(`  research/       — Positioning brief outputs\n`);
    stdout(`  messaging/      — Versioned site outlines\n`);
    stdout(`  design-system/  — Visual identity and components\n`);
    stdout(`  site/           — HTML prototype\n`);
    stdout(`  deck/           — Slide presentation\n`);
    stdout(`  screenshots/    — Visual QA captures\n`);

    if (audience) stdout(`  Audience: ${audience}\n`);
    if (message) stdout(`  Message: ${message}\n`);

    return { text: `Project ${name} initialized at ${projectPath}` };
  },
});
