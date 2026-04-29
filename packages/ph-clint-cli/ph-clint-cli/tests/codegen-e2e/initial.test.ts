/**
 * E2E tests for initial (create-mode) codegen.
 *
 * For each fixture: generate → scaffold app (PH) → rewrite deps →
 * pnpm install → tsc → pnpm start --help → assert regex patterns.
 *
 * These tests are slow (pnpm install + tsc per fixture) and should be
 * run separately from the fast unit/integration suite.
 */
import { describe, it, expect, afterAll } from '@jest/globals';
import { generateProject } from '../../src/codegen/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import { FIXTURES } from './fixtures.js';
import {
  mkTmpDir,
  rmRf,
  fileTree,
  scaffoldAppPackage,
  rewriteLocalDeps,
  pnpmInstall,
  tscBuild,
  runHelp,
} from './helpers.js';

const tmpDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tmpDirs.map(rmRf));
}, 120_000);

/**
 * Per-fixture regex patterns that `pnpm start --help` output must match.
 */
const HELP_PATTERNS: Record<string, RegExp[]> = {
  minimal: [
    /test-minimal/,
    /0\.0\.1-dev\.0/,
    /--verbose/,
    /--meta/,
    /config/,
  ],
  'mastra-demo': [
    /test-mastra-demo/,
    /--resume/,
    /--interactive/,
    /config/,
  ],
  'mastra-configured': [
    /test-mastra-cfg/,
    /--resume/,
    /config/,
  ],
  'mastra-multi-model': [
    /test-multi/,
    /--resume/,
    /ANTHROPIC_API_KEY/,
    /OPENAI_API_KEY/,
    /config/,
  ],
  'reactor-minimal': [
    /test-reactor/,
    /--verbose/,
    /config/,
  ],
  switchboard: [
    /test-switchboard/,
    /--resume/,
    /--no-api/,
    /config/,
  ],
  'connect-full': [
    /test-connect/,
    /--resume/,
    /--no-api/,
    /--no-studio/,
    /ANTHROPIC_API_KEY/,
    /OPENAI_API_KEY/,
    /config/,
  ],
};

/** Files that MUST be present for a fixture (key structural assertions). */
const REQUIRED_FILES: Record<string, string[]> = {
  minimal: [
    'package.json',
    'src/cli.ts',
    'src/config.ts',
    'src/framework.ts',
    'src/main.ts',
    'src/mastra/index.ts',
    'README.md',
  ],
  'mastra-demo': [
    'src/agents/agent.ts',
    'prompts/agent-profiles/AgentBase.md',
  ],
  'mastra-configured': [
    'src/agents/agent.ts',
    'src/agents/demo-agent.ts',
    'prompts/agent-profiles/AgentBase.md',
  ],
  'mastra-multi-model': [
    'src/agents/agent.ts',
    'src/agents/demo-agent.ts',
    'prompts/agent-profiles/core.md',
    'prompts/agent-profiles/developer.md',
  ],
  'reactor-minimal': [
    'test-reactor-cli/package.json',
    'test-reactor-cli/src/cli.ts',
    'test-reactor-cli/src/framework.ts',
    'test-reactor-cli/src/framework.gen.ts',
    'package.json',
    'publish.config.js',
  ],
  switchboard: [
    'test-switchboard-cli/package.json',
    'test-switchboard-cli/src/cli.ts',
    'test-switchboard-cli/src/framework.gen.ts',
    'test-switchboard-cli/src/agents/agent.ts',
    'package.json',
  ],
  'connect-full': [
    'test-connect-cli/package.json',
    'test-connect-cli/src/cli.ts',
    'test-connect-cli/src/framework.gen.ts',
    'test-connect-cli/src/agents/agent.ts',
    'test-connect-cli/prompts/agent-profiles/base.md',
    'test-connect-cli/prompts/agent-profiles/ops.md',
    'package.json',
    'publish.config.js',
  ],
};

/** Files that must NOT be present for a fixture. */
const ABSENT_FILES: Record<string, string[]> = {
  minimal: [
    'src/agents/agent.ts',
    'src/framework.gen.ts',
  ],
  'mastra-demo': [
    'src/framework.gen.ts',
  ],
  'mastra-multi-model': [
    'prompts/agent-profiles/AgentBase.md',
  ],
  'reactor-minimal': [
    'src/cli.ts',
  ],
};

describe.each(Object.keys(FIXTURES))('initial codegen — %s', (fixtureName) => {
  it(
    'generates, installs, builds, and runs --help',
    async () => {
      const tmp = await mkTmpDir(fixtureName);
      tmpDirs.push(tmp);

      const spec = clintProjectSpecSchema.parse(FIXTURES[fixtureName]);
      const result = await generateProject({ targetDir: tmp, spec });
      expect(result.mode).toBe('create');

      const cliDir = result.cliDir;

      // ── Assert file tree ──
      const tree = await fileTree(tmp);

      const required = REQUIRED_FILES[fixtureName];
      if (required) {
        for (const f of required) {
          expect(tree).toContain(f);
        }
      }

      const absent = ABSENT_FILES[fixtureName];
      if (absent) {
        for (const f of absent) {
          expect(tree).not.toContain(f);
        }
      }

      // ── Scaffold app package for PH-enabled fixtures ──
      await scaffoldAppPackage(tmp, spec);

      // ── Rewrite deps → file: references ──
      await rewriteLocalDeps(tmp, spec);

      // ── Install ──
      pnpmInstall(cliDir);

      // ── Build ──
      tscBuild(cliDir);

      // ── Run --help ──
      const helpOutput = runHelp(cliDir);

      const patterns = HELP_PATTERNS[fixtureName];
      if (patterns) {
        for (const pattern of patterns) {
          expect(helpOutput).toMatch(pattern);
        }
      }
    },
    300_000,
  );
});
