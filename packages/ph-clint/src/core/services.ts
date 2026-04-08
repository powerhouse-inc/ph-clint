import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import type { EventBus, ReadinessPattern, ServiceDefinition, ServiceInstanceStatus, ServiceManager, ServiceStartOptions } from './types.js';

/**
 * Identity wrapper for service definitions — provides type checking and IDE support.
 */
export function defineService<TConfig = Record<string, unknown>>(
  opts: ServiceDefinition<TConfig>,
): ServiceDefinition<TConfig> {
  return opts;
}

/**
 * Persisted state for a service instance on disk.
 */
interface ServiceStateFile {
  serviceId: string;
  instanceId: string;
  label: string;
  pid: number;
  status: 'starting' | 'ready' | 'failed';
  endpoints?: Record<string, string>;
  error?: string;
  startedAt: string;
  command: string;
  restartAttempt?: number;
  workdir?: string;
  params?: Record<string, unknown>;
}

export interface ServiceManagerOptions {
  config: Record<string, unknown>;
  servicesDir: string;
  eventBus?: EventBus;
}

/**
 * Get the directory for a service's instance state files.
 */
function serviceDir(servicesDir: string, serviceId: string): string {
  return path.join(servicesDir, serviceId);
}

function stateFilePath(servicesDir: string, serviceId: string, instanceId: string): string {
  return path.join(serviceDir(servicesDir, serviceId), `${instanceId}.json`);
}

