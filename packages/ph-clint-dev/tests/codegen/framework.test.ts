/**
 * Phase 4 codegen tests — framework.ts + framework.gen.ts + app-index.ts.
 *
 * Covers the split-binding emit (user-owned `framework.ts`, machine-owned
 * `framework.gen.ts`), the init-only vs regen-always semantics, and the
 * top-level reactor-package barrel.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject } from '../../src/codegen/index.js';
import {
  buildFrameworkTs,
  buildFrameworkGenTs,
  buildAppIndexTs,
} from '../../src/codegen/builders/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import type { CodegenContext } from '../../src/codegen/types.js';

const TEST_CTX: CodegenContext = { toolVersion: '0.1.0-test' };

/** Helper: create an app package entry with document types. */
function appPkg(name: string, docTypes: string[]) {
  return { id: `app-${name}`, packageName: `${name}-app`, documentTypes: docTypes };
}

/** Helper: create an external package entry with document types. */
function extPkg(packageName: string, docTypes: string[], id = `ext-${packageName}`) {
  return { id, packageName, documentTypes: docTypes };
}

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-fw-'));
}
async function rmRf(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

describe('buildFrameworkGenTs', () => {
  it('returns null when Powerhouse is disabled (no reactor package to register)', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(buildFrameworkGenTs(spec)).toBeNull();
  });

  it('emits an empty registry when Powerhouse is on but no packages have document types', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const code = buildFrameworkGenTs(spec);
    expect(code).not.toBeNull();
    expect(code).toContain('defineRegistry([] as const)');
    expect(code).toContain("from '@powerhousedao/ph-clint'");
    // framework.gen.ts exports only `registry` + `Registry` type; the
    // createTypes() call lives in framework.ts to avoid a circular import.
    expect(code).toContain('export const registry');
    expect(code).toContain('export type Registry');
    expect(code).not.toContain('createTypes');
  });

  it('imports each registered module from the app package', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project', 'acme/invoice']),
      ],
    });
    const code = buildFrameworkGenTs(spec);
    expect(code).not.toBeNull();
    expect(code).toContain("import { PhClintProject } from 'foo-app';");
    expect(code).toContain("import { Invoice } from 'foo-app';");
    // Registry entries in order.
    const pos1 = code!.indexOf('  PhClintProject,');
    const pos2 = code!.indexOf('  Invoice,');
    expect(pos1).toBeGreaterThan(0);
    expect(pos2).toBeGreaterThan(pos1);
    // `as const` preserved for literal inference.
    expect(code).toContain('] as const);');
  });

  it('imports external package modules from their own npm package', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project']),
        extPkg('@acme/reactor-pkg', ['acme/invoice']),
      ],
    });
    const code = buildFrameworkGenTs(spec);
    expect(code).not.toBeNull();
    expect(code).toContain("import { PhClintProject } from 'foo-app';");
    expect(code).toContain("import { Invoice } from '@acme/reactor-pkg/document-models/invoice';");
  });

  it('emits runtime filter for */* glob on app package', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['*/*'])],
    });
    const code = buildFrameworkGenTs(spec)!;
    expect(code).toContain("import { documentModels as globModels } from 'foo-app';");
    expect(code).toContain('...globModels.filter(');
    expect(code).toContain('.test(m.documentModel.global.id)');
    // No `as const` when globs are present (runtime array loses literal types).
    expect(code).not.toContain('as const');
  });

  it('emits runtime filter for partial glob like powerhouse/*', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['powerhouse/*'])],
    });
    const code = buildFrameworkGenTs(spec)!;
    expect(code).toContain("import { documentModels as globModels } from 'foo-app';");
    expect(code).toMatch(/powerhouse\\/); // regex contains powerhouse\/ (escaped slash)
  });

  it('mixes explicit and glob entries from the same package', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project', 'acme/*']),
      ],
    });
    const code = buildFrameworkGenTs(spec)!;
    // Explicit entry imported by name.
    expect(code).toContain("import { PhClintProject } from 'foo-app';");
    // Glob entry uses documentModels filter.
    expect(code).toContain("import { documentModels as globModels } from 'foo-app';");
    expect(code).toContain('  PhClintProject,');
    expect(code).toContain('...globModels.filter(');
  });

  it('emits runtime filter for glob on external package', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project']),
        extPkg('@acme/reactor-pkg', ['*/*']),
      ],
    });
    const code = buildFrameworkGenTs(spec)!;
    expect(code).toContain("import { PhClintProject } from 'foo-app';");
    expect(code).toContain("import { documentModels as globModels } from '@acme/reactor-pkg';");
    expect(code).toContain('...globModels.filter(');
  });

  it('uses unique aliases for multiple glob packages', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['*/*']),
        extPkg('@acme/reactor-pkg', ['*/*']),
      ],
    });
    const code = buildFrameworkGenTs(spec)!;
    expect(code).toContain('globModels');
    expect(code).toContain('globModels1');
  });
});

