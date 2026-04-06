import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'src', 'cli.ts');
const TSX = join(__dirname, '..', 'node_modules', '.bin', 'tsx');

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'tasks-e2e-'));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

async function run(...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return exec(TSX, [CLI_PATH, ...args], { cwd: workDir });
}

async function runExpectFail(...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    await exec(TSX, [CLI_PATH, ...args], { cwd: workDir });
    throw new Error('Expected command to fail');
  } catch (err: any) {
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', code: err.code ?? 1 };
  }
}

describe('tasks CLI (e2e)', () => {
  describe('add command', () => {
    it('adds a task', async () => {
      const { stdout } = await run('add', '--title', 'Buy milk');
      expect(stdout).toContain('Added');
      expect(stdout).toContain('Buy milk');
      expect(stdout).toContain('medium');
    });

    it('adds a task with explicit priority', async () => {
      const { stdout } = await run('add', '--title', 'Urgent fix', '--priority', 'high');
      expect(stdout).toContain('high');
    });

    it('adds a task with due date', async () => {
      const { stdout } = await run('add', '--title', 'Report', '--due', '2026-12-31');
      expect(stdout).toContain('Report');
    });

    it('fails when --title is missing', async () => {
      const { code } = await runExpectFail('add');
      expect(code).not.toBe(0);
    });
  });

  describe('list command', () => {
    it('shows empty state when no tasks exist', async () => {
      const { stdout } = await run('list');
      expect(stdout).toContain('No tasks found');
    });

    it('lists added tasks', async () => {
      await run('add', '--title', 'Task A');
      await run('add', '--title', 'Task B');
      const { stdout } = await run('list');
      expect(stdout).toContain('Task A');
      expect(stdout).toContain('Task B');
    });

    it('filters by done status', async () => {
      await run('add', '--title', 'Open task');
      await run('add', '--title', 'Done task');
      await run('done', '--title', 'Done');

      const { stdout: openList } = await run('list', '--filter', 'open');
      expect(openList).toContain('Open task');
      expect(openList).not.toContain('Done task');

      const { stdout: doneList } = await run('list', '--filter', 'done');
      expect(doneList).toContain('Done task');
      expect(doneList).not.toContain('Open task');

      const { stdout: allList } = await run('list', '--filter', 'all');
      expect(allList).toContain('Open task');
      expect(allList).toContain('Done task');
    });
  });

  describe('done command', () => {
    it('marks a task as completed', async () => {
      await run('add', '--title', 'Write tests');
      const { stdout } = await run('done', '--title', 'tests');
      expect(stdout).toContain('Completed');
      expect(stdout).toContain('Write tests');
    });

    it('reports when no match is found', async () => {
      const { stdout } = await run('done', '--title', 'nonexistent');
      expect(stdout).toContain('No open task matching');
    });
  });

  describe('remove command', () => {
    it('removes a task', async () => {
      await run('add', '--title', 'Temporary task');
      const { stdout } = await run('remove', '--title', 'Temporary');
      expect(stdout).toContain('Removed');

      const { stdout: listOut } = await run('list', '--filter', 'all');
      expect(listOut).toContain('No tasks found');
    });

    it('reports when no match is found', async () => {
      const { stdout } = await run('remove', '--title', 'ghost');
      expect(stdout).toContain('No task matching');
    });
  });

  describe('workspace persistence', () => {
    it('persists tasks across invocations', async () => {
      await run('add', '--title', 'First');
      await run('add', '--title', 'Second');
      const { stdout } = await run('list');
      expect(stdout).toContain('First');
      expect(stdout).toContain('Second');
    });

    it('reflects done state in subsequent list', async () => {
      await run('add', '--title', 'Complete me');
      await run('done', '--title', 'Complete');
      const { stdout } = await run('list', '--filter', 'done');
      expect(stdout).toContain('Complete me');
    });
  });

  describe('env var config override', () => {
    it('uses TASKS_DEFAULT_PRIORITY to override default', async () => {
      const { stdout } = await exec(TSX, [CLI_PATH, 'add', '--title', 'Env task'], {
        cwd: workDir,
        env: { ...process.env, TASKS_DEFAULT_PRIORITY: 'high' },
      });
      expect(stdout).toContain('high');
    });
  });

  describe('help output', () => {
    it('shows top-level help', async () => {
      const { stdout } = await run('--help');
      expect(stdout).toContain('tasks');
      expect(stdout).toContain('add');
      expect(stdout).toContain('list');
      expect(stdout).toContain('done');
      expect(stdout).toContain('remove');
    });

    it('shows command-level help for add', async () => {
      const { stdout } = await run('add', '--help');
      expect(stdout).toContain('--title');
      expect(stdout).toContain('--priority');
      expect(stdout).toContain('--due');
    });
  });

  describe('error handling', () => {
    it('fails on unknown command', async () => {
      const { code } = await runExpectFail('nonexistent');
      expect(code).not.toBe(0);
    });

    it('fails on unknown flag', async () => {
      const { code } = await runExpectFail('add', '--title', 'x', '--badflag');
      expect(code).not.toBe(0);
    });
  });
});
