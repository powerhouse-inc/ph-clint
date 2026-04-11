import { defineCommand, scanProjects } from 'ph-clint';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({});

function isFusionProject(folderPath: string): boolean {
  return fs.existsSync(path.join(folderPath, 'next.config.ts'));
}

export const fusionProjectsList = defineCommand({
  id: 'fusion-projects-list',
  description: 'List Fusion projects in the working directory',
  inputSchema,
  execute: async (_input, { workdir }) => {
    const projects = scanProjects(workdir, { isProjectFolder: isFusionProject });

    if (projects.length === 0) {
      return { text: 'No Fusion projects found', data: [] };
    }

    const lines = projects.map((p) => {
      const rel = path.relative(workdir, p.path);
      const display = rel ? './' + rel : '.';
      return `  ${p.name}  ${display}`;
    });

    return {
      text: `Found ${projects.length} Fusion project(s):\n${lines.join('\n')}`,
      data: projects,
    };
  },
});
