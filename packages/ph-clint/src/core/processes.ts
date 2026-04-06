import { spawn } from 'node:child_process';
import type { ProcessHandle, ProcessManager } from './types.js';

/**
 * Create a process manager for running bounded shell commands.
 * Inspired by the agent prototype's CLIExecutor.
 */
export function createProcessManager(): ProcessManager {
  const handles: ProcessHandle[] = [];

  async function run(
    command: string,
    opts?: { label?: string; timeout?: number },
  ): Promise<{ success: boolean; output: string }> {
    const label = opts?.label ?? command;
    const timeout = opts?.timeout ?? 30_000;

    return new Promise((resolve) => {
      const chunks: string[] = [];
      let resolved = false;

      const child = spawn(command, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true, // Create process group for clean kill
      });

      function killProcess() {
        try {
          // Kill the entire process group (negative pid)
          if (child.pid) process.kill(-child.pid, 'SIGTERM');
        } catch {
          // Process may already be dead
        }
      }

      const handle: ProcessHandle = {
        label,
        status: 'running',
        kill() {
          if (handle.status === 'running') {
            killProcess();
          }
        },
      };
      handles.push(handle);

      child.stdout?.on('data', (data: Buffer) => {
        chunks.push(data.toString());
      });
      child.stderr?.on('data', (data: Buffer) => {
        chunks.push(data.toString());
      });

      // Prevent the child from keeping the parent alive if we've already resolved
      child.unref();

      function finish(success: boolean, output: string) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        handle.status = success ? 'succeeded' : 'failed';
        resolve({ success, output });
      }

      const timer = setTimeout(() => {
        killProcess();
        finish(false, chunks.join(''));
      }, timeout);

      child.on('close', (code) => {
        finish(code === 0, chunks.join(''));
      });

      child.on('error', (err) => {
        finish(false, err.message);
      });
    });
  }

  function list(): ProcessHandle[] {
    return [...handles];
  }

  return { run, list };
}
