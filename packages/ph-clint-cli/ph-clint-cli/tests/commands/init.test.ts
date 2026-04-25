/**
 * Tests for the init command:
 *  - buildSpec pure logic (name parsing, feature forcing)
 *  - execute flow with skip flags (no subprocess spawning in tests)
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSpec, init } from '../../src/commands/clint-project-init.js';

describe('buildSpec', () => {
  it('splits a scoped name into { scope, name }', () => {
    const spec = buildSpec({
      name: '@acme/foo',
      enablePowerhouse: false,
      enableMastra: false,
      enableRoutine: false,
      force: false,
    });
    expect(spec.name).toBe('foo');
    expect(spec.scope).toBe('acme');
  });

  it('passes a bare name through unchanged', () => {
    const spec = buildSpec({
      name: 'foo',
      enablePowerhouse: false,
      enableMastra: false,
      enableRoutine: false,
      force: false,
    });
    expect(spec.name).toBe('foo');
    expect(spec.scope).toBeUndefined();
  });

  it('forces routine on when mastra is enabled', () => {
    const spec = buildSpec({
      name: 'foo',
      enablePowerhouse: false,
      enableMastra: true,
      enableRoutine: false,
      force: false,
    });
    expect(spec.features.mastra.enabled).toBe(true);
    expect(spec.features.routine.enabled).toBe(true);
  });

  it('populates agent defaults when mastra is enabled', () => {
    const spec = buildSpec({
      name: 'foo',
      enablePowerhouse: false,
      enableMastra: true,
      enableRoutine: false,
      force: false,
    });
    expect(spec.features.mastra.agentId).toBe('foo-agent');
    expect(spec.features.mastra.agentName).toBe('Foo Agent');
    expect(spec.features.mastra.models).toEqual([
      { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
    ]);
    expect(spec.features.mastra.profiles).toEqual([
      { id: 'base', title: 'Base', content: 'You are a helpful assistant.' },
    ]);
  });

  it('leaves agent fields null/empty when mastra is disabled', () => {
    const spec = buildSpec({
      name: 'foo',
      enablePowerhouse: false,
      enableMastra: false,
      enableRoutine: false,
      force: false,
    });
    expect(spec.features.mastra.agentId).toBeNull();
    expect(spec.features.mastra.agentName).toBeNull();
    expect(spec.features.mastra.models).toEqual([]);
    expect(spec.features.mastra.profiles).toEqual([]);
  });

  it('preserves routine off when mastra is off', () => {
    const spec = buildSpec({
      name: 'foo',
      enablePowerhouse: false,
      enableMastra: false,
      enableRoutine: false,
      force: false,
    });
    expect(spec.features.routine.enabled).toBe(false);
  });

  it('rejects an invalid project name', () => {
    expect(() =>
      buildSpec({
        name: 'NotValid',
        enablePowerhouse: false,
        enableMastra: false,
        enableRoutine: false,
        force: false,
      }),
    ).toThrow();
  });

  it('rejects an invalid scoped name', () => {
    expect(() =>
      buildSpec({
        name: '@Acme/Foo',
        enablePowerhouse: false,
        enableMastra: false,
        enableRoutine: false,
        force: false,
      }),
    ).toThrow();
  });

  it('stores description when provided', () => {
    const spec = buildSpec({
      name: 'foo',
      description: 'a test project',
      enablePowerhouse: false,
      enableMastra: false,
      enableRoutine: false,
      force: false,
    });
    expect(spec.description).toBe('a test project');
  });
});

describe('init.execute', () => {
  let tmp: string;
  let workdir: string;

  async function mkTmpDir(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'ph-clint-init-'));
  }

  function makeContext(stdout: string[]): {
    workdir: string;
    workspace: Record<string, unknown>;
    config: Record<string, unknown>;
    stdout: (t: string) => void;
  } {
    return {
      workdir,
      workspace: {},
      config: {},
      stdout: (t: string) => {
        stdout.push(t);
      },
    };
  }

  beforeEach(async () => {
    tmp = await mkTmpDir();
    workdir = tmp;
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('scaffolds a flat project when skip flags are set (no subprocesses)', async () => {
    const out: string[] = [];
    const result = await init.execute(
      {
        dir: '.',
        name: 'foo',
        description: '',
        enablePowerhouse: false,
        enableMastra: false,
        enableRoutine: false,
        force: false,
        skipPhInit: true,
        skipInstall: true,
      },
      // @ts-expect-error — minimal context is all init consumes.
      makeContext(out),
    );
    // Files exist on disk.
    const cliTs = path.join(tmp, 'src/cli.ts');
    await expect(fs.access(cliTs)).resolves.toBeUndefined();
    expect(typeof result.text).toBe('string');
    expect(result.text).toContain('Next steps');
  });

  it('refuses to scaffold into a non-empty dir without --force', async () => {
    await fs.writeFile(path.join(tmp, 'existing.txt'), 'x', 'utf8');
    const out: string[] = [];
    const result = await init.execute(
      {
        dir: '.',
        name: 'foo',
        description: '',
        enablePowerhouse: false,
        enableMastra: false,
        enableRoutine: false,
        force: false,
        skipPhInit: true,
        skipInstall: true,
      },
      // @ts-expect-error — minimal context.
      makeContext(out),
    );
    expect(result.text).toMatch(/not empty/);
  });
});
