import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({});

interface FusionProjectInfo {
  name: string;
  path: string;
}

export const fusionProjectsList = defineCommand({
  id: 'fusion-projects-list',
  description: 'List Fusion projects in the working directory',
  inputSchema,
  execute: async (_input, { workdir }) => {
    const projects: FusionProjectInfo[] = [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(workdir, { withFileTypes: true });
    } catch {
      return { text: 'Working directory does not exist', data: [] };
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projectPath = path.join(workdir, entry.name);
      const configPath = path.join(projectPath, 'next.config.ts');

      if (fs.existsSync(configPath)) {
        projects.push({
          name: entry.name,
          path: projectPath,
        });
      }
    }

    if (projects.length === 0) {
      return { text: 'No Fusion projects found', data: [] };
    }

    const lines = projects.map((p) => `  ${p.name}`);

    return {
      text: `Found ${projects.length} Fusion project(s):\n${lines.join('\n')}`,
      data: projects,
    };
  },
});
