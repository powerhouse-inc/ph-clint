/**
 * `ph-clint clint-skills-sync` — reconcile external skills on disk to match
 * the project spec.  Clones missing skills from GitHub, removes skills no
 * longer referenced, and updates `.skills-manifest.json`.
 */
import path from 'node:path';
import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { readProjectSpec } from '../spec/file.js';
import { syncExternalSkills } from '@powerhousedao/ph-clint-dev/skills/sync';

const inputSchema = z.object({
  dir: z
    .string()
    .optional()
    .describe('Project directory (defaults to the current directory)'),
});

export const skillsSync = defineCommand({
  id: 'clint-skills-sync',
  description: 'Synchronise external skills from the project spec',
  inputSchema,
  execute: async (input, { workdir, stdout, log }) => {
    const targetDir = path.resolve(workdir, input.dir ?? '.');
    const spec = await readProjectSpec(targetDir);
    if (!spec) {
      return {
        text:
          `Error: no spec found at ${targetDir}/.ph/ph-clint-cli/project-spec.json.\n` +
          'Run `ph-clint clint-project-init` first to scaffold a new project.',
      };
    }

    const result = await syncExternalSkills({
      targetDir,
      desired: spec.externalSkills,
      log: (msg) => {
        if (log) log.info(msg);
        else stdout(msg + '\n');
      },
    });

    const lines: string[] = [];
    if (result.added.length > 0) {
      lines.push(`Added: ${result.added.join(', ')}`);
    }
    if (result.removed.length > 0) {
      lines.push(`Removed: ${result.removed.join(', ')}`);
    }
    if (result.added.length === 0 && result.removed.length === 0) {
      lines.push('External skills are up to date.');
    }

    stdout(lines.join('\n') + '\n');
    return {
      text: lines.join('\n'),
      data: result,
    };
  },
});
