/**
 * Flat → split migration tests. Covers the end-to-end generator flow when
 * `features.powerhouse` flips `'Disabled'` → a enabled level, and the low-level
 * migrator's guarantees in isolation.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { generateProject } from '../../src/codegen/index.js';
import { migrateFlatToSplit } from '../../src/codegen/migrate/flat-to-split.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import { readHashes } from '../../src/codegen/hashes.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-mig-'));
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

describe('generateProject — flat → split migration', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('moves flat files into {name}-cli/ when powerhouse flips on', async () => {
    // Create flat.
    const flat = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec: flat });
    expect(await exists(path.join(tmp, 'src/cli.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli'))).toBe(false);

    // Flip Powerhouse on.
    const split = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const result = await generateProject({
      targetDir: tmp,
      spec: split,
      force: true, // bypass git-dirty guard (tmp is not a git repo; force for safety)
    });

    expect(result.migrated).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli/src/cli.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli/package.json'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-app/README.md'))).toBe(true);
    // Root gets its own package.json in split layout.
    expect(await exists(path.join(tmp, 'package.json'))).toBe(true);
    // Old flat location is gone.
    expect(await exists(path.join(tmp, 'src/cli.ts'))).toBe(false);
  });

  it('rekeys stored hashes under {name}-cli/ after migration', async () => {
    const flat = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec: flat });
    const before = await readHashes(tmp);
    expect(Object.keys(before)).toContain('src/cli.ts');

    const split = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await generateProject({ targetDir: tmp, spec: split, force: true });

    const after = await readHashes(tmp);
    expect(Object.keys(after)).toContain('foo-cli/src/cli.ts');
    expect(Object.keys(after)).not.toContain('src/cli.ts');
  });

  it('refuses to migrate a dirty git repo without --force', async () => {
    // Initialise a git repo at tmp.
    spawnSync('git', ['init', '-q'], { cwd: tmp });
    spawnSync('git', ['config', 'user.email', 'test@test'], { cwd: tmp });
    spawnSync('git', ['config', 'user.name', 'test'], { cwd: tmp });
    spawnSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: tmp });

    const flat = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    await generateProject({ targetDir: tmp, spec: flat });

    // Commit the generated tree.
    spawnSync('git', ['add', '-A'], { cwd: tmp });
    spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: tmp });

    // Make a dirty change.
    await fs.writeFile(path.join(tmp, 'src/cli.ts'), '// dirty\n', 'utf8');

    const split = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    await expect(
      generateProject({ targetDir: tmp, spec: split }),
    ).rejects.toThrow(/uncommitted/);
  });

  it('migrateFlatToSplit leaves node_modules behind and warns', async () => {
    // Seed a fake flat project so migration has something to move.
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src/cli.ts'), '// tpl\n', 'utf8');
    await fs.writeFile(path.join(tmp, 'package.json'), '{}', 'utf8');
    await fs.mkdir(path.join(tmp, 'node_modules'), { recursive: true });
    await fs.writeFile(
      path.join(tmp, 'node_modules/marker'),
      'dont-move-me',
      'utf8',
    );

    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const warnings: string[] = [];
    const result = await migrateFlatToSplit({
      targetDir: tmp,
      spec,
      force: true,
      onWarn: (m) => warnings.push(m),
    });

    // node_modules stays at the root.
    expect(await exists(path.join(tmp, 'node_modules/marker'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli/node_modules'))).toBe(false);
    // src got moved.
    expect(await exists(path.join(tmp, 'foo-cli/src/cli.ts'))).toBe(true);
    expect(warnings.some((w) => /node_modules/.test(w))).toBe(true);
    expect(result.movedEntries).toContain('src');
    expect(result.movedEntries).not.toContain('node_modules');
  });
});
