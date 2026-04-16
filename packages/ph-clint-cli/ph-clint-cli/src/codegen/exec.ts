/**
 * Small helpers for invoking external commands during code generation.
 *
 * We deliberately keep this separate from `ph-clint`'s process manager:
 * here we need synchronous-feeling prompt-forwarding (stdio inherited) so
 * the user can respond to interactive prompts from `ph init` or from a
 * package manager.
 */
import { spawn } from 'node:child_process';

export interface RunCommandOptions {
  cwd: string;
  /** Override stdio; default `'inherit'`. Pass `'ignore'` for tests. */
  stdio?: 'inherit' | 'ignore';
  /** Extra env vars (merged with process.env). */
  env?: Record<string, string>;
}

export interface RunCommandResult {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number;
}

/**
 * Run `command args` in `cwd`, forwarding stdio by default. Resolves to
 * the exit code. Does NOT throw on non-zero — callers decide how to react.
 */
export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions,
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.stdio ?? 'inherit',
      env: options.env ? { ...process.env, ...options.env } : process.env,
    });
    child.once('error', reject);
    child.once('close', (code) => {
      resolve({
        command,
        args,
        cwd: options.cwd,
        exitCode: code ?? 0,
      });
    });
  });
}

/** Returns true if `command` is on PATH. */
export async function hasCommandOnPath(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'where' : 'which', [command], {
      stdio: 'ignore',
    });
    child.once('error', () => resolve(false));
    child.once('close', (code) => resolve(code === 0));
  });
}