describe('buildFrameworkTs', () => {
  it('Powerhouse off — inlines createTypes in framework.ts, no re-export from gen', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const code = buildFrameworkTs(spec);
    expect(code).toContain("import { createTypes } from '@powerhousedao/ph-clint'");
    expect(code).toContain('export const configSchema = z.object({');
    expect(code).toContain('export const secretsSchema = z.object({');
    expect(code).toContain('createTypes({ configSchema: fullConfigSchema })');
    expect(code).not.toContain("from './framework.gen.js'");
  });

  it('Powerhouse on — calls createTypes locally using registry from framework.gen.ts', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const code = buildFrameworkTs(spec);
    expect(code).toContain("import { registry } from './framework.gen.js'");
    expect(code).toContain("import { createTypes } from '@powerhousedao/ph-clint'");
    expect(code).toContain('createTypes({');
    expect(code).toContain('defineCommand,');
    expect(code).toContain('createDocumentChangeTrigger,');
    expect(code).toContain("export { registry } from './framework.gen.js'");
    expect(code).toContain('export const configSchema = z.object({');
  });

  it('Mastra on — seeds model + per-provider apiKey defaults in configSchema/secretsSchema', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: {
          enabled: true,
          models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
        },
      },
    });
    const code = buildFrameworkTs(spec);
    expect(code).toContain("model: z.string().default('anthropic/claude-sonnet-4-5')");
    expect(code).toContain('anthropicApiKey: z.string().optional()');
  });

  it('only clint/demo-agent model — no API key fields in secretsSchema', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: {
          enabled: true,
          models: [{ id: 'clint/demo-agent', isDefault: true }],
        },
      },
    });
    const code = buildFrameworkTs(spec);
    expect(code).not.toContain('clintApiKey');
    // secretsSchema should still exist but be empty
    expect(code).toContain('export const secretsSchema = z.object({');
  });

  it('clint/demo-agent + real model — only real provider API key generated', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        mastra: {
          enabled: true,
          models: [
            { id: 'clint/demo-agent', isDefault: false },
            { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          ],
        },
      },
    });
    const code = buildFrameworkTs(spec);
    expect(code).toContain('anthropicApiKey: z.string().optional()');
    expect(code).not.toContain('clintApiKey');
  });
});

describe('buildAppIndexTs', () => {
  it('returns null when Powerhouse disabled', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(buildAppIndexTs(spec)).toBeNull();
  });

  it('emits standard Powerhouse barrel even with no document types', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const code = buildAppIndexTs(spec)!;
    expect(code).toContain("export { documentModels } from './document-models/document-models.js';");
    expect(code).toContain("export { editors } from './editors/editors.js';");
    expect(code).toContain("export { processorFactory } from './processors/factory.js';");
    expect(code).toContain('export const manifest: Manifest = manifestJson;');
  });

  it('emits barrel plus per-slug re-exports when app package has document types', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project', 'acme/invoice']),
      ],
    });
    const code = buildAppIndexTs(spec)!;
    expect(code).toContain("export { documentModels }");
    expect(code).toContain("export * from './document-models/ph-clint-project/index.js';");
    expect(code).toContain("export * from './document-models/invoice/index.js';");
  });

  it('does not re-export external package document types', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [
        appPkg('foo', ['powerhouse/ph-clint-project']),
        extPkg('@acme/reactor-pkg', ['acme/invoice']),
      ],
    });
    const code = buildAppIndexTs(spec)!;
    expect(code).toContain("export * from './document-models/ph-clint-project/index.js';");
    expect(code).not.toContain('invoice');
  });

  it('uses barrel re-export for glob patterns', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['*/*'])],
    });
    const code = buildAppIndexTs(spec)!;
    expect(code).toContain("export * from './document-models/index.js';");
    expect(code).not.toMatch(/document-models\/\*\//);
  });

  it('emits barrel re-export plus explicit slugs when mixed', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['powerhouse/ph-clint-project', 'acme/*'])],
    });
    const code = buildAppIndexTs(spec)!;
    expect(code).toContain("export * from './document-models/index.js';");
    expect(code).toContain("export * from './document-models/ph-clint-project/index.js';");
  });
});

