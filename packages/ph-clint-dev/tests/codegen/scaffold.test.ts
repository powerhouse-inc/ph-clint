/**
 * Tests for the scaffold helpers (`runPhInit`, `runPnpmInstall`).
 *
 * We can't assume `ph` or `pnpm` exist in a hermetic CI env, so the tests
 * exercise the graceful-degradation path (`hasCommandOnPath` returning
 * false via a deliberately-bogus binName). The happy path is covered by
 * the init command's integration test in a separate slice.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runPhInit, runPnpmInstall } from '../../src/codegen/scaffold.js';
import { getPhVersion } from '../../src/codegen/exec.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-scaf-'));
}

async function rmRf(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

// A binary name that cannot exist on any PATH — gives us a deterministic
// "not installed" result.
const BOGUS_BIN = '__ph_clint_definitely_not_a_binary__';

describe('getPhVersion', () => {
  it('returns undefined for a non-existent binary', () => {
    expect(getPhVersion(BOGUS_BIN)).toBeUndefined();
  });
});

describe('runPhInit', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('skips gracefully when the binary is not on PATH', async () => {
    const appDir = path.join(tmp, 'foo-app');
    await fs.mkdir(appDir, { recursive: true });
    await fs.writeFile(path.join(appDir, '.gitkeep'), '', 'utf8');

    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const logs: string[] = [];
    const result = await runPhInit({
      targetDir: tmp,
      appDir,
      spec,
      binName: BOGUS_BIN,
      log: (m) => logs.push(m),
      runProcess: async () => ({ success: true, output: '' }),
    });

    expect(result.ran).toBe(false);
    expect(result.reason).toBe('ph-not-on-path');
    expect(logs.some((l) => /not on PATH/.test(l))).toBe(true);
    // Placeholder is still in place since we never ran ph init.
    expect(
      await fs
        .access(path.join(appDir, '.gitkeep'))
        .then(() => true)
        .catch(() => false),
    ).toBe(true);
  });
});

describe('runPnpmInstall', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('skips gracefully when the binary is not on PATH', async () => {
    const logs: string[] = [];
    const result = await runPnpmInstall({
      dirs: [tmp],
      binName: BOGUS_BIN,
      log: (m) => logs.push(m),
      runProcess: async () => ({ success: true, output: '' }),
    });
    expect(result.ran).toEqual([]);
    expect(result.skipped).toEqual([tmp]);
    expect(result.reason).toBe('pnpm-not-on-path');
  });
});
