import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { findProjects } from './find-projects.js';

const inputSchema = z.object({});

const projectSchema = z.object({
  name: z.string(),
  path: z.string(),
  connectPort: z.number().optional(),
  switchboardPort: z.number().optional(),
});

type ProjectInfo = z.infer<typeof projectSchema>;

function isReactorPackage(folderPath: string): boolean {
  try {
    fs.accessSync(path.join(folderPath, 'powerhouse.config.json'));
    return true;
  } catch {
    return false;
  }
}

export const reactorPackagesList = defineCommand({
  id: 'reactor-packages-list',
  description: 'List Reactor package projects in the working directory',
  inputSchema,
  execute: async (_input, { workdir }) => {
    const found = findProjects(workdir, isReactorPackage);

    const projects: ProjectInfo[] = found.map((f) => {
      try {
        const raw = fs.readFileSync(
          path.join(f.path, 'powerhouse.config.json'),
          'utf-8',
        );
        const config = JSON.parse(raw);
        return {
          name: f.name,
          path: f.path,
          connectPort: config.studio?.port ?? config.connect?.port,
          switchboardPort: config.reactor?.port ?? config.switchboard?.port,
        };
      } catch {
        return { name: f.name, path: f.path };
      }
    });

    if (projects.length === 0) {
      return { text: 'No Reactor package projects found', data: [] };
    }

    const lines = projects.map((p) => {
      const rel = path.relative(workdir, p.path);
      const display = rel ? './' + rel : '.';
      const ports = [
        p.connectPort ? `connect:${p.connectPort}` : null,
        p.switchboardPort ? `switchboard:${p.switchboardPort}` : null,
      ].filter(Boolean);
      return `  ${p.name}  ${display}${ports.length ? `  (${ports.join(', ')})` : ''}`;
    });

    return {
      text: `Found ${projects.length} project(s):\n${lines.join('\n')}`,
      data: projects,
    };
  },
});
