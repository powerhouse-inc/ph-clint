/**
 * E2E tests for incremental (update-mode) codegen transitions.
 *
 * For each transition pair [from, to]:
 *   1. Generate from spec → scaffold app → install → build → verify --help
 *   2. Generate to spec (update mode) → scaffold app → install → build → verify --help
 *   3. Assert structural expectations on the update result
 *
 * Transitions that flip powerhouse from Disabled to enabled trigger the
 * flat→split migration, which requires a git repo with a clean initial commit.
 */
import { describe, it, expect, afterAll } from '@jest/globals';
import { generateProject } from '../../src/codegen/index.js';
import { clintProjectSpecSchema, type ClintProjectSpec } from '../../src/spec/types.js';
import { FIXTURES, TRANSITIONS } from './fixtures.js';
import {
  mkTmpDir,
  rmRf,
  fileTree,
  scaffoldAppPackage,
  rewriteLocalDeps,
  gitInit,
  gitCommitAll,
  pnpmInstall,
  tscBuild,
  runHelp,
} from './helpers.js';

const tmpDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tmpDirs.map(rmRf));
}, 120_000);

function needsMigration(from: ClintProjectSpec, to: ClintProjectSpec): boolean {
  return (
    from.features.powerhouse === 'Disabled' &&
    to.features.powerhouse !== 'Disabled'
  );
}

/**
 * Derive help-output patterns from a parsed spec's features.
 * These are feature-based (not name-based) since incremental tests
 * inherit the from-fixture's name.
 */
function helpPatternsForSpec(spec: ClintProjectSpec): RegExp[] {
  const patterns: RegExp[] = [/--verbose/, /config/];
  if (spec.features.mastra.enabled) {
    patterns.push(/--resume/);
  }
  if (spec.features.powerhouse !== 'Disabled') {
    // Switchboard and Connect get --no-api / --no-studio
    if (['Switchboard', 'Connect'].includes(spec.features.powerhouse)) {
      patterns.push(/--no-api/);
    }
    if (spec.features.powerhouse === 'Connect') {
      patterns.push(/--no-studio/);
    }
  }
  return patterns;
}

describe.each(TRANSITIONS)(
  'incremental codegen — %s → %s',
  (fromName, toName) => {
    it(
      'transitions, installs, builds, and runs --help',
      async () => {
        const fromSpec = clintProjectSpecSchema.parse(FIXTURES[fromName]);
        // Keep the from-fixture's identity (name, scope) — only features change.
        const toInput = { ...FIXTURES[toName], name: fromSpec.name, scope: fromSpec.scope };
        const toSpec = clintProjectSpecSchema.parse(toInput);
        const migrates = needsMigration(fromSpec, toSpec);

        // ── Step 1: Generate initial state ──
        const tmp = await mkTmpDir(`${fromName}-to-${toName}`);
        tmpDirs.push(tmp);

        const createResult = await generateProject({
          targetDir: tmp,
          spec: fromSpec,
        });
        expect(createResult.mode).toBe('create');

        // If the transition needs migration, set up git with a clean commit.
        if (migrates) {
          gitInit(tmp);
          gitCommitAll(tmp, 'initial codegen');
        }

        // Scaffold, install, build, and verify the initial state.
        await scaffoldAppPackage(tmp, fromSpec);
        await rewriteLocalDeps(tmp, fromSpec);
        const fromCliDir = createResult.cliDir;
        const fromIsSplit = createResult.appDir !== null;
        pnpmInstall(fromCliDir);
        tscBuild(fromCliDir);

        const fromHelp = runHelp(fromCliDir);
        for (const p of helpPatternsForSpec(fromSpec)) {
          expect(fromHelp).toMatch(p);
        }

        // ── Step 2: Apply update ──
        // force: true because rewriteLocalDeps mutated package.json after
        // the first codegen, causing a hash mismatch. Without force, the
        // update would skip the package.json (treating it as user-edited).
        const updateResult = await generateProject({
          targetDir: tmp,
          spec: toSpec,
          force: true,
        });
        expect(updateResult.mode).toBe('update');

        if (migrates) {
          expect(updateResult.migrated).toBe(true);
        }

        // ── Step 3: Scaffold, install, build the updated state ──
        await scaffoldAppPackage(tmp, toSpec);
        await rewriteLocalDeps(tmp, toSpec);
        const toCliDir = updateResult.cliDir;
        const toIsSplit = updateResult.appDir !== null;
        pnpmInstall(toCliDir);
        tscBuild(toCliDir);

        // ── Step 4: Verify --help reflects the new spec ──
        const toHelp = runHelp(toCliDir);
        for (const p of helpPatternsForSpec(toSpec)) {
          expect(toHelp).toMatch(p);
        }

        // ── Step 5: Structural assertions ──
        const tree = await fileTree(tmp);

        // Mastra flips off → agent.ts deleted.
        if (fromSpec.features.mastra.enabled && !toSpec.features.mastra.enabled) {
          const agentRelPath = toIsSplit
            ? `${toSpec.name}-cli/src/agents/agent.ts`
            : 'src/agents/agent.ts';
          expect(tree).not.toContain(agentRelPath);
          expect(updateResult.deleted.map((f) => f.relativePath)).toContain(
            agentRelPath,
          );
        }

        // Mastra flips on → agent.ts appears.
        if (!fromSpec.features.mastra.enabled && toSpec.features.mastra.enabled) {
          const agentRelPath = toIsSplit
            ? `${toSpec.name}-cli/src/agents/agent.ts`
            : 'src/agents/agent.ts';
          expect(tree).toContain(agentRelPath);
        }

        // Profiles appear → AgentBase.md removed, profile files present.
        if (
          toSpec.features.mastra.enabled &&
          toSpec.features.mastra.profiles.length > 0
        ) {
          const prefix = toIsSplit ? `${toSpec.name}-cli/` : '';
          expect(tree).not.toContain(
            `${prefix}prompts/agent-profiles/AgentBase.md`,
          );
          for (const p of toSpec.features.mastra.profiles) {
            expect(tree).toContain(
              `${prefix}prompts/agent-profiles/${p.id}.md`,
            );
          }
        }

        // Migration produced split layout.
        if (migrates) {
          expect(
            tree.some((f) => f.startsWith(`${toSpec.name}-cli/`)),
          ).toBe(true);
          expect(tree).not.toContain('src/cli.ts');
        }
      },
      600_000, // two full install+build cycles per transition
    );
  },
);
