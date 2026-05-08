/**
 * Tests for post-generation actions: collectPostGenActions + runPostGenActions.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  collectPostGenActions,
  runPostGenActions,
  type PostGenAction,
  type PostGenActionKind,
} from '../../src/codegen/actions.js';
import type { GenerateProjectResult, GeneratedFile } from '../../src/codegen/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(rel: string, base = '/project'): GeneratedFile {
  return { relativePath: rel, absolutePath: path.join(base, rel) };
}

function makeResult(
  overrides: Partial<GenerateProjectResult> & { files?: GeneratedFile[] },
): GenerateProjectResult {
  return {
    mode: 'update',
    files: [],
    skipped: [],
    deleted: [],
    migrated: false,
    cliDir: '/project',
    appDir: null,
    pendingActions: [],
    ...overrides,
  };
}

function flatSpec() {
  return clintProjectSpecSchema.parse({ name: 'foo-cli' });
}

function splitSpec() {
  return clintProjectSpecSchema.parse({
    name: 'foo-cli',
    features: { powerhouse: 'Connect' },
  });
}

function kinds(actions: PostGenAction[]): PostGenActionKind[] {
  return actions.map((a) => a.kind);
}

/**
 * Create a temp directory tree that simulates an installed project.
 * Creates `node_modules/` in the specified subdirectories so the
 * "needs install" check doesn't trigger.
 */
async function createInstalledProject(
  layout: 'flat' | { cliFolder: string; appFolder: string },
): Promise<{ tmpDir: string; cliDir: string; appDir: string | null; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'actions-test-'));
  if (layout === 'flat') {
    await fs.mkdir(path.join(tmpDir, 'node_modules'), { recursive: true });
    return {
      tmpDir,
      cliDir: tmpDir,
      appDir: null,
      cleanup: () => fs.rm(tmpDir, { recursive: true, force: true }),
    };
  }
  const cliDir = path.join(tmpDir, layout.cliFolder);
  const appDir = path.join(tmpDir, layout.appFolder);
  // Workspace install creates node_modules at the project root, not per-member.
  await fs.mkdir(path.join(tmpDir, 'node_modules'), { recursive: true });
  await fs.mkdir(cliDir, { recursive: true });
  await fs.mkdir(appDir, { recursive: true });
  return {
    tmpDir,
    cliDir,
    appDir,
    cleanup: () => fs.rm(tmpDir, { recursive: true, force: true }),
  };
}

// ---------------------------------------------------------------------------
// collectPostGenActions
// ---------------------------------------------------------------------------

