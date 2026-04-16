/**
 * Code generator entry point.
 *
 * Takes a `ClintProjectSpec` + target directory and reconciles the on-disk
 * project tree with it.
 *
 * Two modes:
 *
 * - **create** — the target dir is empty (or only contains ignorable
 *   artefacts). Every templated file is written fresh. Refuses to
 *   overwrite existing non-empty state unless `allowNonEmpty`.
 *
 * - **update** — a previous run's spec exists at
 *   `.ph/ph-clint-cli/project-spec.json`. Re-runs the builders, then for
 *   each emitted file:
 *     - files containing `@clint:begin/@clint:end` markers (today: just
 *       `src/cli.ts`) have their marker regions spliced in-place, leaving
 *       user code outside markers untouched;
 *     - files without markers are overwritten iff their on-disk hash still
 *       matches the hash stored from the previous write (user-edited files
 *       are skipped and surfaced via `onWarn`);
 *     - files the new spec no longer emits are removed if their hash still
 *       matches.
 *
 * A spec flip of `features.powerhouse.enabled` from `false` to `true`
 * triggers the flat → split migration before the update flow runs.
 *
 * Mode is auto-detected by the presence of the persisted spec.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type ClintProjectSpec,
  getAppFolderName,
  getCliFolderName,
} from '../spec/types.js';
import {
  getSpecPath,
  readProjectSpec,
  writeProjectSpec,
} from '../spec/file.js';
import {
  hashContent,
  hashFile,
  readHashes,
  writeHashes,
  type HashRecord,
} from './hashes.js';
import { hasMarkers, spliceMarkerRegions } from './markers.js';
import { writeFileEnsuringDir, isDirEmptyEnough } from './write.js';
import { migrateFlatToSplit } from './migrate/flat-to-split.js';
import {
  CLI_FILE_BUILDERS,
  buildReadme,
  buildRootPackageJson,
} from './builders/index.js';

export type GenerateMode = 'create' | 'update' | 'auto';

export interface GenerateProjectOptions {
  /** Absolute path to the project root. */
  targetDir: string;
  spec: ClintProjectSpec;
  /** Defaults to `'auto'` — create if no persisted spec, else update. */
  mode?: GenerateMode;
  /** Create mode: allow writing into a non-empty directory. */
  allowNonEmpty?: boolean;
  /**
   * Update mode: overwrite user-edited files (hash-mismatch) anyway.
   * Also relaxes the git-dirty guard on flat → split migration.
   */
  force?: boolean;
  /** Optional warning sink (diagnostics, not errors). */
  onWarn?: (msg: string) => void;
}

export interface GeneratedFile {
  absolutePath: string;
  relativePath: string;
}

export interface GenerateProjectResult {
  mode: 'create' | 'update';
  /** Files newly written or rewritten. */
  files: GeneratedFile[];
  /** Files skipped because the user had edited them. */
  skipped: GeneratedFile[];
  /** Files removed because the new spec no longer emits them. */
  deleted: GeneratedFile[];
  /** True if a flat → split migration ran. */
  migrated: boolean;
  cliDir: string;
  appDir: string | null;
}

type PlannedFile = {
  /** Path relative to `targetDir`. */
  relativePath: string;
  absolutePath: string;
  content: string;
};

/**
 * Generate / reconcile a project at `targetDir` from the given spec.
 */
export async function generateProject(
  options: GenerateProjectOptions,
): Promise<GenerateProjectResult> {
  const { targetDir, spec } = options;
  const warn = options.onWarn ?? (() => {});

  const existingSpec = await readProjectSpec(targetDir);
  const resolvedMode = resolveMode(options.mode ?? 'auto', existingSpec !== null);

  // Flat → split migration, if needed. Runs BEFORE we compute planned files
  // so the hash record and on-disk state are already in split-layout shape
  // by the time the normal reconciliation runs.
  let migrated = false;
  if (
    resolvedMode === 'update' &&
    existingSpec &&
    !existingSpec.features.powerhouse.enabled &&
    spec.features.powerhouse.enabled
  ) {
    await migrateFlatToSplit({
      targetDir,
      spec,
      force: options.force,
      onWarn: warn,
    });
    migrated = true;
  }

  // Dispatch to the mode-specific flow.
  if (resolvedMode === 'create') {
    return runCreate(options, warn);
  }
  return runUpdate(options, warn, migrated);
}

