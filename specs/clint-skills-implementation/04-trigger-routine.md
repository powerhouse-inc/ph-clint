# Skill: trigger-routine

## Why This Skill Exists

The routine loop is ph-clint's mechanism for automation without an agent. Triggers poll for conditions and produce work items that the routine dispatches to commands. This enables reactive behavior (file watcher, document change detector, health checker) that runs alongside the REPL or in background mode with `--wait`.

The mental model is subtle: triggers don't execute work directly — they produce WorkItem descriptors that the routine dispatches. This separation means triggers stay simple (poll → return WorkItem or null) while the routine handles scheduling, error recovery, and concurrency. Developers who miss this pattern tend to put execution logic inside the trigger poll function.

## What The Skill Covers

- `defineTrigger()` with setup, poll, teardown
- `TriggerContext`: nested context access (`context.context.config`), persistent state, lazy accessors
- `WorkItem` structure: command type, params, callbacks
- Routine configuration: tickInterval, idleInterval
- Routine lifecycle: init → ready → running ↔ stopping
- Starting/stopping the routine from commands
- Event emission from triggers

## What The Skill Does NOT Cover

- Document change triggers (see `ph-integration` — createDocumentChangeTrigger)
- Process management within commands (see `command-definition`)
- Service lifecycle (see `service-definition`)

## File Plan

### .preamble.md (~100 lines)

Routine loop mental model:
- The routine is a tick-based loop that polls all registered triggers every `tickInterval` ms (default 2000)
- Each tick: poll every trigger → collect WorkItems → dispatch them (execute commands or call functions)
- Triggers have persistent `state` that survives across polls — use it for "last seen" timestamps, counters, etc.
- Triggers should be fast and side-effect-free — they check conditions and describe work, they don't do work
- WorkItems reference commands by ID: `{ type: 'command', params: { commandId: 'build', args: {} } }`
- Callbacks (`onSuccess`, `onFailure`) let triggers react to work item outcomes

TriggerContext shape:
- `context.context` — CoreContext containing config, emit, services, workspace, etc.
- `context.state` — per-trigger mutable state object, initialized by `state()` factory
- `context.reactor()` — lazy async accessor for ReactorContext (if Powerhouse configured)
- `context.agent()` — lazy async accessor for AgentProvider (if agent configured)
- Note: config and emit are NOT direct properties — they're at `context.context.config` and `context.context.emit`

Routine lifecycle:
- `init` — created but not configured
- `ready` — triggers registered, waiting to start
- `running` — actively polling
- `stopping` — graceful shutdown in progress
- Start from commands: `context.routine!.start()`
- Stop from commands: `context.routine!.stop()`
- Check status: `context.routine!.status`

Pitfalls:
- Heavy computation in poll blocks the tick loop — offload to commands
- Forgetting to initialize state in `setup` or `state()` factory — state is empty object by default
- Returning a WorkItem every tick when condition hasn't changed — use state to track "already triggered"
- Not handling the case where the target command doesn't exist

### .cli-docs.md

Extract from HTML docs:
- `defineTrigger()` function signature
- `TriggerContext` interface (context, state, reactor, agent)
- `CoreContext` — what's inside `context.context`
- `WorkItem` interface (type, params, callbacks)
- `Routine` interface (status, triggerIds, start, stop)
- `RoutineStatus` type
- `RoutineConfig` (tickInterval, idleInterval)
- `createRoutine()` function signature

### .result.md

> Trigger is defined with setup, poll, and state management. Routine is configured in defineCli with appropriate tick interval. A command can start/stop the routine. WorkItems dispatch correctly to target commands.

### 00.design-trigger.md

Phase: Design the trigger's condition and response.

Steps:
- What condition should be detected? (file change, time elapsed, document modified, health check failed)
- How often should it poll? (sets tickInterval — 1s for responsive, 5s+ for background)
- What state needs to persist across polls? (timestamps, hashes, counters, previous values)
- Which command should the WorkItem target?
- What args does that command need?
- Should the trigger emit events on success/failure?

### 01.implement-trigger.md

Phase: Write the defineTrigger call.

Steps:
- Set id and type (`'condition'`)
- Optionally define `state()` factory for initial state shape
- Write `setup()`: initialize state, perform one-time setup (e.g., scan initial file state)
- Write `poll()`:
  - Access config via `context.context.config`
  - Check condition against `context.state`
  - If condition met: update state, return WorkItem
  - If not: return null
- Optionally write `teardown()`: cleanup resources
- Add callbacks to WorkItem for event emission or state updates

### 02.configure-routine.md

Phase: Wire the trigger into the CLI and configure the routine.

Steps:
- In codegen projects: update `project-spec.json` and run `{{commands.clint-project-regen.id}}` to register in `@clint:begin triggers`. Never hand-edit marker regions.
- In manual projects: add trigger to `triggers` array in defineCli
- Set `routine.tickInterval` (ms between polls)
- Set `routine.idleInterval` if different idle timing needed
- Create start/stop commands:
  ```
  execute: async (_, { routine }) => {
    routine!.start();
    return 'Watching...';
  }
  ```
- For auto-start: emit event in interactive welcome or use `--wait` flag in command mode

### 03.add-callbacks.md

Phase: Add work item callbacks and event emission.

Steps:
- Add `callbacks.onSuccess` to log results or update trigger state
- Add `callbacks.onFailure` to handle errors, increment retry counters
- Emit events via `context.context.emit('build:complete')` for cross-cutting concerns
- Wire event handlers in defineCli `events` config
- Consider: should failure stop the routine? Adjust trigger state accordingly.

## Research Before Writing

| What | Where |
|------|-------|
| `defineTrigger` function | `packages/ph-clint/src/core/trigger.ts` |
| `TriggerContext`, `WorkItem` | `packages/ph-clint/src/core/types.ts` (search `TriggerContext`) |
| `CoreContext` type | `packages/ph-clint/src/core/types.ts` (search `CoreContext`) |
| `Routine`, `RoutineStatus`, `RoutineConfig` | `packages/ph-clint/src/core/types.ts` (search `Routine`) |
| Routine implementation | `packages/ph-clint/src/core/routine.ts` |
| Routine-service adapter | `packages/ph-clint/src/core/routine-service.ts` |
| Trigger/routine tests | `packages/ph-clint/tests/routine.test.ts` |
| Example 03 (file watcher) | `examples/03-file-watcher/src/trigger.ts` and `src/commands/` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Triggers & Routine Loop" section |
