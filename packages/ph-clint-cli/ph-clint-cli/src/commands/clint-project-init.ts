/**
 * `ph-clint clint-project-init` — the project bootstrap wizard.
 *
 * Behavior:
 *   1. Resolve target dir (positional `dir`, defaults to the project name).
 *   2. Assert it is empty (or `--force`).
 *   3. Collect project identity + feature toggles (prompt for missing).
 *   4. Assemble a ClintProjectSpec and validate with Zod.
 *   5. Write the spec + emit the generated tree via `generateProject`.
 *   6. (Split layout) run `ph init` in `{name}-app/`.
 *   7. Run `pnpm install` in generated sub-projects unless `--skip-install`.
 *   8. Print next-steps guidance.
 */
import path from 'node:path';
import { defineCommand } from '@powerhousedao/ph-clint';
import { z } from 'zod';
import {
  clintProjectSpecSchema,
  type ClintProjectSpec,
} from '../spec/types.js';
import { generateProject } from '../codegen/index.js';
import { isDirEmptyEnough } from '../codegen/write.js';
import { runPostGenActions, type PostGenActionKind } from '../codegen/actions.js';
import { ensureSpecDocument } from '../spec/ensure-document.js';

const inputSchema = z.object({
  dir: z
    .string()
    .optional()
    .describe('Target directory (defaults to the project name)'),
  name: z
    .string()
    .describe(
      'Project name — bare, or `@scope/name`. Lowercase letters, digits, hyphens.',
    ),
  description: z.string().optional().describe('Short project description'),
  enablePowerhouse: z
    .boolean()
    .default(false)
    .describe('Enable Powerhouse reactor (requires split layout)'),
  enableMastra: z
    .boolean()
    .default(false)
    .describe('Enable Mastra AI agent stack'),
  enableRoutine: z
    .boolean()
    .default(false)
    .describe('Enable the tick-based routine loop'),
  force: z
    .boolean()
    .default(false)
    .describe('Overwrite files if the target directory is not empty'),
  skipInstall: z
    .boolean()
    .default(false)
    .describe('Do not run `pnpm install` after scaffolding'),
});

type InitInput = z.output<typeof inputSchema>;

/** Parse `@scope/name` into { scope, name }. Auto-appends `-cli` if missing. */
function splitPackageName(raw: string): { scope?: string; name: string } {
  const match = /^@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/.exec(raw);
  if (match) {
    const name = match[2].endsWith('-cli') ? match[2] : `${match[2]}-cli`;
    return { scope: `@${match[1]}`, name };
  }
  if (raw.startsWith('@')) {
    throw new Error(
      `invalid package name "${raw}" — expected "@scope/name" with lowercase letters, digits, hyphens`,
    );
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(raw)) {
    throw new Error(
      `invalid project name "${raw}" — expected lowercase letters, digits, hyphens`,
    );
  }
  const name = raw.endsWith('-cli') ? raw : `${raw}-cli`;
  return { name };
}

export function buildSpec(input: InitInput): ClintProjectSpec {
  const { scope, name } = splitPackageName(input.name);

  // Routine is forced on when Mastra is on — the REPL-only path works, but
  // the agent routine loop is what most users actually want.
  const routine = input.enableRoutine || input.enableMastra;

  const baseName = name.replace(/-cli$/, '');
  const mastra = input.enableMastra
    ? {
        enabled: true,
        agentId: `${baseName}-agent`,
        agentName: `${baseName.charAt(0).toUpperCase()}${baseName.slice(1).replace(/-(\w)/g, (_, c: string) => ' ' + c.toUpperCase())} Agent`,
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
        profiles: [{ id: 'base', title: 'Base', content: 'You are a helpful assistant.' }],
      }
    : { enabled: false };

  const candidate = {
    name,
    scope,
    description: input.description ?? '',
    features: {
      powerhouse: input.enablePowerhouse ? 'Connect' as const : 'Disabled' as const,
      mastra,
      routine: { enabled: routine },
    },
  };
  return clintProjectSpecSchema.parse(candidate);
}

export const init = defineCommand({
  id: 'clint-project-init',
  description: 'Initialize a new ph-clint project in the target directory',
  inputSchema,
  prompt: {
    promptForDefaults: true,
    promptOptional: ['description'],
  },
  execute: async (input, { workdir, stdout, reactor: getReactor, folders, runProcess }) => {
    const { name: bareName } = splitPackageName(input.name);
    const targetDir = path.resolve(workdir, input.dir ?? bareName);

    if (!input.force) {
      const empty = await isDirEmptyEnough(targetDir);
      if (!empty) {
        return {
          text:
            `Error: ${targetDir} is not empty. Re-run with --force to initialize anyway,\n` +
            'or choose a different --dir.',
        };
      }
    }

    const spec = buildSpec(input);

    const result = await generateProject({
      targetDir,
      spec,
      mode: 'create',
      allowNonEmpty: input.force,
    });

    stdout(`Generated ${result.files.length} files in ${targetDir}\n`);

    // Create spec document in personal drive (if reactor available)
    if (getReactor && folders) {
      try {
        const reactor = await getReactor();
        if (reactor) {
          const { docId } = await ensureSpecDocument({
            spec, targetDir, reactor, folders,
          });
          stdout(`Created spec document ${docId} in Clint Folders/specs/${spec.name}\n`);
        }
      } catch (err) {
        // Non-fatal — trigger will pick it up on next startup
        stdout(`Note: could not create spec document — ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }

    // Run post-generation actions (ph-init, install, build, skills-sync).
    // Only skip cli-install — in split layout, ph-init handles app install
    // internally, and app-build must still run so the CLI can link to it.
    const skip = new Set<PostGenActionKind>();
    if (input.skipInstall) {
      skip.add('cli-install');
    }
    await runPostGenActions(result.pendingActions, {
      log: (msg) => stdout(msg + '\n'),
      runProcess,
      skip,
    });

    const split = spec.features.powerhouse !== 'Disabled';

    const next: string[] = [];
    next.push('');
    next.push('Next steps:');
    const relDir = path.relative(workdir, targetDir) || '.';
    if (split) {
      next.push(`  cd ${relDir}`);
      if (input.skipInstall) {
        next.push('  pnpm install');
      }
      next.push('  pnpm dev');
    } else {
      next.push(`  cd ${relDir}`);
      if (input.skipInstall) next.push('  pnpm install');
      next.push('  pnpm dev');
    }
    next.push('');
    next.push(
      'Edit the project spec and run `ph-clint clint-project-regen` to regenerate.',
    );

    return {
      text: next.join('\n'),
      data: { targetDir, spec, fileCount: result.files.length },
    };
  },
});
