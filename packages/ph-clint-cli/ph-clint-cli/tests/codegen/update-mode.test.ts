/**
 * Integration tests for `generateProject` in update mode — repeated runs
 * over an existing project, with and without user edits.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject } from '../../src/codegen/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import { readHashes } from '../../src/codegen/hashes.js';
import {
  readGeneratedState,
  writeGeneratedState,
  generatedStateFromSpec,
} from '../../src/codegen/generated.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-upd-'));
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

describe('generateProject — update mode', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('create → re-run is a no-op: same spec, same files, no rewrites', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const first = await generateProject({ targetDir: tmp, spec });
    expect(first.mode).toBe('create');
    expect(first.files.length).toBeGreaterThan(0);

    const second = await generateProject({ targetDir: tmp, spec });
    expect(second.mode).toBe('update');
    expect(second.files).toEqual([]);
    expect(second.skipped).toEqual([]);
    expect(second.deleted).toEqual([]);
    expect(second.migrated).toBe(false);
  });

  it('auto-detects update mode from the persisted spec', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec });
    // Second run without specifying mode.
    const result = await generateProject({ targetDir: tmp, spec });
    expect(result.mode).toBe('update');
  });

  it('patches src/cli.ts marker regions when the spec changes', async () => {
    const initial = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec: initial });

    // User adds something OUTSIDE the markers — must be preserved.
    const cliPath = path.join(tmp, 'src/cli.ts');
    const original = await fs.readFile(cliPath, 'utf8');
    const userEdited =
      original + '\n// USER LINE — stays across regen\nexport const marker = 1;\n';
    await fs.writeFile(cliPath, userEdited, 'utf8');

    // Flip a feature — should splice fresh content into markers, preserve epilogue.
    const updated = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { mastra: { enabled: true } },
    });
    const result = await generateProject({ targetDir: tmp, spec: updated });
    expect(result.mode).toBe('update');

    const after = await fs.readFile(cliPath, 'utf8');
    expect(after).toContain('USER LINE — stays across regen');
    expect(after).toContain('cli.configureAgent(createAgent)');
    expect(after).toContain(
      "import { createAgent } from './agents/agent.js'",
    );
  });

  it('skips a user-edited managed file unless --force', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec });

    const pkgPath = path.join(tmp, 'package.json');
    const original = await fs.readFile(pkgPath, 'utf8');
    const edited = original.replace('"foo-cli"', '"foo-user-renamed"');
    await fs.writeFile(pkgPath, edited, 'utf8');

    // Re-run with a spec change (description); default behaviour: skip.
    const warnings: string[] = [];
    const updated = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      description: 'updated',
    });
    const res = await generateProject({
      targetDir: tmp,
      spec: updated,
      onWarn: (m) => warnings.push(m),
    });
    expect(res.skipped.map((f) => f.relativePath)).toContain('package.json');
    const stillEdited = await fs.readFile(pkgPath, 'utf8');
    expect(stillEdited).toContain('foo-user-renamed');
    expect(warnings.some((w) => /package\.json/.test(w))).toBe(true);

    // Now with force — file gets overwritten.
    const forced = await generateProject({
      targetDir: tmp,
      spec: updated,
      force: true,
    });
    expect(forced.files.map((f) => f.relativePath)).toContain('package.json');
    const overwritten = await fs.readFile(pkgPath, 'utf8');
    expect(overwritten).not.toContain('foo-user-renamed');
  });

  it('removes files the new spec no longer emits', async () => {
    // Start with Mastra on → agent.ts exists.
    const withMastra = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { mastra: { enabled: true } },
    });
    await generateProject({ targetDir: tmp, spec: withMastra });
    const agentTs = path.join(tmp, 'src/agents/agent.ts');
    expect(await exists(agentTs)).toBe(true);

    // Flip Mastra off → agent.ts should disappear.
    const withoutMastra = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const result = await generateProject({
      targetDir: tmp,
      spec: withoutMastra,
    });
    expect(await exists(agentTs)).toBe(false);
    expect(result.deleted.map((f) => f.relativePath)).toContain(
      'src/agents/agent.ts',
    );
  });

  it('keeps a user-edited abandoned file instead of deleting', async () => {
    const withMastra = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { mastra: { enabled: true } },
    });
    await generateProject({ targetDir: tmp, spec: withMastra });

    const agentTs = path.join(tmp, 'src/agents/agent.ts');
    await fs.writeFile(agentTs, '// user edited\n', 'utf8');

    const warnings: string[] = [];
    const withoutMastra = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const result = await generateProject({
      targetDir: tmp,
      spec: withoutMastra,
      onWarn: (m) => warnings.push(m),
    });
    expect(await exists(agentTs)).toBe(true);
    expect(result.deleted).toEqual([]);
    expect(warnings.some((w) => /agent\.ts/.test(w))).toBe(true);
  });

  it('stores per-file hashes after each run', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec });
    const hashes = await readHashes(tmp);
    expect(Object.keys(hashes)).toContain('src/cli.ts');
    expect(Object.keys(hashes)).toContain('package.json');
    for (const h of Object.values(hashes)) {
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('writes generated.json on create', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ targetDir: tmp, spec });
    const gen = await readGeneratedState(tmp);
    expect(gen).not.toBeNull();
    expect(gen!.name).toBe('foo-cli');
    expect(gen!.cliFolderName).toBe('foo-cli');
    expect(gen!.appFolderName).toBe('foo-app');
    expect(gen!.appInitialized).toBe(false);
  });

  it('renames folders when project name changes (split layout)', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ targetDir: tmp, spec });

    // Simulate app initialization (create a package.json in the app dir)
    const appDir = path.join(tmp, 'foo-app');
    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify({ name: 'foo-app' }),
    );
    // Mark as initialized
    await writeGeneratedState(
      tmp,
      generatedStateFromSpec(spec, true),
    );

    // Rename: foo → bar
    const renamed = clintProjectSpecSchema.parse({
      name: 'bar-cli',
      features: { powerhouse: 'Connect' },
    });
    const result = await generateProject({
      targetDir: tmp,
      spec: renamed,
      force: true,
    });

    // Old dirs should be gone, new dirs should exist
    expect(await exists(path.join(tmp, 'foo-cli'))).toBe(false);
    expect(await exists(path.join(tmp, 'foo-app'))).toBe(false);
    expect(await exists(path.join(tmp, 'bar-cli'))).toBe(true);
    expect(await exists(path.join(tmp, 'bar-app'))).toBe(true);

    // Hashes should use new prefix
    const hashes = await readHashes(tmp);
    const keys = Object.keys(hashes);
    expect(keys.some((k) => k.startsWith('bar-cli/'))).toBe(true);
    expect(keys.some((k) => k.startsWith('foo-cli/'))).toBe(false);

    // generated.json should reflect new name
    const gen = await readGeneratedState(tmp);
    expect(gen!.name).toBe('bar-cli');
    expect(gen!.cliFolderName).toBe('bar-cli');
    expect(gen!.appFolderName).toBe('bar-app');

    // No files should be deleted (rename, not delete+recreate)
    expect(result.deleted).toEqual([]);

    // Post-gen actions: app package.json was patched →
    // app-install + app-build + cli-install + cli-build
    const actionKinds = result.pendingActions.map((a) => a.kind);
    expect(actionKinds).toEqual([
      'app-install',
      'app-build',
      'cli-install',
      'cli-build',
    ]);
  });

  it('patches app package.json when scope changes', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@oldscope',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ targetDir: tmp, spec });

    // Simulate app initialization
    const appDir = path.join(tmp, 'foo-app');
    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify({ name: '@oldscope/foo-app' }),
    );
    await writeGeneratedState(tmp, generatedStateFromSpec(spec, true));

    // Change scope
    const newScope = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@newscope',
      features: { powerhouse: 'Connect' },
    });
    const result = await generateProject({
      targetDir: tmp,
      spec: newScope,
      force: true,
    });

    const appPkg = JSON.parse(
      await fs.readFile(path.join(appDir, 'package.json'), 'utf8'),
    );
    expect(appPkg.name).toBe('@newscope/foo-app');

    // App package.json patched → app-install through cli-build
    const kinds = result.pendingActions.map((a) => a.kind);
    expect(kinds).toEqual([
      'app-install',
      'app-build',
      'cli-install',
      'cli-build',
    ]);

    // Steady-state re-run → no actions
    const steady = await generateProject({
      targetDir: tmp,
      spec: newScope,
      force: true,
    });
    expect(steady.pendingActions).toEqual([]);
  });

  it('name change triggers app-install through cli-build, not ph-init', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ targetDir: tmp, spec });

    // Simulate initialized app
    const appDir = path.join(tmp, 'foo-app');
    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify({ name: 'foo-app' }),
    );
    await writeGeneratedState(tmp, generatedStateFromSpec(spec, true));

    // Rename
    const renamed = clintProjectSpecSchema.parse({
      name: 'bar-cli',
      features: { powerhouse: 'Connect' },
    });
    const result = await generateProject({
      targetDir: tmp,
      spec: renamed,
      force: true,
    });

    const kinds = result.pendingActions.map((a) => a.kind);
    // Must NOT include ph-init — app was already initialized and renamed
    expect(kinds).not.toContain('ph-init');
    // App package.json was patched → full chain from app-install
    expect(kinds).toEqual([
      'app-install',
      'app-build',
      'cli-install',
      'cli-build',
    ]);
  });

  it('scope change on flat layout triggers cli-install + cli-build', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@oldscope',
    });
    await generateProject({ targetDir: tmp, spec });

    const newScope = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@newscope',
    });
    const result = await generateProject({
      targetDir: tmp,
      spec: newScope,
      force: true,
    });

    const kinds = result.pendingActions.map((a) => a.kind);
    expect(kinds).toEqual(['cli-install', 'cli-build']);
  });

  it('name change on flat layout triggers cli-install + cli-build', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec });

    const renamed = clintProjectSpecSchema.parse({ name: 'bar-cli' });
    const result = await generateProject({
      targetDir: tmp,
      spec: renamed,
      force: true,
    });

    const kinds = result.pendingActions.map((a) => a.kind);
    expect(kinds).toEqual(['cli-install', 'cli-build']);
  });
});