describe('collectPostGenActions', () => {
  it('returns empty array when no files changed', async () => {
    const result = makeResult({ files: [] });
    const actions = await collectPostGenActions(result, flatSpec());
    expect(actions).toEqual([]);
  });

  it('flat layout, package.json changed → cli-install + cli-build', async () => {
    const proj = await createInstalledProject('flat');
    try {
      const result = makeResult({
        cliDir: proj.cliDir,
        files: [makeFile('package.json', proj.cliDir)],
      });
      const actions = await collectPostGenActions(result, flatSpec());
      expect(kinds(actions)).toEqual(['cli-install', 'cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('flat layout, only .ts source changed → cli-build', async () => {
    const proj = await createInstalledProject('flat');
    try {
      const result = makeResult({
        cliDir: proj.cliDir,
        files: [makeFile('src/cli.ts', proj.cliDir)],
      });
      const actions = await collectPostGenActions(result, flatSpec());
      expect(kinds(actions)).toEqual(['cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('flat layout, only agent profile .md changed → cli-build', async () => {
    const proj = await createInstalledProject('flat');
    try {
      const result = makeResult({
        cliDir: proj.cliDir,
        files: [makeFile('prompts/agent-profiles/pirate.md', proj.cliDir)],
      });
      const actions = await collectPostGenActions(result, flatSpec());
      expect(kinds(actions)).toEqual(['cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('flat layout, .ts changed but node_modules missing → cli-install + cli-build', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'actions-test-'));
    try {
      // No node_modules created — simulates skipInstall
      const result = makeResult({
        cliDir: tmpDir,
        files: [makeFile('src/cli.ts', tmpDir)],
      });
      const actions = await collectPostGenActions(result, flatSpec());
      expect(kinds(actions)).toEqual(['cli-install', 'cli-build']);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('split layout, app package.json changed → workspace-install + app-build + cli-build', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [makeFile('foo-app/package.json', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual([
        'workspace-install',
        'app-build',
        'cli-build',
      ]);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, ph-init needed (gitkeep written, no pkg.json on disk) → full chain', async () => {
    // appDir points to a non-existent path → no package.json on disk → ph-init fires
    const spec = splitSpec();
    const result = makeResult({
      cliDir: '/project/foo-cli',
      appDir: '/nonexistent/foo-app',
      files: [
        makeFile('foo-app/.gitkeep'),
        makeFile('foo-cli/package.json'),
        makeFile('foo-cli/src/cli.ts'),
      ],
    });
    const actions = await collectPostGenActions(result, spec);
    expect(kinds(actions)).toEqual([
      'ph-init',
      'workspace-install',
      'app-build',
      'cli-build',
    ]);
  });

  it('split layout, gitkeep written but app already initialized → skips ph-init', async () => {
    // appDir points to a real temp directory with a package.json + node_modules
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    await fs.writeFile(path.join(proj.appDir!, 'package.json'), '{}');

    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [
          makeFile('foo-app/.gitkeep', proj.tmpDir),
          makeFile('foo-cli/package.json', proj.tmpDir),
          makeFile('foo-cli/src/cli.ts', proj.tmpDir),
        ],
      });
      const actions = await collectPostGenActions(result, spec);
      // ph-init must NOT appear — app is already initialized.
      // CLI pkg.json change → workspace-install + cli-build (no app-build).
      expect(kinds(actions)).toEqual(['workspace-install', 'cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, only app .ts changed → app-build + cli-build (no install if node_modules present at root)', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [makeFile('foo-app/index.ts', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['app-build', 'cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, app .ts changed but root node_modules missing → workspace-install + app-build + cli-build', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'actions-test-'));
    const cliDir = path.join(tmpDir, 'foo-cli');
    const appDir = path.join(tmpDir, 'foo-app');
    // No node_modules at the project root — workspace-install must fire.
    await fs.mkdir(cliDir, { recursive: true });
    await fs.mkdir(appDir, { recursive: true });

    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir,
        appDir,
        files: [makeFile('foo-app/index.ts', tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual([
        'workspace-install',
        'app-build',
        'cli-build',
      ]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('migration occurred → workspace-install + app-build + cli-build', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        migrated: true,
        files: [makeFile('foo-cli/src/cli.ts', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual([
        'workspace-install',
        'app-build',
        'cli-build',
      ]);
    } finally {
      await proj.cleanup();
    }
  });

  it('externalSkills present → skills-sync appended', async () => {
    const proj = await createInstalledProject('flat');
    try {
      const spec = clintProjectSpecSchema.parse({
        name: 'foo-cli',
        externalSkills: [
          { id: 'sk1', name: 'my-skill', githubUrl: 'https://github.com/x/y' },
        ],
      });
      const result = makeResult({
        cliDir: proj.cliDir,
        files: [makeFile('src/cli.ts', proj.cliDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['cli-build', 'skills-sync']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, CLI package.json changed → workspace-install + cli-build (no app-build)', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [makeFile('foo-cli/package.json', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['workspace-install', 'cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, only CLI .ts files changed → cli-build', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [makeFile('foo-cli/src/framework.gen.ts', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, only agent profile .md changed → cli-build', async () => {
    const proj = await createInstalledProject({ cliFolder: 'foo-cli', appFolder: 'foo-app' });
    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir: proj.cliDir,
        appDir: proj.appDir,
        files: [makeFile('foo-cli/prompts/agent-profiles/base.md', proj.tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['cli-build']);
    } finally {
      await proj.cleanup();
    }
  });

  it('split layout, CLI .ts changed but root node_modules missing → workspace-install + cli-build', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'actions-test-'));
    const cliDir = path.join(tmpDir, 'foo-cli');
    const appDir = path.join(tmpDir, 'foo-app');
    // No project-root node_modules — workspace-install must fire.
    await fs.mkdir(cliDir, { recursive: true });
    await fs.mkdir(appDir, { recursive: true });

    try {
      const spec = splitSpec();
      const result = makeResult({
        cliDir,
        appDir,
        files: [makeFile('foo-cli/src/framework.gen.ts', tmpDir)],
      });
      const actions = await collectPostGenActions(result, spec);
      expect(kinds(actions)).toEqual(['workspace-install', 'cli-build']);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// runPostGenActions
// ---------------------------------------------------------------------------

describe('runPostGenActions', () => {
  it('returns empty array when no actions', async () => {
    const logs: string[] = [];
    const results = await runPostGenActions([], {
      log: (m) => logs.push(m),
      runProcess: async () => ({ success: true, output: '' }),
    });
    expect(results).toEqual([]);
    expect(logs).toEqual([]);
  });

  it('executes actions in order and records calls', async () => {
    const calls: string[] = [];
    const fakeRunProcess = async (cmd: string, opts?: { cwd?: string }) => {
      calls.push(`${cmd} @ ${opts?.cwd ?? '?'}`);
      return { success: true, output: '' };
    };

    const actions: PostGenAction[] = [
      { kind: 'cli-install', dir: '/project' },
      { kind: 'cli-build', dir: '/project' },
    ];

    const logs: string[] = [];
    const results = await runPostGenActions(actions, {
      log: (m) => logs.push(m),
      runProcess: fakeRunProcess,
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('success');
    expect(calls).toEqual([
      'pnpm install --no-frozen-lockfile @ /project',
      'pnpm build @ /project',
    ]);
    // Summary line should mention success
    expect(logs.some((l) => /completed successfully/.test(l))).toBe(true);
  });

  it('skips actions in the skip set', async () => {
    const calls: string[] = [];
    const fakeRunProcess = async (cmd: string, opts?: { cwd?: string }) => {
      calls.push(`${cmd} @ ${opts?.cwd ?? '?'}`);
      return { success: true, output: '' };
    };

    const actions: PostGenAction[] = [
      { kind: 'cli-install', dir: '/project' },
      { kind: 'cli-build', dir: '/project' },
    ];

    const logs: string[] = [];
    const results = await runPostGenActions(actions, {
      log: (m) => logs.push(m),
      runProcess: fakeRunProcess,
      skip: new Set<PostGenActionKind>(['cli-install']),
    });

    // Both should be filtered: cli-install is skipped, cli-build is skipped
    // because its corresponding install is skipped.
    expect(results).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('cascades failure to downstream dependencies', async () => {
    let callCount = 0;
    const fakeRunProcess = async (cmd: string) => {
      callCount++;
      // First call (install) fails
      if (cmd.includes('install')) {
        return { success: false, output: 'ERR' };
      }
      return { success: true, output: '' };
    };

    const actions: PostGenAction[] = [
      { kind: 'workspace-install', dir: '/project' },
      { kind: 'app-build', dir: '/project/foo-app' },
      { kind: 'cli-build', dir: '/project/foo-cli' },
    ];

    const logs: string[] = [];
    const results = await runPostGenActions(actions, {
      log: (m) => logs.push(m),
      runProcess: fakeRunProcess,
    });

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('failed');
    expect(results[1].status).toBe('skipped');
    expect(results[1].reason).toBe('dependency failed');
    expect(results[2].status).toBe('skipped');
    expect(results[2].reason).toBe('dependency failed');
    // Only the install was actually called
    expect(callCount).toBe(1);
    // Summary mentions failure
    expect(logs.some((l) => /1 failed/.test(l))).toBe(true);
  });

  it('skills-sync still runs even when build chain fails', async () => {
    const calls: string[] = [];
    const fakeRunProcess = async (cmd: string) => {
      calls.push(cmd);
      if (cmd.includes('install')) {
        return { success: false, output: 'ERR' };
      }
      return { success: true, output: '' };
    };

    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      externalSkills: [
        { id: 'sk1', name: 'my-skill', githubUrl: 'https://github.com/x/y' },
      ],
    });

    const actions: PostGenAction[] = [
      { kind: 'cli-install', dir: '/project' },
      { kind: 'cli-build', dir: '/project' },
      {
        kind: 'skills-sync',
        targetDir: '/project',
        desired: spec.externalSkills,
      },
    ];

    const logs: string[] = [];
    const results = await runPostGenActions(actions, {
      log: (m) => logs.push(m),
      runProcess: fakeRunProcess,
    });

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('failed'); // cli-install
    expect(results[1].status).toBe('skipped'); // cli-build (dep failed)
    // skills-sync is independent — it runs (and may succeed or fail depending
    // on git clone, but it's attempted)
    expect(results[2].action.kind).toBe('skills-sync');
    // It was attempted, not skipped due to dependency
    expect(results[2].status).not.toBe('skipped');
  });

  it('captures timing for each action', async () => {
    const fakeRunProcess = async () => {
      return { success: true, output: '' };
    };

    const actions: PostGenAction[] = [
      { kind: 'cli-install', dir: '/project' },
    ];

    const results = await runPostGenActions(actions, {
      log: () => {},
      runProcess: fakeRunProcess,
    });

    expect(results).toHaveLength(1);
    expect(results[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