function logFilePath(servicesDir: string, serviceId: string, instanceId: string): string {
  return path.join(serviceDir(servicesDir, serviceId), `${instanceId}.log`);
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
 * Generate an instance ID from start options.
 * - Default (no name, no workdir) → serviceId
 * - Named → serviceId:name
 * - Workdir-derived → serviceId:hash8
 */
function resolveInstanceId(serviceId: string, opts?: ServiceStartOptions): string {
  if (opts?.name) return `${serviceId}:${opts.name}`;
  if (opts?.workdir) {
    const hash = crypto.createHash('sha256').update(opts.workdir).digest('hex').slice(0, 8);
    return `${serviceId}:${hash}`;
  }
  return serviceId;
}

/**
 * Resolve a service command — supports static string or dynamic function.
 */
function resolveCommand(def: ServiceDefinition<any>, params?: Record<string, unknown>): string {
  return typeof def.command === 'function' ? def.command(params) : def.command;
}

/**
 * Scan a service's instance directory for all state files.
 */
function scanInstances(servicesDir: string, serviceId: string): ServiceStateFile[] {
  const dir = serviceDir(servicesDir, serviceId);
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readStateFile(path.join(dir, f)))
      .filter((s): s is ServiceStateFile => s !== null);
  } catch {
    return [];
  }
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

  function ensureServiceDir(serviceId: string): void {
    fs.mkdirSync(serviceDir(servicesDir, serviceId), { recursive: true });
  }

  async function start(id: string, startOpts?: ServiceStartOptions): Promise<string> {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    const instanceId = resolveInstanceId(id, startOpts);
    const maxInstances = def.maxInstances ?? 1;

    // Check if this specific instance is already running
    const existingState = readStateFile(stateFilePath(servicesDir, id, instanceId));
    if (existingState && existingState.pid && isPidAlive(existingState.pid)) {
      if (existingState.status === 'ready' || existingState.status === 'starting') {
        throw new Error(`Service ${id} is already running (pid ${existingState.pid})`);
      }
    }

    // Check maxInstances limit
    const running = scanInstances(servicesDir, id)
      .filter((s) => s.instanceId !== instanceId && s.pid && isPidAlive(s.pid));
    if (running.length >= maxInstances) {
      throw new Error(`Service ${id} has reached max instances (${maxInstances})`);
    }

    ensureServiceDir(id);

    const params = startOpts?.params;
    const commandStr = resolveCommand(def, params);
    const logPath = logFilePath(servicesDir, id, instanceId);
    const logFd = fs.openSync(logPath, 'a');

    const env = { ...process.env, ...(def.env ? def.env(config, params) : {}) };

    const child = spawn(commandStr, {
      shell: true,
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env,
      cwd: startOpts?.cwd ?? startOpts?.workdir,
    });

    child.unref();
    fs.closeSync(logFd);

    const pid = child.pid!;
    const restartAttempt = existingState?.restartAttempt ?? 0;

    // Write initial state
    const state: ServiceStateFile = {
      serviceId: id,
      instanceId,
      label: def.label,
      pid,
      status: 'starting',
      startedAt: new Date().toISOString(),
      command: commandStr,
      restartAttempt,
      workdir: startOpts?.workdir,
      params,
    };
    writeStateFile(stateFilePath(servicesDir, id, instanceId), state);

    // Handle early exit (unreachable with shell: true — the shell always spawns)
    /* istanbul ignore next -- defensive guard */
    child.on('error', () => {
      state.status = 'failed';
      state.error = 'Failed to spawn process';
      writeStateFile(stateFilePath(servicesDir, id, instanceId), state);
      eventBus?.emit('service:failed', { id, instanceId, label: def.label, error: state.error });
    });

    // If no readiness or wait === false, mark ready immediately
    if (!def.readiness || def.readiness.wait === false) {
      state.status = 'ready';
      writeStateFile(stateFilePath(servicesDir, id, instanceId), state);
      eventBus?.emit('service:ready', { id, instanceId, label: def.label, endpoints: state.endpoints });
      return instanceId;
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
          writeStateFile(stateFilePath(servicesDir, id, instanceId), state);
          eventBus?.emit('service:failed', { id, instanceId, label: def.label, error: state.error });
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
                  instanceId,
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
              writeStateFile(stateFilePath(servicesDir, id, instanceId), state);
              eventBus?.emit('service:ready', {
                id,
                instanceId,
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
          writeStateFile(stateFilePath(servicesDir, id, instanceId), state);
          eventBus?.emit('service:failed', { id, instanceId, label: def.label, error: state.error });
          reject(new Error(state.error));
        }
      }, 100);
    });

    return instanceId;
  }

  /**
   * Send a signal to a process, trying the process group first, then direct PID.
   */
  /* istanbul ignore next -- kill fallbacks depend on OS process group behavior */
  function killProcess(pid: number, signal: string): void {
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        process.kill(pid, signal);
      } catch {
        // Already dead
      }
    }
  }

  /**
   * Force-kill a process with SIGKILL, then wait for it to exit.
   */
  /* istanbul ignore next -- force-kill path requires processes that resist SIGTERM */
  async function forceKill(pid: number): Promise<void> {
    killProcess(pid, 'SIGKILL');
    await waitForExit(pid, 2_000);
  }

  async function stopInstance(def: ServiceDefinition<any>, serviceId: string, instanceId: string): Promise<void> {
    const statePath = stateFilePath(servicesDir, serviceId, instanceId);
    const state = readStateFile(statePath);
    if (!state || !state.pid) {
      throw new Error(`Service ${serviceId} is not running`);
    }

    if (!isPidAlive(state.pid)) {
      removeStateFile(statePath);
      return;
    }

    const signal = def.shutdown?.signal ?? 'SIGTERM';
    const timeout = def.shutdown?.timeout ?? 5_000;

    killProcess(state.pid, signal);

    const exited = await waitForExit(state.pid, timeout);

    if (!exited) {
      await forceKill(state.pid);
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
    eventBus?.emit('service:stopped', { id: serviceId, instanceId, label: def.label });
  }

  async function stop(id: string, instanceId?: string): Promise<void> {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    if (instanceId) {
      return stopInstance(def, id, instanceId);
    }

    // Stop all instances of this service
    const instances = scanInstances(servicesDir, id);
    if (instances.length === 0) {
      throw new Error(`Service ${id} is not running`);
    }

    for (const inst of instances) {
      try {
        await stopInstance(def, id, inst.instanceId);
      } catch {
        // Instance may already be dead
      }
    }
  }

  function list(serviceId?: string): ServiceInstanceStatus[] {
    const results: ServiceInstanceStatus[] = [];
    const defs = serviceId ? [defMap.get(serviceId)].filter(Boolean) as ServiceDefinition<any>[] : definitions;

    for (const def of defs) {
      const instances = scanInstances(servicesDir, def.id);

      if (instances.length === 0) {
        // No instances — show idle placeholder
        results.push({
          serviceId: def.id,
          instanceId: def.id,
          label: def.label,
          status: 'idle',
        });
        continue;
      }

      for (const state of instances) {
        // Verify PID is alive
        if (state.pid && !isPidAlive(state.pid)) {
          const statePath = stateFilePath(servicesDir, def.id, state.instanceId);

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
              instanceId: state.instanceId,
              label: def.label,
              attempt,
              maxRetries: def.restart.maxRetries,
            });

            // Update state file with incremented attempt
            state.status = 'starting';
            state.restartAttempt = attempt;
            writeStateFile(statePath, state);

            // Trigger async restart after delay — recover params from state
            const restartParams = state.params;
            const restartWorkdir = state.workdir;
            const restartName = state.instanceId.includes(':') ? state.instanceId.split(':')[1] : undefined;
            setTimeout(async () => {
              try {
                removeStateFile(statePath);
                // Write a temp state so start() knows the attempt count
                ensureServiceDir(def.id);
                const commandStr = resolveCommand(def, restartParams);
                const tempState: ServiceStateFile = {
                  serviceId: def.id,
                  instanceId: state.instanceId,
                  label: def.label,
                  pid: 0,
                  status: 'failed',
                  startedAt: new Date().toISOString(),
                  command: commandStr,
                  restartAttempt: attempt,
                  params: restartParams,
                  workdir: restartWorkdir,
                };
                writeStateFile(statePath, tempState);
                await start(def.id, { params: restartParams, workdir: restartWorkdir, name: restartName });
              } catch {
                // Restart failed — dir may have been removed (test teardown)
              }
            }, def.restart.delay);

            results.push({
              serviceId: def.id,
              instanceId: state.instanceId,
              label: def.label,
              status: 'starting',
              restartAttempt: attempt,
              params: state.params,
              workdir: state.workdir,
            });
          } else {
            // No restart or max retries exceeded
            const status: ServiceInstanceStatus = {
              serviceId: def.id,
              instanceId: state.instanceId,
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
                instanceId: state.instanceId,
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
          serviceId: def.id,
          instanceId: state.instanceId,
          label: def.label,
          status: state.status as ServiceInstanceStatus['status'],
          pid: state.pid,
          endpoints: state.endpoints,
          restartAttempt: state.restartAttempt,
          params: state.params,
          workdir: state.workdir,
        });
      }
    }

    return results;
  }

  function logs(id: string, instanceId?: string, lines = 50): string {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    // Default to service id as instance id for single-instance services
    const resolvedInstanceId = instanceId ?? id;
    const logPath = logFilePath(servicesDir, id, resolvedInstanceId);
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const allLines = content.split('\n');
      // Return last N lines
      return allLines.slice(-lines).join('\n');
    } catch {
      return '';
    }
  }

  function watchLogs(id: string, instanceId: string, onLine: (line: string) => void): () => void {
    const def = defMap.get(id);
    if (!def) throw new Error(`Unknown service: ${id}`);

    const logPath = logFilePath(servicesDir, id, instanceId);
    let lastPos = 0;

    // Initialize position to end of file
    try {
      const stat = fs.statSync(logPath);
      lastPos = stat.size;
    } catch {
      // File doesn't exist yet
    }

    let watcher: fs.FSWatcher;
    try {
      watcher = fs.watch(logPath, () => {
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
    } catch {
      onLine('Log file not found');
      return () => {};
    }

    return () => {
      watcher.close();
    };
  }

  function getDefinition(id: string): ServiceDefinition<any> | undefined {
    return defMap.get(id);
  }

  return { start, stop, list, getDefinition, logs, watchLogs };
}
