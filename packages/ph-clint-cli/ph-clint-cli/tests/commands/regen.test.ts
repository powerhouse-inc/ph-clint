/**
 * Integration tests for the `regen` command — wraps generateProject in
 * update mode against an existing project.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { init } from '../../src/commands/clint-project-init.js';
import { regen } from '../../src/commands/clint-project-regen.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-regen-'));
}

function makeContext(
  workdir: string,
  stdout: string[],
): {
  workdir: string;
  workspace: Record<string, unknown>;
  config: Record<string, unknown>;
  stdout: (t: string) => void;
  runProcess: (cmd: string) => Promise<{ success: boolean; output: string }>;
} {
  return {
    workdir,
    workspace: {},
    config: {},
    stdout: (t) => {
      stdout.push(t);
    },
    runProcess: async () => ({ success: true, output: '' }),
  };
}

describe('regen command', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
    // Scaffold a flat project first.
    await init.execute(
      {
        dir: '.',
        name: 'foo',
        description: '',
        enablePowerhouse: false,
        enableMastra: false,
        enableRoutine: false,
        force: false,

        skipInstall: true,
      },
      // @ts-expect-error — minimal context.
      makeContext(tmp, []),
    );
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('errors when no spec exists in the target dir', async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-regen-empty-'));
    try {
      const out: string[] = [];
      const result = await regen.execute(
        { dir: '.', force: false },
        // @ts-expect-error — minimal context.
        makeContext(empty, out),
      );
      expect(result.text).toMatch(/no spec found/);
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });

  it('is a no-op on an unchanged spec', async () => {
    const out: string[] = [];
    const result = await regen.execute(
      { dir: '.', force: false },
      // @ts-expect-error — minimal context.
      makeContext(tmp, out),
    );
    expect(result.data?.files).toEqual([]);
    expect(result.data?.migrated).toBe(false);
  });

  it('surfaces skipped files via stdout when a managed file was edited', async () => {
    // Edit the managed package.json.
    const pkgPath = path.join(tmp, 'package.json');
    const original = await fs.readFile(pkgPath, 'utf8');
    await fs.writeFile(pkgPath, original.replace('foo', 'tampered'), 'utf8');

    // Tweak the spec to trigger a rewrite attempt.
    const specPath = path.join(tmp, '.ph/ph-clint-cli/project-spec.json');
    const spec = JSON.parse(await fs.readFile(specPath, 'utf8')) as {
      description: string;
    };
    spec.description = 'changed';
    await fs.writeFile(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');

    const out: string[] = [];
    const result = await regen.execute(
      { dir: '.', force: false },
      // @ts-expect-error — minimal context.
      makeContext(tmp, out),
    );
    expect(result.data?.skipped).toContain('package.json');
    expect(result.data?.warnings.some((w: string) => /package\.json/.test(w))).toBe(
      true,
    );
    expect(out.some((line) => /package\.json/.test(line))).toBe(true);
  });
});
