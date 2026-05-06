/**
 * Small helpers for invoking external commands during code generation.
 */
import { spawn, execFileSync } from 'node:child_process';

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

/**
 * Detect the installed `ph` CLI version by parsing `ph --version` output.
 * Returns the version string (e.g. '6.0.0-dev.194') or undefined if
 * detection fails.
 */
export function getPhVersion(binName: string): string | undefined {
  try {
    const output = execFileSync(binName, ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
    });
    const match = output.match(/PH CMD version:\s*(\S+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
}
