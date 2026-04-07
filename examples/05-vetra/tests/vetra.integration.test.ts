/**
 * E2E tests for the init command.
 * Requires `ph` (Powerhouse CLI) to be installed and on PATH.
 * Run with: NODE_OPTIONS='--experimental-vm-modules' jest tests/vetra.integration.test.ts
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const hasPh = (() => {
  try {
    execFileSync('ph', ['--version'], { stdio: 'pipe', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
})();

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-vetra-e2e-'));
}

// Skip the entire suite if `ph` is not available
const describeE2E = hasPh ? describe : describe.skip;

describeE2E('E2E — init command (requires ph CLI)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a new project with package.json and powerhouse.config.json', async () => {
    const { cli } = await import('../src/cli.js');
    const output: string[] = [];

    await cli.run(['node', 'svc', 'init', '--name', 'test-project'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    const projectPath = path.join(tmpDir, 'test-project');
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'powerhouse.config.json'))).toBe(true);
    expect(output.some((o) => o.includes('initialized'))).toBe(true);
  }, 300_000);

  it('is idempotent — succeeds if project already exists', async () => {
    const { cli } = await import('../src/cli.js');

    // First init
    await cli.run(['node', 'svc', 'init', '--name', 'existing'], {
      stdout: () => {},
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    // Second init
    const output: string[] = [];
    await cli.run(['node', 'svc', 'init', '--name', 'existing'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    expect(output.some((o) => o.includes('already exists'))).toBe(true);
  }, 300_000);

  it('validates project name — rejects invalid characters', async () => {
    const { cli } = await import('../src/cli.js');
    const errors: string[] = [];

    await cli.run(['node', 'svc', 'init', '--name', 'bad name!'], {
      stdout: () => {},
      stderr: (msg) => errors.push(msg),
      exit: () => {},
      workdir: tmpDir,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
