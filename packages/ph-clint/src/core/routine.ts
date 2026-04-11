import type {
  Command,
  CommandContext,
  EventBus,
  ProcessManager,
  Routine,
  RoutineStatus,
  Trigger,
  TriggerContext,
  WorkItem,
} from './types.js';
import { createEventBus } from './events.js';
import { createProcessManager } from './processes.js';
import { createMemoryWorkdirStore } from './store.js';

export interface RoutineOptions {
  triggers: Trigger[];
  commands: Map<string, Command>;
  tickInterval?: number;
  idleInterval?: number;
  context?: CommandContext;
  eventBus?: EventBus;
  processManager?: ProcessManager;
}

/**
 * Create a routine — a tick-based execution loop with pluggable triggers.
 * Inspired by the agent prototype's AgentRoutine.
 *
 * State machine: init → ready → running ↔ stopping
 */
export function createRoutine(options: RoutineOptions): Routine {
  const tickInterval = options.tickInterval ?? 2000;
  const idleInterval = options.idleInterval ?? 500;
  const bus = options.eventBus ?? createEventBus();
  const pm = options.processManager ?? createProcessManager();
  let ctx: CommandContext = options.context ?? {
    workspace: createMemoryWorkdirStore(),
    config: {},
    workdir: '',
    stdout: console.log,
  };

  let status: RoutineStatus = 'init';
  let loopPromise: Promise<void> | null = null;
  let stopRequested = false;

  const queue: WorkItem[] = [];

  function makeTriggerContext(trigger: Trigger): TriggerContext {
    // Each trigger gets its own persistent state object
    const state: Record<string, unknown> = {};
    return {
      config: ctx.config,
      state,
      emit: (event: string, data?: unknown) => bus.emit(event, data),
    };
  }

  // Build trigger contexts once
  const triggerContexts = new Map<string, TriggerContext>();
  for (const trigger of options.triggers) {
    triggerContexts.set(trigger.id, makeTriggerContext(trigger));
  }

  async function executeWorkItem(item: WorkItem): Promise<unknown> {
    switch (item.type) {
      case 'function': {
        const fn = item.params.fn as () => Promise<unknown>;
        return fn();
      }

      case 'command': {
        const commandId = item.params.commandId as string;
        const args = (item.params.args ?? {}) as Record<string, unknown>;
        const cmd = options.commands.get(commandId);
        if (!cmd) {
          throw new Error(`Unknown command: ${commandId}`);
        }
        const parsed = cmd.inputSchema.parse(args);
        // Provide extended context with routine, processes, emit
        const extCtx: CommandContext = {
          ...ctx,
          routine: routine,
          processes: pm,
          emit: (event: string, data?: unknown) => bus.emit(event, data),
        };
        return cmd.execute(parsed, extCtx);
      }

      default: {
        const _exhaustive: never = item.type;
        throw new Error(`Unknown work item type: ${_exhaustive}`);
      }
    }
  }

  async function loop(): Promise<void> {
    // Setup phase: call setup on all triggers
    for (const trigger of options.triggers) {
      if (trigger.setup) {
        const tCtx = triggerContexts.get(trigger.id)!;
        await trigger.setup(tCtx);
      }
    }

    status = 'running';

    while (!stopRequested) {
      const iterationStart = Date.now();

      // 1. Poll triggers for new work
      for (const trigger of options.triggers) {
        const tCtx = triggerContexts.get(trigger.id)!;
        try {
          const item = await trigger.poll(tCtx);
          if (item) {
            queue.push(item);
          }
        } catch {
          // Trigger poll errors are swallowed to keep the loop alive
        }
      }

      // 2. Execute next queued item (FIFO)
      if (queue.length > 0) {
        const item = queue.shift()!;
        try {
          const result = await executeWorkItem(item);
          if (routine.onOutput && result !== undefined && result !== null) {
            const text = typeof result === 'object' && result !== null && 'text' in result
              ? (result as Record<string, unknown>).text as string
              : String(result);
            if (text) routine.onOutput(text);
          }
          await item.callbacks?.onSuccess?.(result);
        } catch (error) {
          await item.callbacks?.onFailure?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }

      // 3. Respect timing constraints
      const elapsed = Date.now() - iterationStart;
      const idle = Math.max(idleInterval, tickInterval - elapsed);
      await new Promise((r) => setTimeout(r, idle));
    }

    // Teardown triggers
    for (const trigger of options.triggers) {
      if (trigger.teardown) {
        try {
          await trigger.teardown(triggerContexts.get(trigger.id)!);
        } catch {
          // Swallow teardown errors to ensure all triggers get torn down
        }
      }
    }

    status = 'ready';
    stopRequested = false;
  }

  const routine: Routine = {
    onOutput: undefined,
    get status() {
      return status;
    },
    get triggerIds() {
      return options.triggers.map(t => t.id);
    },
    get queueLength() {
      return queue.length;
    },
    start() {
      if (status === 'running') return;
      if (status === 'init' || status === 'ready') {
        stopRequested = false;
        // Transition through ready if coming from init
        if (status === 'init') {
          status = 'ready';
        }
        loopPromise = loop();
      }
    },
    async stop() {
      if (status !== 'running') return;
      status = 'stopping';
      stopRequested = true;
      if (loopPromise) {
        await loopPromise;
        loopPromise = null;
      }
    },
    setContext(newCtx: CommandContext) {
      ctx = newCtx;
    },
  };

  return routine;
}
