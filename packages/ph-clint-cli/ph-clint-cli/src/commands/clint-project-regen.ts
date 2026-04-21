/**
 * `ph-clint regen` — reconcile an existing project against its persisted
 * spec. Equivalent to running the generator in update mode.
 *
 * Run inside a project directory (or pass `--dir`). If the spec has flipped
 * `features.powerhouse.enabled` since the last run, the flat → split
 * migration fires first.
 */
import path from 'node:path';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import { readProjectSpec } from '../spec/file.js';
import { generateProject } from '../codegen/index.js';

const inputSchema = z.object({
  dir: z
    .string()
    .optional()
    .describe('Project directory (defaults to the current directory)'),
  force: z
    .boolean()
    .default(false)
    .describe(
      'Overwrite user-edited managed files and bypass the git-dirty guard',
    ),
});

export const regen = defineCommand({
  id: 'clint-project-regen',
  description: 'Regenerate project files from the persisted spec',
  inputSchema,
  execute: async (input, { workdir, stdout, log }) => {
    const targetDir = path.resolve(workdir, input.dir ?? '.');
    const spec = await readProjectSpec(targetDir);
    if (!spec) {
      return {
        text:
          `Error: no spec found at ${targetDir}/.ph/ph-clint-cli/project-spec.json.\n` +
          'Run `ph-clint init` first to scaffold a new project.',
      };
    }

    const warnings: string[] = [];
    const result = await generateProject({
      targetDir,
      spec,
      mode: 'update',
      force: input.force,
      onWarn: (m) => warnings.push(m),
    });

    const lines: string[] = [];
    if (result.migrated) lines.push('Migrated layout: flat → split.');
    lines.push(
      `Wrote ${result.files.length} file(s); skipped ${result.skipped.length}; deleted ${result.deleted.length}.`,
    );
    for (const w of warnings) {
      if (log) log.warn(w);
      else stdout('warning: ' + w + '\n');
    }

    stdout(lines.join('\n') + '\n');
    return {
      text: lines.join('\n'),
      data: {
        mode: result.mode,
        files: result.files.map((f) => f.relativePath),
        skipped: result.skipped.map((f) => f.relativePath),
        deleted: result.deleted.map((f) => f.relativePath),
        migrated: result.migrated,
        warnings,
      },
    };
  },
});
