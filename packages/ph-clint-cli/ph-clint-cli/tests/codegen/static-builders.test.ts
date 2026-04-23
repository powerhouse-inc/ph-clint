/**
 * Smoke tests for each static file builder (no spec-driven branching).
 * These lock in the literal output so accidental whitespace/marker shifts
 * are caught early.
 */
import { describe, it, expect } from '@jest/globals';
import { buildMainTs } from '../../src/codegen/builders/main-ts.js';
import { buildTsconfigJson } from '../../src/codegen/builders/tsconfig-json.js';
import { buildJestConfigJs } from '../../src/codegen/builders/jest-config-js.js';
import { buildEslintConfigJs } from '../../src/codegen/builders/eslint-config-js.js';
import { buildGitignore } from '../../src/codegen/builders/gitignore.js';
import { buildBuildSkillsScript } from '../../src/codegen/builders/build-skills-ts.js';
import { buildMastraIndexTs } from '../../src/codegen/builders/mastra-index-ts.js';
import { buildAgentBaseMd } from '../../src/codegen/builders/agent-base-md.js';
import { buildAgentTs } from '../../src/codegen/builders/agent-ts.js';
import { buildReadme } from '../../src/codegen/builders/readme-md.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildMainTs', () => {
  it('emits the bin shebang and cli.run(process.argv)', () => {
    const out = buildMainTs();
    expect(out).toContain('#!/usr/bin/env node');
    expect(out).toContain("import { cli } from './cli.js'");
    expect(out).toContain('cli.run(process.argv)');
  });
});

describe('buildTsconfigJson', () => {
  it('parses as valid JSON with Node16 module resolution', () => {
    const parsed = JSON.parse(buildTsconfigJson()) as {
      compilerOptions: { module: string; moduleResolution: string };
    };
    expect(parsed.compilerOptions.module).toBe('Node16');
    expect(parsed.compilerOptions.moduleResolution).toBe('Node16');
  });
});

describe('buildJestConfigJs', () => {
  it('points testMatch at tests/ and uses ts-jest ESM', () => {
    const out = buildJestConfigJs();
    expect(out).toContain('testMatch');
    expect(out).toContain('ts-jest');
    expect(out).toContain('useESM: true');
  });
});

describe('buildEslintConfigJs', () => {
  it('exports an empty flat config wrapped in @clint markers', () => {
    const out = buildEslintConfigJs();
    expect(out).toContain('// @clint:begin eslint');
    expect(out).toContain('// @clint:end eslint');
    expect(out).toContain('export default []');
  });
});

describe('buildGitignore', () => {
  it('ignores node_modules, dist, gen, and .ph', () => {
    const out = buildGitignore();
    expect(out).toContain('node_modules/');
    expect(out).toContain('dist/');
    expect(out).toContain('gen/');
    expect(out).toContain('.ph/');
  });
});

describe('buildBuildSkillsScript', () => {
  it('is a tsx script invoking ph-clint-dev buildSkills', () => {
    const out = buildBuildSkillsScript();
    expect(out).toContain('#!/usr/bin/env tsx');
    expect(out).toContain("import { buildSkills } from '@powerhousedao/ph-clint-dev'");
    expect(out).toContain('buildSkills({');
  });
});

describe('buildMastraIndexTs', () => {
  it('mastra off — emits a no-op placeholder', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const out = buildMastraIndexTs(spec);
    expect(out).toContain('export {};');
  });

  it('mastra on — placeholder until a real Mastra instance is wired', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { mastra: { enabled: true } },
    });
    const out = buildMastraIndexTs(spec);
    expect(out).toContain('export {};');
    expect(out).toContain('@mastra/core');
  });
});

describe('buildAgentBaseMd', () => {
  it('mentions the package name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', scope: 'acme' });
    const out = buildAgentBaseMd(spec);
    expect(out).toContain('@acme/foo');
    expect(out).toContain('{{agentName}}');
  });
});

describe('buildAgentTs', () => {
  it('emits a createAgent factory whose id matches the project name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const out = buildAgentTs(spec);
    expect(out).toContain('export async function createAgent');
    expect(out).toContain("id: 'foo'");
  });
});

describe('buildReadme', () => {
  it('flat project — no split-layout section', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const out = buildReadme(spec);
    expect(out).toContain('# foo');
    expect(out).not.toContain('## Split layout');
  });

  it('powerhouse on — mentions the split-layout `ph init` step', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const out = buildReadme(spec);
    expect(out).toContain('## Split layout');
    expect(out).toContain('foo-app');
    expect(out).toContain('ph init');
  });
});
