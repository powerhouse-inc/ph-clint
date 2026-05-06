/**
 * `ph-clint clint-project-regen` — reconcile an existing project against its persisted
 * spec. Equivalent to running the generator in update mode.
 *
 * Run inside a project directory (or pass `--dir`). If the spec has flipped
 * `features.powerhouse.enabled` since the last run, the flat → split
 * migration fires first.
 */
import path from 'node:path';
import { defineCommand } from '../framework.js';
import { z } from 'zod';
import { readProjectSpec } from '../spec/file.js';
import { generateProject } from '../codegen/index.js';
import { runPostGenActions } from '@powerhousedao/ph-clint-dev/codegen/actions';
import { ensureSpecDocument } from '../spec/ensure-document.js';

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
  execute: async (input, { workdir, stdout, log, runProcess, reactor: getReactor, folders }) => {
    const targetDir = path.resolve(workdir, input.dir ?? '.');
    const spec = await readProjectSpec(targetDir);
    if (!spec) {
      return {
        text:
          `Error: no spec found at ${targetDir}/.ph/ph-clint-cli/project-spec.json.\n` +
          'Run `ph-clint clint-project-init` first to scaffold a new project.',
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

    // Ensure spec document exists in drive (recover if deleted)
    if (getReactor && folders) {
      try {
        const reactor = await getReactor();
        if (reactor) {
          const { docId, created } = await ensureSpecDocument({
            spec, targetDir, reactor, folders,
          });
          if (created) {
            lines.push(`Created spec document ${docId} in Clint Folders/specs/${spec.name}`);
          }
        }
      } catch (err) {
        log?.warn(`Could not ensure spec document: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    stdout(lines.join('\n') + '\n');

    // Run post-generation actions (install, build, skills-sync).
    await runPostGenActions(result.pendingActions, {
      log: (msg) => stdout(msg + '\n'),
      runProcess,
    });

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
