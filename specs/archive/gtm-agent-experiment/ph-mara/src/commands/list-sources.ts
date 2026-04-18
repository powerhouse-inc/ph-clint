import fs from 'node:fs';
import path from 'node:path';
import { defineCommand } from 'ph-clint';
import { z } from 'zod';
import type { Config } from '../config.js';

const inputSchema = z.object({});

interface SourceEntry {
  type: string;
  path: string;
  description?: string;
  addedAt: string;
}

interface SourcesFile {
  sources: SourceEntry[];
  audience: string;
  message: string;
}

function findSourcesJson(workdir: string): string | null {
  const direct = path.join(workdir, 'sources.json');
  if (fs.existsSync(direct)) return direct;

  try {
    for (const entry of fs.readdirSync(workdir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const nested = path.join(workdir, entry.name, 'sources.json');
        if (fs.existsSync(nested)) return nested;
      }
    }
  } catch {
    // ignore read errors
  }
  return null;
}

export const listSources = defineCommand<typeof inputSchema, { text: string }, Config>({
  id: 'list-sources',
  description: 'Show registered research sources',
  inputSchema,
  execute: async (_input, { workdir, stdout }) => {
    const sourcesPath = findSourcesJson(workdir);
    if (!sourcesPath) {
      return { text: 'No sources.json found. Run init-project first.' };
    }

    const data: SourcesFile = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

    if (data.audience) stdout(`Audience: ${data.audience}\n`);
    if (data.message) stdout(`Message: ${data.message}\n`);
    if (data.audience || data.message) stdout('\n');

    if (data.sources.length === 0) {
      stdout('No sources registered. Use add-source to add research materials.\n');
      return { text: 'No sources registered.' };
    }

    // Format as table
    const typeWidth = Math.max(4, ...data.sources.map(s => s.type.length));
    const pathWidth = Math.max(4, ...data.sources.map(s => s.path.length));

    stdout(`${'TYPE'.padEnd(typeWidth)}  ${'PATH'.padEnd(pathWidth)}  DESCRIPTION\n`);
    stdout(`${'─'.repeat(typeWidth)}  ${'─'.repeat(pathWidth)}  ${'─'.repeat(30)}\n`);

    for (const source of data.sources) {
      stdout(`${source.type.padEnd(typeWidth)}  ${source.path.padEnd(pathWidth)}  ${source.description ?? ''}\n`);
    }

    return { text: `${data.sources.length} source(s) registered.` };
  },
});