describe('generateProject — framework files', () => {
  let tmp: string;
  beforeEach(async () => {
    tmp = await mkTmpDir();
  });
  afterEach(async () => {
    await rmRf(tmp);
  });

  it('init emits framework.ts in every layout (Powerhouse on/off)', async () => {
    const off = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ context: TEST_CTX, targetDir: tmp, spec: off });
    expect(await exists(path.join(tmp, 'src/framework.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'src/framework.gen.ts'))).toBe(false);

    const tmp2 = await mkTmpDir();
    try {
      const on = clintProjectSpecSchema.parse({
        name: 'bar-cli',
        features: { powerhouse: 'Connect' },
      });
      await generateProject({ context: TEST_CTX, targetDir: tmp2, spec: on });
      expect(await exists(path.join(tmp2, 'bar-cli/src/framework.ts'))).toBe(true);
      expect(await exists(path.join(tmp2, 'bar-cli/src/framework.gen.ts'))).toBe(true);
    } finally {
      await rmRf(tmp2);
    }
  });

  it('framework.ts is init-only: user edits survive regen', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ context: TEST_CTX, targetDir: tmp, spec });

    const frameworkPath = path.join(tmp, 'src/framework.ts');
    const userEdited = (await fs.readFile(frameworkPath, 'utf8'))
      + '\nexport const USER_MARKER = 42;\n';
    await fs.writeFile(frameworkPath, userEdited, 'utf8');

    // Trigger a regen with a spec change — framework.ts must not be touched.
    const next = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      description: 'changed',
    });
    const result = await generateProject({ context: TEST_CTX, targetDir: tmp, spec: next });
    expect(result.mode).toBe('update');
    expect(result.files.map((f) => f.relativePath)).not.toContain(
      'src/framework.ts',
    );

    const after = await fs.readFile(frameworkPath, 'utf8');
    expect(after).toContain('USER_MARKER = 42');
  });

  it('framework.gen.ts regenerates when packages change', async () => {
    const initial = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ context: TEST_CTX, targetDir: tmp, spec: initial });

    const genPath = path.join(tmp, 'foo-cli/src/framework.gen.ts');
    const v1 = await fs.readFile(genPath, 'utf8');
    expect(v1).toContain('defineRegistry([] as const);');

    const next = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['powerhouse/ph-clint-project'])],
    });
    const result = await generateProject({ context: TEST_CTX, targetDir: tmp, spec: next });
    expect(result.files.map((f) => f.relativePath)).toContain(
      'foo-cli/src/framework.gen.ts',
    );
    const v2 = await fs.readFile(genPath, 'utf8');
    expect(v2).toContain("import { PhClintProject } from 'foo-app';");
    expect(v2).toContain('PhClintProject,');
  });

  it('init emits the reactor-package top-level index.ts when app package has document types', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
      packages: [appPkg('foo', ['powerhouse/ph-clint-project'])],
    });
    await generateProject({ context: TEST_CTX, targetDir: tmp, spec });

    const appIndex = path.join(tmp, 'foo-app/index.ts');
    expect(await exists(appIndex)).toBe(true);
    const content = await fs.readFile(appIndex, 'utf8');
    expect(content).toContain(
      "export * from './document-models/ph-clint-project/index.js';",
    );
  });
});
