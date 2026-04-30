/**
 * Post-generation actions — a typed pipeline that runs after codegen.
 *
 * `collectPostGenActions()` inspects a `GenerateProjectResult` to determine
 * which side-effects (install, build, ph-init, skills-sync) are needed.
 *
 * `runPostGenActions()` executes them sequentially with proper ordering,
 * failure cascading, and log output.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import type { GenerateProjectResult } from './index.js';
import type { ClintProjectSpec, ExternalSkill } from '../spec/types.js';
import type { ProcessRunOptions } from '@powerhousedao/ph-clint';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PostGenAction =
  | { kind: 'ph-init'; targetDir: string; appDir: string; spec: ClintProjectSpec }
  | { kind: 'app-install'; dir: string }
  | { kind: 'app-build'; dir: string }
  | { kind: 'cli-install'; dir: string }
  | { kind: 'cli-build'; dir: string }
  | { kind: 'skills-sync'; targetDir: string; desired: ExternalSkill[] };

export type PostGenActionKind = PostGenAction['kind'];

export interface PostGenActionContext {
  log: (msg: string) => void;
  runProcess?: (
    command: string,
    opts?: Omit<ProcessRunOptions, 'onOutput'>,
  ) => Promise<{ success: boolean; output: string }>;
  skip?: Set<PostGenActionKind>;
}

export interface PostGenActionResult {
  action: PostGenAction;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Fixed execution order — index defines precedence
// ---------------------------------------------------------------------------

const ACTION_ORDER: PostGenActionKind[] = [
  'ph-init',
  'app-install',
  'app-build',
  'cli-install',
  'cli-build',
  'skills-sync',
];

function actionIndex(kind: PostGenActionKind): number {
  return ACTION_ORDER.indexOf(kind);
}

// ---------------------------------------------------------------------------
// Dependency map — which actions depend on which (for failure cascading)
// ---------------------------------------------------------------------------

/** Returns true if `downstream` depends on `upstream` succeeding. */
function dependsOn(
  downstream: PostGenActionKind,
  upstream: PostGenActionKind,
): boolean {
  // ph-init → app-install → app-build → cli-install → cli-build
  // skills-sync is independent of the build chain
  const chain: PostGenActionKind[] = [
    'ph-init',
    'app-install',
    'app-build',
    'cli-install',
    'cli-build',
  ];
  if (downstream === 'skills-sync') return false;
  const di = chain.indexOf(downstream);
  const ui = chain.indexOf(upstream);
  if (di < 0 || ui < 0) return false;
  return di > ui;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// collectPostGenActions
// ---------------------------------------------------------------------------

export async function collectPostGenActions(
  result: GenerateProjectResult,
  spec: ClintProjectSpec,
): Promise<PostGenAction[]> {
  const split = result.appDir !== null;
  const relPaths = new Set(result.files.map((f) => f.relativePath));

  // Determine the earliest triggered action in the chain
  let earliest: PostGenActionKind | null = null;

  if (split) {
    const appFolder = result.appDir ? path.basename(result.appDir) : '';
    const cliFolder = path.basename(result.cliDir);

    // ph-init needed: app dir placeholder written but app not yet initialized.
    // Check the actual filesystem — if package.json already exists on disk,
    // ph init has already run and must not run again.
    const appPkgJsonChanged = relPaths.has(path.join(appFolder, 'package.json'));
    const appGitkeepWritten = relPaths.has(path.join(appFolder, '.gitkeep'));

    // ph-init needed: app dir placeholder written but app not yet initialized.
    // Check the actual filesystem — if package.json already exists on disk,
    // ph init has already run and must not run again.
    if (appGitkeepWritten && !appPkgJsonChanged) {
      const appAlreadyInitialized = result.appDir
        ? await fileExists(path.join(result.appDir, 'package.json'))
        : false;
      if (!appAlreadyInitialized) {
        earliest = 'ph-init';
      }
    }

    // Migration always triggers full rebuild
    if (result.migrated) {
      earliest = earliest ?? 'app-install';
    }

    // App package.json changed
    if (!earliest && appPkgJsonChanged) {
      earliest = 'app-install';
    }

    // App source regenerated (framework.gen.ts, index.ts, etc.)
    if (!earliest) {
      for (const rel of relPaths) {
        if (
          rel.startsWith(appFolder + '/') &&
          rel.endsWith('.ts')
        ) {
          earliest = 'app-build';
          break;
        }
      }
    }

    // CLI package.json changed
    if (!earliest) {
      if (relPaths.has(path.join(cliFolder, 'package.json'))) {
        earliest = 'cli-install';
      }
    }

    // CLI source or prompts regenerated (.ts files, agent profile .md files)
    if (!earliest) {
      for (const rel of relPaths) {
        if (
          rel.startsWith(cliFolder + '/') &&
          (rel.endsWith('.ts') || rel.endsWith('.md'))
        ) {
          earliest = 'cli-build';
          break;
        }
      }
    }
  } else {
    // Flat layout
    if (relPaths.has('package.json')) {
      earliest = 'cli-install';
    } else {
      for (const rel of relPaths) {
        if (rel.endsWith('.ts') || rel.endsWith('.md')) {
          earliest = 'cli-build';
          break;
        }
      }
    }
  }

  // Build the action list from earliest onward
  const actions: PostGenAction[] = [];

  if (earliest && split && result.appDir) {
    const ei = actionIndex(earliest);

    if (ei <= actionIndex('ph-init')) {
      actions.push({
        kind: 'ph-init',
        targetDir: path.dirname(result.appDir),
        appDir: result.appDir,
        spec,
      });
    }
    if (ei <= actionIndex('app-install')) {
      actions.push({ kind: 'app-install', dir: result.appDir });
    }
    if (ei <= actionIndex('app-build')) {
      actions.push({ kind: 'app-build', dir: result.appDir });
    }
    if (ei <= actionIndex('cli-install')) {
      actions.push({ kind: 'cli-install', dir: result.cliDir });
    }
    if (ei <= actionIndex('cli-build')) {
      actions.push({ kind: 'cli-build', dir: result.cliDir });
    }
  } else if (earliest && !split) {
    const ei = actionIndex(earliest);
    if (ei <= actionIndex('cli-install')) {
      actions.push({ kind: 'cli-install', dir: result.cliDir });
    }
    if (ei <= actionIndex('cli-build')) {
      actions.push({ kind: 'cli-build', dir: result.cliDir });
    }
  }

  // skills-sync is independent — append if needed
  if (spec.externalSkills.length > 0) {
    const targetDir = split ? result.cliDir : result.cliDir;
    actions.push({
      kind: 'skills-sync',
      targetDir,
      desired: spec.externalSkills,
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Human-readable label for an action
// ---------------------------------------------------------------------------

function actionLabel(action: PostGenAction): string {
  switch (action.kind) {
    case 'ph-init':
      return `Initialize reactor package (${path.basename(action.appDir)})`;
    case 'app-install':
      return `Install dependencies (${path.basename(action.dir)})`;
    case 'app-build':
      return `Build (${path.basename(action.dir)})`;
    case 'cli-install':
      return `Install dependencies (${path.basename(action.dir)})`;
    case 'cli-build':
      return `Build (${path.basename(action.dir)})`;
    case 'skills-sync':
      return `Sync external skills (${action.desired.length} skill${action.desired.length === 1 ? '' : 's'})`;
  }
}

// ---------------------------------------------------------------------------
// runPostGenActions — effectful runner
// ---------------------------------------------------------------------------

export async function runPostGenActions(
  actions: PostGenAction[],
  ctx: PostGenActionContext,
): Promise<PostGenActionResult[]> {
  if (actions.length === 0) return [];

  const skip = ctx.skip ?? new Set();

  // Filter out explicitly skipped actions. Also skip builds if their
  // corresponding install is skipped (building without install is pointless).
  const effective = actions.filter((a) => {
    if (skip.has(a.kind)) return false;
    // If app-install is skipped, also skip app-build
    if (a.kind === 'app-build' && skip.has('app-install')) return false;
    // If cli-install is skipped, also skip cli-build
    if (a.kind === 'cli-build' && skip.has('cli-install')) return false;
    return true;
  });

  if (effective.length === 0) return [];

  // Print numbered summary
  ctx.log(`\nPost-generation steps (${effective.length}):`);
  effective.forEach((a, i) => {
    ctx.log(`  ${i + 1}. ${actionLabel(a)}`);
  });
  ctx.log('');

  const results: PostGenActionResult[] = [];
  const failed = new Set<PostGenActionKind>();

  for (let i = 0; i < effective.length; i++) {
    const action = effective[i];
    const label = actionLabel(action);
    const prefix = `[${i + 1}/${effective.length}]`;

    // Check if a dependency failed
    const failedDep = [...failed].find((f) => dependsOn(action.kind, f));
    if (failedDep) {
      ctx.log(`${prefix} ${label}... skipped (dependency failed)`);
      results.push({
        action,
        status: 'skipped',
        reason: 'dependency failed',
        durationMs: 0,
      });
      continue;
    }

    ctx.log(`${prefix} ${label}...`);
    const t0 = Date.now();

    try {
      const success = await executeAction(action, ctx);
      const elapsed = Date.now() - t0;

      if (success) {
        ctx.log(`      done (${formatDuration(elapsed)})`);
        results.push({ action, status: 'success', durationMs: elapsed });
      } else {
        ctx.log(`      FAILED`);
        results.push({ action, status: 'failed', durationMs: elapsed });
        failed.add(action.kind);
      }
    } catch (err) {
      const elapsed = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      ctx.log(`      FAILED: ${msg}`);
      results.push({
        action,
        status: 'failed',
        reason: msg,
        durationMs: elapsed,
      });
      failed.add(action.kind);
    }
  }

  // Print summary
  const succeeded = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;

  ctx.log('');
  if (failedCount === 0 && skippedCount === 0) {
    ctx.log(
      `Post-generation: ${succeeded} step${succeeded === 1 ? '' : 's'} completed successfully.`,
    );
    ctx.log('Ready — run `pnpm dev` to start.');
  } else {
    ctx.log(
      `Post-generation: ${succeeded} succeeded, ${failedCount} failed, ${skippedCount} skipped.`,
    );
    if (failedCount > 0) {
      ctx.log(
        'Fix the reported error(s) and re-run `ph-clint clint-project-regen`.',
      );
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Action dispatch
// ---------------------------------------------------------------------------

async function executeAction(
  action: PostGenAction,
  ctx: PostGenActionContext,
): Promise<boolean> {
  switch (action.kind) {
    case 'ph-init': {
      const { runPhInit } = await import('./scaffold.js');
      const result = await runPhInit({
        targetDir: action.targetDir,
        appDir: action.appDir,
        spec: action.spec,
        log: (msg) => ctx.log(`      ${msg}`),
        runProcess: ctx.runProcess,
      });
      if (!result.ran) {
        ctx.log(`      ${result.reason ?? 'ph init did not run'}`);
        return false;
      }
      if (result.exitCode === 0) {
        // Mark app as initialized in generated state
        const { readGeneratedState, writeGeneratedState } = await import('./generated.js');
        const gen = await readGeneratedState(action.targetDir);
        if (gen) {
          gen.appInitialized = true;
          await writeGeneratedState(action.targetDir, gen);
        }
      }
      return result.exitCode === 0;
    }

    case 'app-install':
    case 'cli-install': {
      if (ctx.runProcess) {
        const result = await ctx.runProcess('pnpm install', {
          cwd: action.dir,
          timeout: 300_000,
        });
        return result.success;
      }
      // Fallback: direct spawn
      const { runCommand } = await import('./exec.js');
      const result = await runCommand('pnpm', ['install'], {
        cwd: action.dir,
        stdio: 'inherit',
      });
      return result.exitCode === 0;
    }

    case 'app-build':
    case 'cli-build': {
      return runBuild(action.dir, ctx);
    }

    case 'skills-sync': {
      const { syncExternalSkills } = await import('../skills/sync.js');
      await syncExternalSkills({
        targetDir: action.targetDir,
        desired: action.desired,
        log: (msg) => ctx.log(`      ${msg}`),
      });
      return true;
    }
  }
}

async function runBuild(
  dir: string,
  ctx: PostGenActionContext,
): Promise<boolean> {
  if (ctx.runProcess) {
    const result = await ctx.runProcess('pnpm build', {
      cwd: dir,
      timeout: 120_000,
    });
    return result.success;
  }
  // Fallback: direct spawn
  const { runCommand } = await import('./exec.js');
  const result = await runCommand('pnpm', ['build'], {
    cwd: dir,
    stdio: 'inherit',
  });
  return result.exitCode === 0;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
