import { describe, it, expect } from '@jest/globals';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'src', 'cli.ts');
const TSX = join(__dirname, '..', 'node_modules', '.bin', 'tsx');

async function run(...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return exec(TSX, [CLI_PATH, ...args]);
}

async function runExpectFail(...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    await exec(TSX, [CLI_PATH, ...args]);
    throw new Error('Expected command to fail');
  } catch (err: any) {
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', code: err.code ?? 1 };
  }
}

describe('hello CLI (e2e)', () => {
  it('greets by name', async () => {
    const { stdout } = await run('greet', '--name', 'Alice');
    expect(stdout.trim()).toBe('Hello, Alice!');
  });

  it('greets loudly', async () => {
    const { stdout } = await run('greet', '--name', 'Alice', '--loud');
    expect(stdout.trim()).toBe('HELLO, ALICE!');
  });

  it('fails with usage help when --name is missing', async () => {
    const { stderr, code } = await runExpectFail('greet');
    expect(code).not.toBe(0);
    expect(stderr).toContain('name');
  });

  it('shows top-level help', async () => {
    const { stdout } = await run('--help');
    expect(stdout).toContain('hello');
    expect(stdout).toContain('greet');
    expect(stdout).toContain('Greet someone by name');
  });

  it('shows command-level help', async () => {
    const { stdout } = await run('greet', '--help');
    expect(stdout).toContain('--name');
    expect(stdout).toContain('--loud');
    expect(stdout).toContain('Name of the person to greet');
  });

  it('fails on unknown command', async () => {
    const { stderr, code } = await runExpectFail('nonexistent');
    expect(code).not.toBe(0);
  });
});
