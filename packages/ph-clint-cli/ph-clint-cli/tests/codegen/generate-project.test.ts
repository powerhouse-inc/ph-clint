/**
 * End-to-end test for `generateProject` — walks every feature-toggle combo
 * (2³ = 8) against a tmpdir and asserts the layout + key file contents.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject } from '../../src/codegen/index.js';
import {
  clintProjectSpecSchema,
  type ClintProjectSpecInput,
} from '../../src/spec/types.js';
import { readProjectSpec } from '../../src/spec/file.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-gen-'));
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

describe('generateProject — create mode', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkTmpDir();
  });

  afterEach(async () => {
    await rmRf(tmp);
  });

  it('refuses to write into a non-empty directory', async () => {
    await fs.writeFile(path.join(tmp, 'existing.txt'), 'x');
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    await expect(
      generateProject({ targetDir: tmp, spec }),
    ).rejects.toThrow(/not empty/);
  });

  it('writes a no-features flat project with the expected files', async () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const result = await generateProject({ targetDir: tmp, spec });

    expect(await exists(path.join(tmp, 'package.json'))).toBe(true);
    expect(await exists(path.join(tmp, 'src/cli.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'src/config.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'src/main.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'README.md'))).toBe(true);
    // No split-layout artifacts.
    expect(await exists(path.join(tmp, 'foo-cli'))).toBe(false);
    expect(await exists(path.join(tmp, 'foo-app'))).toBe(false);
    // Agent file omitted when Mastra is off.
    expect(await exists(path.join(tmp, 'src/agents/agent.ts'))).toBe(false);

    expect(result.cliDir).toBe(tmp);
    expect(result.appDir).toBeNull();

    // Spec persisted.
    const loaded = await readProjectSpec(tmp);
    expect(loaded?.name).toBe('foo');
  });

  it('writes a split-layout project when Powerhouse is enabled', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const result = await generateProject({ targetDir: tmp, spec });

    expect(await exists(path.join(tmp, 'package.json'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli/package.json'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-cli/src/cli.ts'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-app/.gitkeep'))).toBe(true);
    expect(await exists(path.join(tmp, 'foo-app/README.md'))).toBe(true);
    // Flat layout has no src/ at the root.
    expect(await exists(path.join(tmp, 'src'))).toBe(false);

    expect(result.cliDir).toBe(path.join(tmp, 'foo-cli'));
    expect(result.appDir).toBe(path.join(tmp, 'foo-app'));
  });

  it('emits an agent file when Mastra is enabled', async () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { mastra: { enabled: true } },
    });
    await generateProject({ targetDir: tmp, spec });
    expect(await exists(path.join(tmp, 'src/agents/agent.ts'))).toBe(true);
    const mastraIndex = await fs.readFile(
      path.join(tmp, 'src/mastra/index.ts'),
      'utf8',
    );
    // Mastra on still emits a placeholder re-export until a real Mastra
    // Agent is wired (the demo createAgent is just an AgentProvider shim).
    expect(mastraIndex).toContain('export {};');
  });

  it('covers all 8 feature-toggle combinations without crashing', async () => {
    const combos: ClintProjectSpecInput[] = [];
    for (const p of ['Disabled', 'Connect'] as const) {
      for (const m of [false, true]) {
        for (const r of [false, true]) {
          combos.push({
            name: 'proj',
            features: {
              powerhouse: p,
              mastra: { enabled: m },
              routine: { enabled: r },
            },
          });
        }
      }
    }

    for (const input of combos) {
      const dir = await mkTmpDir();
      try {
        const spec = clintProjectSpecSchema.parse(input);
        const result = await generateProject({ targetDir: dir, spec });
        // Every combo must produce at least a cli.ts and a package.json.
        const cliTs = path.join(result.cliDir, 'src/cli.ts');
        const pkgJson = path.join(result.cliDir, 'package.json');
        expect(await exists(cliTs)).toBe(true);
        expect(await exists(pkgJson)).toBe(true);
      } finally {
        await rmRf(dir);
      }
    }
  });
});
