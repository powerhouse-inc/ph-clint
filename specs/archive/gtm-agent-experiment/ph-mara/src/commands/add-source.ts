import fs from 'node:fs';
import path from 'node:path';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import type { Config } from '../config.js';

const inputSchema = z.object({
  type: z
    .enum(['url', 'pdf', 'document', 'codebase', 'notes'])
    .describe('Source type'),
  path: z
    .string()
    .describe('URL or file path to the source'),
  description: z
    .string()
    .optional()
    .describe('What this source contains'),
});

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
  // Check workdir directly
  const direct = path.join(workdir, 'sources.json');
  if (fs.existsSync(direct)) return direct;

  // Check one level of subdirectories
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

export const addSource = defineCommand<typeof inputSchema, { text: string }, Config>({
  id: 'add-source',
  description: 'Register a research input source',
  inputSchema,
  execute: async ({ type, path: sourcePath, description }, { workdir }) => {
    const sourcesPath = findSourcesJson(workdir);
    if (!sourcesPath) {
      return { text: 'No sources.json found. Run init-project first.' };
    }

    // Validate file sources exist
    if (type !== 'url' && type !== 'notes') {
      const resolved = path.isAbsolute(sourcePath)
        ? sourcePath
        : path.resolve(workdir, sourcePath);
      if (!fs.existsSync(resolved)) {
        return { text: `File not found: ${resolved}` };
      }
    }

    const data: SourcesFile = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

    // Check for duplicate
    const existing = data.sources.find(s => s.path === sourcePath);
    if (existing) {
      return { text: `Source already registered: ${sourcePath}` };
    }

    const entry: SourceEntry = {
      type,
      path: sourcePath,
      ...(description && { description }),
      addedAt: new Date().toISOString(),
    };

    data.sources.push(entry);
    fs.writeFileSync(sourcesPath, JSON.stringify(data, null, 2) + '\n');

    return { text: `Added ${type} source: ${sourcePath}${description ? ` (${description})` : ''}` };
  },
});
