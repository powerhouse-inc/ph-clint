import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import type { EventBus, ReadinessPattern, ServiceDefinition, ServiceManager, ServiceStatus } from './types.js';

/**
 * Identity wrapper for service definitions — provides type checking and IDE support.
 */
export function defineService<TConfig = Record<string, unknown>>(
  opts: ServiceDefinition<TConfig>,
): ServiceDefinition<TConfig> {
  return opts;
}

/**
 * Persisted state for a service on disk.
 */
interface ServiceStateFile {
  id: string;
  label: string;
  pid: number;
  status: 'starting' | 'ready' | 'failed';
  endpoints?: Record<string, string>;
  error?: string;
  startedAt: string;
  command: string;
  restartAttempt?: number;
}

export interface ServiceManagerOptions {
  config: Record<string, unknown>;
  servicesDir: string;
  eventBus?: EventBus;
}

function stateFilePath(servicesDir: string, id: string): string {
  return path.join(servicesDir, `${id}.json`);
}

function logFilePath(servicesDir: string, id: string): string {
  return path.join(servicesDir, `${id}.log`);
}

function readStateFile(filePath: string): ServiceStateFile | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ServiceStateFile;
  } catch {
    return null;
  }
}

function writeStateFile(filePath: string, state: ServiceStateFile): void {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function removeStateFile(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Already gone
  }
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a TCP port is free by attempting to bind to it.
 */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Wait for a PID to exit, polling with kill(pid, 0).
 * Returns true if the process exited, false on timeout.
 */
function waitForExit(pid: number, timeout: number, interval = 100): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      if (!isPidAlive(pid)) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

/**
 * Create a ServiceManager for managing long-running detached services.
 */
export function createServiceManager(
  definitions: ServiceDefinition<any>[],
  opts: ServiceManagerOptions,
): ServiceManager {
  const { config, servicesDir, eventBus } = opts;
  const defMap = new Map<string, ServiceDefinition<any>>();
  for (const def of definitions) {
    defMap.set(def.id, def);
  }

  function ensureDir(): void {
    fs.mkdirSync(servicesDir, { recursive: true });
  }

  async function start(id: string): Promise<void> {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    // Check if already running
    const existingState = readStateFile(stateFilePath(servicesDir, id));
    if (existingState && existingState.pid && isPidAlive(existingState.pid)) {
      if (existingState.status === 'ready' || existingState.status === 'starting') {
        throw new Error(`Service ${id} is already running (pid ${existingState.pid})`);
      }
    }

    ensureDir();

    const logPath = logFilePath(servicesDir, id);
    const logFd = fs.openSync(logPath, 'a');

    const env = { ...process.env, ...(def.env ? def.env(config) : {}) };

    const child = spawn(def.command, {
      shell: true,
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env,
    });

    child.unref();
    fs.closeSync(logFd);

    const pid = child.pid!;
    const restartAttempt = existingState?.restartAttempt ?? 0;

    // Write initial state
    const state: ServiceStateFile = {
      id,
      label: def.label,
      pid,
      status: 'starting',
      startedAt: new Date().toISOString(),
      command: def.command,
      restartAttempt,
    };
    writeStateFile(stateFilePath(servicesDir, id), state);

    // Handle early exit
    child.on('error', () => {
      state.status = 'failed';
      state.error = 'Failed to spawn process';
      writeStateFile(stateFilePath(servicesDir, id), state);
      eventBus?.emit('service:failed', { id, label: def.label, error: state.error });
    });

    // If no readiness or wait === false, mark ready immediately
    if (!def.readiness || def.readiness.wait === false) {
      state.status = 'ready';
      writeStateFile(stateFilePath(servicesDir, id), state);
      eventBus?.emit('service:ready', { id, label: def.label, endpoints: state.endpoints });
      return;
    }

    // Normalize to a list of named patterns
    const readinessPatterns: ReadinessPattern[] = def.readiness.patterns
      ? def.readiness.patterns
      : [{ name: '_default', pattern: def.readiness.pattern!, captures: def.readiness.captures }];

    const { timeout } = def.readiness;
    const startTime = Date.now();
    let lastPos = 0;
    const matched = new Set<string>();
    state.endpoints = {};

    await new Promise<void>((resolve, reject) => {
      const pollInterval = setInterval(() => {
        // Check if process is still alive
        if (!isPidAlive(pid)) {
          clearInterval(pollInterval);
          state.status = 'failed';
          state.error = 'Process exited before becoming ready';
          writeStateFile(stateFilePath(servicesDir, id), state);
          eventBus?.emit('service:failed', { id, label: def.label, error: state.error });
          reject(new Error(state.error));
          return;
        }

        // Read new content from log
        try {
          const logContent = fs.readFileSync(logPath, 'utf-8');
          const newContent = logContent.slice(lastPos);
          lastPos = logContent.length;

          if (newContent) {
            for (const rp of readinessPatterns) {
              if (matched.has(rp.name)) continue;
              const match = rp.pattern.exec(newContent);
              if (match) {
                matched.add(rp.name);
                // Extract captures as endpoints
                if (rp.captures) {
                  for (const [name, groupIdx] of Object.entries(rp.captures)) {
                    if (match[groupIdx]) {
                      state.endpoints![name] = match[groupIdx]!;
                    }
                  }
                }
                eventBus?.emit('service:pattern-matched', {
                  id,
                  label: def.label,
                  name: rp.name,
                  endpoints: state.endpoints,
                  remaining: readinessPatterns.length - matched.size,
                });
              }
            }

            // All patterns matched → service is ready
            if (matched.size === readinessPatterns.length) {
              clearInterval(pollInterval);
              state.status = 'ready';
              state.restartAttempt = 0;
              writeStateFile(stateFilePath(servicesDir, id), state);
              eventBus?.emit('service:ready', {
                id,
                label: def.label,
                endpoints: state.endpoints,
              });
              resolve();
              return;
            }
          }
        } catch {
          // Log file might not exist yet
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval);
          // Kill the process on timeout
          try {
            process.kill(-pid, 'SIGKILL');
          } catch {
            // Already dead
          }
          const unmatched = readinessPatterns
            .filter((rp) => !matched.has(rp.name))
            .map((rp) => rp.name);
          state.status = 'failed';
          state.error = `Readiness timeout exceeded (unmatched: ${unmatched.join(', ')})`;
          writeStateFile(stateFilePath(servicesDir, id), state);
          eventBus?.emit('service:failed', { id, label: def.label, error: state.error });
          reject(new Error(state.error));
        }
      }, 100);
    });
  }

  async function stop(id: string): Promise<void> {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    const statePath = stateFilePath(servicesDir, id);
    const state = readStateFile(statePath);
    if (!state || !state.pid) {
      throw new Error(`Service ${id} is not running`);
    }

    if (!isPidAlive(state.pid)) {
      removeStateFile(statePath);
      return;
    }

    const signal = def.shutdown?.signal ?? 'SIGTERM';
    const timeout = def.shutdown?.timeout ?? 5_000;

    // Send signal to process group
    try {
      process.kill(-state.pid, signal);
    } catch {
      // Try direct pid if group kill fails
      try {
        process.kill(state.pid, signal);
      } catch {
        // Already dead
      }
    }

    const exited = await waitForExit(state.pid, timeout);

    if (!exited) {
      // Force kill
      try {
        process.kill(-state.pid, 'SIGKILL');
      } catch {
        try {
          process.kill(state.pid, 'SIGKILL');
        } catch {
          // Already dead
        }
      }
      await waitForExit(state.pid, 2_000);
    }

    // Verify port release if endpoints had ports
    if (state.endpoints?.port) {
      const port = parseInt(state.endpoints.port, 10);
      if (!isNaN(port)) {
        // Wait briefly for port to be released
        let portFree = false;
        for (let i = 0; i < 10; i++) {
          portFree = await isPortFree(port);
          if (portFree) break;
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    }

    removeStateFile(statePath);
    eventBus?.emit('service:stopped', { id, label: def.label });
  }

  function list(): ServiceStatus[] {
    const results: ServiceStatus[] = [];

    for (const def of definitions) {
      const statePath = stateFilePath(servicesDir, def.id);
      const state = readStateFile(statePath);

      if (!state) {
        results.push({ id: def.id, label: def.label, status: 'idle' });
        continue;
      }

      // Verify PID is alive
      if (state.pid && !isPidAlive(state.pid)) {
        // Process died — check restart policy
        if (
          def.restart?.enabled &&
          (state.restartAttempt ?? 0) < def.restart.maxRetries &&
          state.status === 'ready'
        ) {
          // Mark for restart (async, don't block list())
          const attempt = (state.restartAttempt ?? 0) + 1;
          eventBus?.emit('service:restarting', {
            id: def.id,
            label: def.label,
            attempt,
            maxRetries: def.restart.maxRetries,
          });

          // Update state file with incremented attempt
          state.status = 'starting';
          state.restartAttempt = attempt;
          writeStateFile(statePath, state);

          // Trigger async restart after delay
          setTimeout(async () => {
            try {
              removeStateFile(statePath);
              // Write a temp state so start() knows the attempt count
              ensureDir();
              const tempState: ServiceStateFile = {
                id: def.id,
                label: def.label,
                pid: 0,
                status: 'failed',
                startedAt: new Date().toISOString(),
                command: def.command,
                restartAttempt: attempt,
              };
              writeStateFile(statePath, tempState);
              await start(def.id);
            } catch {
              // Restart failed — dir may have been removed (test teardown)
            }
          }, def.restart.delay);

          results.push({
            id: def.id,
            label: def.label,
            status: 'starting',
            restartAttempt: attempt,
          });
        } else {
          // No restart or max retries exceeded
          const status: ServiceStatus = {
            id: def.id,
            label: def.label,
            status: 'failed',
            error: 'Process exited unexpectedly',
          };
          if (
            def.restart?.enabled &&
            (state.restartAttempt ?? 0) >= def.restart.maxRetries
          ) {
            status.restartAttempt = state.restartAttempt;
            eventBus?.emit('service:failed', {
              id: def.id,
              label: def.label,
              error: 'Max restart retries exceeded',
            });
          }
          removeStateFile(statePath);
          results.push(status);
        }
        continue;
      }

      results.push({
        id: def.id,
        label: def.label,
        status: state.status as ServiceStatus['status'],
        pid: state.pid,
        endpoints: state.endpoints,
        restartAttempt: state.restartAttempt,
      });
    }

    return results;
  }

  function logs(id: string, lines = 50): string {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    const logPath = logFilePath(servicesDir, id);
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const allLines = content.split('\n');
      // Return last N lines
      return allLines.slice(-lines).join('\n');
    } catch {
      return '';
    }
  }

  function watchLogs(id: string, onLine: (line: string) => void): () => void {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    const logPath = logFilePath(servicesDir, id);
    let lastPos = 0;

    // Initialize position to end of file
    try {
      const stat = fs.statSync(logPath);
      lastPos = stat.size;
    } catch {
      // File doesn't exist yet
    }

    const watcher = fs.watch(logPath, () => {
      try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const newContent = content.slice(lastPos);
        lastPos = content.length;
        if (newContent) {
          const lines = newContent.split('\n').filter((l) => l.length > 0);
          for (const line of lines) {
            onLine(line);
          }
        }
      } catch {
        // File might have been removed
      }
    });

    return () => {
      watcher.close();
    };
  }

  return { start, stop, list, logs, watchLogs };
}