function resolveMode(
  requested: GenerateMode,
  specExists: boolean,
): 'create' | 'update' {
  if (requested === 'create') return 'create';
  if (requested === 'update') return 'update';
  return specExists ? 'update' : 'create';
}

/** Build the list of files the new spec would emit, with their content. */
function planFiles(
  spec: ClintProjectSpec,
  targetDir: string,
): { planned: PlannedFile[]; cliDir: string; appDir: string | null } {
  const split = spec.features.powerhouse.enabled;
  const cliDir = split ? path.join(targetDir, getCliFolderName(spec)) : targetDir;
  const appDir = split ? path.join(targetDir, getAppFolderName(spec)) : null;
  const planned: PlannedFile[] = [];

  for (const builder of CLI_FILE_BUILDERS) {
    const content = builder.build(spec);
    if (content === null) continue;
    const abs = path.join(cliDir, builder.relativePath);
    planned.push({
      relativePath: path.relative(targetDir, abs),
      absolutePath: abs,
      content,
    });
  }

  // Project-root README — always at the top level.
  const readmeAbs = path.join(targetDir, 'README.md');
  planned.push({
    relativePath: 'README.md',
    absolutePath: readmeAbs,
    content: buildReadme(spec),
  });

  // Split-layout only: root package.json + app placeholder files.
  if (split && appDir) {
    const rootPkg = path.join(targetDir, 'package.json');
    planned.push({
      relativePath: 'package.json',
      absolutePath: rootPkg,
      content: buildRootPackageJson(spec),
    });
    const appGitkeep = path.join(appDir, '.gitkeep');
    planned.push({
      relativePath: path.relative(targetDir, appGitkeep),
      absolutePath: appGitkeep,
      content: '',
    });
    const appReadme = path.join(appDir, 'README.md');
    planned.push({
      relativePath: path.relative(targetDir, appReadme),
      absolutePath: appReadme,
      content: buildAppReadmeContent(spec),
    });
  }

  return { planned, cliDir, appDir };
}

function buildAppReadmeContent(spec: ClintProjectSpec): string {
  return [
    `# ${spec.name}-app`,
    '',
    'Powerhouse reactor-package for this project. Scaffold it with:',
    '',
    '```sh',
    `cd ${spec.name}-app`,
    'ph init',
    '```',
    '',
    'Then run `pnpm install` at the project root.',
    '',
  ].join('\n');
}

/** Create mode — empty target dir, write everything fresh. */
async function runCreate(
  options: GenerateProjectOptions,
  _warn: (msg: string) => void,
): Promise<GenerateProjectResult> {
  const { targetDir, spec } = options;

  if (!options.allowNonEmpty) {
    const empty = await isDirEmptyEnough(targetDir);
    if (!empty) {
      throw new Error(
        `target directory ${targetDir} is not empty (pass allowNonEmpty or --force to override)`,
      );
    }
  }

  const { planned, cliDir, appDir } = planFiles(spec, targetDir);
  const hashes: HashRecord = {};
  const files: GeneratedFile[] = [];
  for (const p of planned) {
    await writeFileEnsuringDir(p.absolutePath, p.content);
    hashes[p.relativePath] = hashContent(p.content);
    files.push({ absolutePath: p.absolutePath, relativePath: p.relativePath });
  }

  await writeProjectSpec(targetDir, spec);
  files.push({
    absolutePath: getSpecPath(targetDir),
    relativePath: path.relative(targetDir, getSpecPath(targetDir)),
  });
  await writeHashes(targetDir, hashes);

  return {
    mode: 'create',
    files,
    skipped: [],
    deleted: [],
    migrated: false,
    cliDir,
    appDir,
  };
}

