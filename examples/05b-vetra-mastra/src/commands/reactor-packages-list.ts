import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({});

const projectSchema = z.object({
  name: z.string(),
  path: z.string(),
  connectPort: z.number().optional(),
  switchboardPort: z.number().optional(),
});

type ProjectInfo = z.infer<typeof projectSchema>;

export const reactorPackagesList = defineCommand({
  id: 'reactor-packages-list',
  description: 'List Reactor package projects in the working directory',
  inputSchema,
  execute: async (_input, { workdir }) => {
    const projects: ProjectInfo[] = [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(workdir, { withFileTypes: true });
    } catch {
      return { text: 'Working directory does not exist', data: [] };
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projectPath = path.join(workdir, entry.name);
      const configPath = path.join(projectPath, 'powerhouse.config.json');

      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(raw);
        projects.push({
          name: entry.name,
          path: projectPath,
          connectPort: config.studio?.port ?? config.connect?.port,
          switchboardPort: config.reactor?.port ?? config.switchboard?.port,
        });
      } catch {
        // Not a Reactor package project, skip
      }
    }

    if (projects.length === 0) {
      return { text: 'No Reactor package projects found', data: [] };
    }

    const lines = projects.map((p) => {
      const ports = [
        p.connectPort ? `connect:${p.connectPort}` : null,
        p.switchboardPort ? `switchboard:${p.switchboardPort}` : null,
      ].filter(Boolean);
      return `  ${p.name}${ports.length ? `  (${ports.join(', ')})` : ''}`;
    });

    return {
      text: `Found ${projects.length} project(s):\n${lines.join('\n')}`,
      data: projects,
    };
  },
});
