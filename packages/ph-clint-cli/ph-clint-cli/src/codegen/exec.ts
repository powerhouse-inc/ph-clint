/**
 * Small helpers for invoking external commands during code generation.
 */
import { spawn } from 'node:child_process';

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