/** Update mode — reconcile against an existing project. */
async function runUpdate(
  options: GenerateProjectOptions,
  warn: (msg: string) => void,
  migrated: boolean,
): Promise<GenerateProjectResult> {
  const { targetDir, spec } = options;
  const force = !!options.force;

  const { planned, cliDir, appDir } = planFiles(spec, targetDir);
  const plannedByKey = new Map(planned.map((p) => [p.relativePath, p]));
  const previous = await readHashes(targetDir);
  const next: HashRecord = {};
  const files: GeneratedFile[] = [];
  const skipped: GeneratedFile[] = [];
  const deleted: GeneratedFile[] = [];

  // Step 1: write / patch / skip each planned file.
  for (const p of planned) {
    const existing = await hashFile(p.absolutePath);
    if (existing === null) {
      // Not yet on disk — fresh write.
      await writeFileEnsuringDir(p.absolutePath, p.content);
      next[p.relativePath] = hashContent(p.content);
      files.push({
        absolutePath: p.absolutePath,
        relativePath: p.relativePath,
      });
      continue;
    }
    // File exists. Decide how to update it.
    if (hasMarkers(p.content)) {
      const existingContent = await fs.readFile(p.absolutePath, 'utf8');
      const patched = hasMarkers(existingContent)
        ? spliceMarkerRegions(existingContent, p.content)
        : p.content;
      if (patched === existingContent) {
        // No-op: regions already match.
        next[p.relativePath] = hashContent(patched);
        continue;
      }
      await writeFileEnsuringDir(p.absolutePath, patched);
      next[p.relativePath] = hashContent(patched);
      files.push({
        absolutePath: p.absolutePath,
        relativePath: p.relativePath,
      });
      continue;
    }
    // No markers — hash-protected overwrite.
    const stored = previous[p.relativePath];
    const pristine = stored !== undefined && stored === existing;
    if (!pristine && !force) {
      // User edited a managed file. Leave it alone.
      warn(
        `skipped ${p.relativePath} — modified since last generation. Use --force to overwrite.`,
      );
      skipped.push({
        absolutePath: p.absolutePath,
        relativePath: p.relativePath,
      });
      // Preserve the previous hash so the file stays on our ledger.
      if (stored !== undefined) next[p.relativePath] = stored;
      continue;
    }
    if (existing === hashContent(p.content)) {
      // Already up to date.
      next[p.relativePath] = existing;
      continue;
    }
    await writeFileEnsuringDir(p.absolutePath, p.content);
    next[p.relativePath] = hashContent(p.content);
    files.push({
      absolutePath: p.absolutePath,
      relativePath: p.relativePath,
    });
  }

  // Step 2: delete files that the new spec no longer emits, IF we still
  // recognise their content (hash match). Otherwise warn and keep.
  for (const [relPath, storedHash] of Object.entries(previous)) {
    if (plannedByKey.has(relPath)) continue;
    const abs = path.join(targetDir, relPath);
    const onDisk = await hashFile(abs);
    if (onDisk === null) continue; // already gone
    if (onDisk !== storedHash && !force) {
      warn(
        `kept ${relPath} — modified since last generation; new spec no longer emits it.`,
      );
      next[relPath] = storedHash;
      continue;
    }
    await fs.rm(abs, { force: true });
    deleted.push({ absolutePath: abs, relativePath: relPath });
  }

  await writeProjectSpec(targetDir, spec);
  await writeHashes(targetDir, next);

  return {
    mode: 'update',
    files,
    skipped,
    deleted,
    migrated,
    cliDir,
    appDir,
  };
}
