# Thread R (registry) through the Command interface

## Problem

The `Command` interface drops the `R` (DocumentRegistry) generic:

```typescript
// types.ts — current
export interface Command<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
  TConfig = Record<string, unknown>,
> {
  execute: (input: z.output<TInput>, context: CommandContext<TConfig>) => Promise<TOutput>;
  //                                              ^^^ R defaults to AnyRegistry
}
```

Meanwhile, `createTypes({ configSchema, registry })` in `types-binding.ts` types the `execute` callback during definition with `CommandContext<TConfig, R>` (the specific registry). But once stored as a `Command`, the `R` is erased.

This means:
1. **Trigger → command invocation breaks.** A typed trigger has `ctx.commandContext: CommandContext<Config, SpecificRegistry>`. Passing that to `command.execute()` fails because `ReactorContext<SpecificRegistry>` is not assignable to `ReactorContext<AnyRegistry>` (invariance from `Reducer<T>` being contravariant on `T`).
2. **Commands lose reactor type narrowing.** Even though the impl's `defineCommand` callback sees the typed `R` at authoring time, anything that later calls `.execute()` programmatically (triggers, routine work items, tests) must pass `AnyRegistry`.

## Root Cause

`ReactorContext<R>` is invariant on `R` because `DocumentModelModule<T>` contains a `Reducer<T>` which is a function `(document: PHDocument<T>, action) => PHDocument<T>`. The `document` parameter makes `T` contravariant, while the return makes it covariant — combined = invariant.

## Proposed Fix

### Option A: Add R to Command (cascading)

```typescript
export interface Command<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  execute: (input: z.output<TInput>, context: CommandContext<TConfig, R>) => Promise<TOutput>;
}
```

**Impact:** Every place that stores/passes `Command` needs updating:
- `Map<string, Command>` in cli.ts, routine.ts
- `CliDefinition.commands`
- `RoutineOptions.commands`
- `createReplSession` command map
- All test helpers that construct commands

This is the correct long-term fix. The `R` defaults to `AnyRegistry` so existing unparameterized code stays compatible. The CLI's command map becomes `Map<string, Command<any, any, Config, Registry>>`.

### Option B: Make ReactorContext covariant

Remove `getDocumentModelModule()` from `ReactorContext` (or make it return `unknown`). This is the only field causing invariance. However, it may be needed by the subscription bridge.

### Option C: Separate the reactor read interface

```typescript
interface ReactorReadContext<R> {
  client: TypedReactorClient<R>;  // covariant (only reads)
  driveId: string;
}
```

Commands/triggers get `ReactorReadContext<R>` which is covariant. The full `ReactorContext` (with module access) is only used internally by the subscription bridge.

## Recommendation

**Option A** is the most straightforward. The cascade is mechanical — add a 4th generic parameter with a default, thread it through. No semantic changes. The `defineCli` / `createTypes` already capture `R` — they just need to propagate it into the stored command map type.

## Current Workaround

In `publish-trigger.ts`, we cast `execute` to `Function` with a `FIXME(type-strictness)` comment pointing here. This is the only call site currently affected (trigger invoking a command directly).

## Scope

- `packages/ph-clint/src/core/types.ts` — add `R` to `Command`
- `packages/ph-clint/src/core/types-binding.ts` — return `Command<TInput, TOutput, TConfig, R>`
- `packages/ph-clint/src/core/cli.ts` — parameterize command map
- `packages/ph-clint/src/core/routine.ts` — parameterize command map
- `packages/ph-clint/src/interactive/session.ts` — if it stores commands
- Test files that construct `Command` objects manually
