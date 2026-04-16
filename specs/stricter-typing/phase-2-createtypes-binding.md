# Phase 2 — Binding helper & trigger generics

**Goal:** Make impl code ergonomic. Introduce the `createTypes({ configSchema, registry })` binding helper that returns typed `defineCommand` / `defineTrigger` / `defineService`. Upgrade `TriggerContext` to `TriggerContext<TState, TConfig, R>` with a `state: () => TState` initializer. Verify `ServiceDefinition<TConfig>`'s existing generic flows end-to-end. Migrate `ph-clint-cli/src/triggers/spec-change.ts` to use `createTypes` and drop every cast on `ctx.context.config`, `ctx.state`, and `reactor.client.get(...)` — the trigger's *structure* stays the same (event handler + pending counter + hash compare); only the types change. The full rewrite using `createDocumentChangeTrigger` lands in Phase 3.

## Context for future Claude

Read these first:
- [`specs/issues/ph-clint-type-safety.md`](../issues/ph-clint-type-safety.md) — problem statement.
- [`specs/stricter-typing/README.md`](./README.md) — overall plan, design decisions.
- [`specs/stricter-typing/phase-1-framework-types.md`](./phase-1-framework-types.md) — prior phase.
- [`CLAUDE.md`](../../CLAUDE.md) — repo conventions.

**Prerequisites:** Phase 1 merged. You have:
- `DocumentRegistry`, `RegistryEntry`, `AnyRegistry`, `TypedReactorClient<R>` exported from `ph-clint`.
- `defineRegistry([M1, M2] as const)` exported from `ph-clint`.
- `ReactorContext<R>`, `CoreContext<TConfig, R>`, `CommandContext<TConfig, R>`, `PhClintEvents<R>`, `EmitFn<R>`, `OnFn<R>` all threading the registry generic.
- `TriggerContext<R>` passing the registry through (but no `TState`/`TConfig` yet).
- `.test-d.ts` compile-time tests in `packages/ph-clint/tests/types/`.

**Key constraint:** Runtime behavior unchanged. Existing Jest tests stay green. Coverage ≥ 95%.

## Background — why the binding helper

Threading `<TState, TConfig, R>` through every `defineTrigger` / `defineService` call site is noisy:

```ts
// Without binding helper — what users would write otherwise:
const trigger = defineTrigger<{ pending: number }, z.infer<typeof configSchema>, typeof registry>({
  id: 'spec-change',
  // …
});
```

That's three type parameters that are identical across every trigger in a CLI. Every service repeats `<z.infer<typeof configSchema>>`. Every command repeats it too. A **binding helper** captures the per-CLI generics once:

```ts
// In the impl (one location per CLI):
export const { defineCommand, defineTrigger, defineService, createDocumentChangeTrigger } =
  createTypes({ configSchema, registry });

// At every call site — only TState needs to vary, nothing else:
const trigger = defineTrigger<{ pending: number }>({ id: 'spec-change', … });
```

This matches the way `configureReactor` already works (factory captured once) and the way `defineCli<typeof configSchema>` already infers `TConfig` for commands. It's a small new export that eliminates a large amount of per-call-site boilerplate.

## Scope

### Files touched

| File | Change |
|---|---|
| `packages/ph-clint/src/core/types.ts` | Upgrade `TriggerContext<TState, TConfig, R>`. Upgrade `TriggerOptions<TState, TConfig, R>` with `state?: () => TState`. Upgrade `Trigger<TState, TConfig, R>`. |
| `packages/ph-clint/src/core/trigger.ts` | `defineTrigger<TState, TConfig, R>(options)` generic signature. Runtime: inline `state()` into initial `TriggerContext.state` on framework setup path. |
| `packages/ph-clint/src/core/routine.ts` | Runtime: when building per-trigger context, call `trigger.state?.()` once to initialize state before first `setup()`/`poll()`. |
| `packages/ph-clint/src/core/types-binding.ts` | **New.** `createTypes({ configSchema, registry })` returning `TypedFactory<TConfig, R>`. |
| `packages/ph-clint/src/core/services.ts` | Verify `ServiceDefinition<TConfig>` generic flows through `env`, `preflight`, `paramsSchema` without loss. No API change. |
| `packages/ph-clint/src/core/cli.ts` | When `CliOptions.triggers` is provided, wire the registered `R` (captured from `configureReactor`) into each trigger's context construction. |
| `packages/ph-clint/src/index.ts` | Export `createTypes`, `TypedFactory`. |
| `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` | Migrate to `createTypes`. Remove all `as` casts on `ctx.context.config`, `ctx.state`, guard results. Keep the manual event handler + pending counter + hash compare logic intact. |
| `packages/ph-clint-cli/ph-clint-cli/src/cli.ts` (or wherever `configSchema` is defined) | Add the `createTypes({ configSchema, registry })` binding + export `defineCommand` / `defineTrigger` / `defineService`. |
| `packages/ph-clint/tests/types/trigger.test-d.ts` | **New.** Compile-time tests for the generic trigger surface. |
| `packages/ph-clint/tests/types/binding.test-d.ts` | **New.** Compile-time tests for `createTypes`. |

### Files NOT touched

- `packages/ph-clint/src/integrations/powerhouse/*.ts` — Phase 1 already did the work.
- `examples/06-connect-agent/agent-cli/src/trigger.ts` — migrated in Phase 3 using the typed helper.
- ph-clint-cli codegen templates — Phase 4.

## Detailed design

### 1. `TriggerContext` / `TriggerOptions` / `Trigger` generics

In `packages/ph-clint/src/core/types.ts`:

```ts
export interface TriggerContext<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  context: CoreContext<TConfig, R>;
  state: TState;
  reactor: () => Promise<ReactorContext<R> | undefined>;
  agent: () => Promise<AgentProvider | undefined>;
}

export interface TriggerOptions<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  id: string;
  type: 'condition';
  /** Initializer called once per trigger instance before setup/poll. */
  state?: () => TState;
  setup?: (ctx: TriggerContext<TState, TConfig, R>) => Promise<void>;
  teardown?: (ctx: TriggerContext<TState, TConfig, R>) => Promise<void>;
  poll: (ctx: TriggerContext<TState, TConfig, R>) => Promise<WorkItem | null>;
}

export interface Trigger<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  id: string;
  type: string;
  state?: () => TState;
  setup?: (ctx: TriggerContext<TState, TConfig, R>) => Promise<void>;
  teardown?: (ctx: TriggerContext<TState, TConfig, R>) => Promise<void>;
  poll: (ctx: TriggerContext<TState, TConfig, R>) => Promise<WorkItem | null>;
}
```

**`CliOptions.triggers` shape:** Keep `triggers?: Trigger[]` (widened to `Trigger<any, any, any>[]` for storage). The per-trigger generics only matter inside each trigger's own closure; the framework doesn't unify them across triggers.

### 2. `defineTrigger` generic

`packages/ph-clint/src/core/trigger.ts`:

```ts
import type { DocumentRegistry, AnyRegistry } from '../integrations/powerhouse/types.js';
import type { Trigger, TriggerOptions } from './types.js';

export function defineTrigger<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
>(
  options: TriggerOptions<TState, TConfig, R>,
): Trigger<TState, TConfig, R> {
  return options;
}
```

### 3. Runtime: state initializer

`packages/ph-clint/src/core/routine.ts` (or wherever the per-trigger `TriggerContext` is constructed).

Today each trigger's state is a fresh `Record<string, unknown>` (likely `{}` on instantiation). Change: when the framework instantiates a `TriggerContext`, initialize `state` by calling `trigger.state?.() ?? {}`:

```ts
const triggerState = trigger.state ? trigger.state() : {};
const triggerCtx: TriggerContext<any, any, any> = {
  context: coreContext,
  state: triggerState,
  reactor: getReactor,
  agent: getAgent,
};
```

The initializer is called **once per trigger instance**, before `setup()` runs. This matches how impl code already mutates state in `setup()` — setting `ctx.state.pending = 0`, etc. — but now they get a typed starting value and don't have to cast.

### 4. `createTypes` binding helper

`packages/ph-clint/src/core/types-binding.ts` (new):

```ts
import type { z } from 'zod';
import type {
  DocumentRegistry,
  AnyRegistry,
} from '../integrations/powerhouse/types.js';
import type {
  Command,
  CommandContext,
  PromptConfig,
  Trigger,
  TriggerOptions,
  ServiceDefinition,
  WorkItem,
} from './types.js';
import { defineCommand as baseDefineCommand } from './command.js';
import { defineTrigger as baseDefineTrigger } from './trigger.js';
import { defineService as baseDefineService } from './services.js';

export interface CreateTypesOptions<
  TSchema extends z.ZodType,
  R extends DocumentRegistry,
> {
  configSchema: TSchema;
  /**
   * Optional registry. When omitted, R defaults to AnyRegistry — all
   * reactor/event narrowing falls back to the loose shapes. Provide it
   * to unlock registry-typed client methods and event payloads.
   */
  registry?: R;
}

/**
 * Bundle of typed definers returned by createTypes().
 * Each one pre-binds TConfig (from configSchema) and R (from registry)
 * so impl code only needs to specify per-call type parameters (e.g. TState).
 */
export interface TypedFactory<
  TConfig,
  R extends DocumentRegistry,
> {
  /** Typed defineCommand — ctx.config is TConfig, ctx.reactor() returns ReactorContext<R>. */
  defineCommand<TInput extends z.ZodType, TOutput = unknown>(
    options: {
      id: string;
      description: string;
      inputSchema: TInput;
      outputSchema?: z.ZodType<TOutput>;
      prompt?: PromptConfig;
      execute: (
        input: z.output<TInput>,
        ctx: CommandContext<TConfig, R>,
      ) => Promise<TOutput>;
    },
  ): Command<TInput, TOutput, TConfig>;

  /** Typed defineTrigger — ctx.state is TState, ctx.context.config is TConfig, reactor is typed by R. */
  defineTrigger<TState = Record<string, unknown>>(
    options: TriggerOptions<TState, TConfig, R>,
  ): Trigger<TState, TConfig, R>;

  /** Typed defineService — env/preflight/paramsSchema see typed config. */
  defineService(
    options: ServiceDefinition<TConfig>,
  ): ServiceDefinition<TConfig>;
}

/**
 * Bind a CLI's configSchema and optional registry once; reuse the returned
 * typed definers across every command/trigger/service in the impl.
 *
 * ```ts
 * // impl/src/framework.ts
 * import { z } from 'zod';
 * import { createTypes, defineRegistry } from 'ph-clint';
 * import { PhClintProject } from 'ph-clint-app';
 *
 * const configSchema = z.object({ projectDocumentId: z.string().optional() });
 * const registry = defineRegistry([PhClintProject] as const);
 *
 * export const { defineCommand, defineTrigger, defineService } =
 *   createTypes({ configSchema, registry });
 * ```
 *
 * Runtime is a thin pass-through. All type narrowing lives on the TypedFactory
 * interface. The returned definers attach the config/registry closure metadata
 * so future tooling (phase 3 createDocumentChangeTrigger, phase 4 codegen) can
 * introspect them if needed.
 */
export function createTypes<
  TSchema extends z.ZodType,
  R extends DocumentRegistry = AnyRegistry,
>(
  _opts: CreateTypesOptions<TSchema, R>,
): TypedFactory<z.infer<TSchema>, R> {
  return {
    defineCommand: baseDefineCommand as TypedFactory<z.infer<TSchema>, R>['defineCommand'],
    defineTrigger: baseDefineTrigger as TypedFactory<z.infer<TSchema>, R>['defineTrigger'],
    defineService: baseDefineService,
  };
}
```

**Why the runtime is just a cast-pass-through:** Phase 2 has no runtime behavior to add. The closure over `configSchema` and `registry` is only consumed by Phase 3's `createDocumentChangeTrigger`, which needs the registry to know which `documentType` strings are valid and to pre-filter events. When Phase 3 lands, `createTypes`'s runtime body grows to store `{ configSchema, registry }` in a closure and Phase 3's helper reads it.

**Design note — why `defineService` is a straight pass-through:** `ServiceDefinition<TConfig>` already exists and flows config through `env`/`preflight`. The `TypedFactory.defineService` wrapper adds nothing today — but including it in the returned bundle keeps the surface consistent for impl authors ("all my definers come from the same place").

### 5. Migrate `ph-clint-cli/src/triggers/spec-change.ts`

**Step 1** — In `packages/ph-clint-cli/ph-clint-cli/src/cli.ts` (or a new `src/framework.ts` — your call; `src/framework.ts` is cleaner and Phase 4 will formalize this as a codegen-owned file):

```ts
// src/framework.ts
import { z } from 'zod';
import { createTypes, defineRegistry } from 'ph-clint';
// NOTE: Phase 4 replaces this deep import with `from 'ph-clint-app'`.
import { PhClintProject } from 'ph-clint-app/document-models/ph-clint-project';

export const configSchema = z.object({
  projectDocumentId: z.string().optional(),
  // … any existing fields
});

export const registry = defineRegistry([PhClintProject] as const);

export const { defineCommand, defineTrigger, defineService } =
  createTypes({ configSchema, registry });

export type Config = z.infer<typeof configSchema>;
export type Registry = typeof registry;
```

**Step 2** — Rewrite `src/triggers/spec-change.ts`:

```ts
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { defineTrigger } from '../framework.js';
import { generateProject } from '../codegen/index.js';
import { specFromDocumentState } from '../spec/from-document.js';
import type { ClintProjectSpec } from '../spec/types.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project' as const;
// … HASH_DIR, HASH_FILE, hashSpec, canonicalJson etc. — unchanged helper funcs

interface SpecChangeState {
  pending: number;
}

export const specChangeTrigger = defineTrigger<SpecChangeState>({
  id: 'spec-change',
  type: 'condition',

  state: () => ({ pending: 0 }),

  async setup(ctx) {
    // ctx.context.config is typed as Config (no cast!)
    // ctx.state is typed as SpecChangeState (no cast!)
    const log = ctx.context.log;
    const on = ctx.context.on;
    if (!on) {
      log?.debug(`${TAG} no event bus on CoreContext — running poll-only`);
      return;
    }

    on('powerhouse:document:changed', (payload) => {
      // payload is typed: { changeType: 'updated'; documents: Array<…> }
      const targetId = ctx.context.config.projectDocumentId;
      const ids = payload.documents.map((d) => d.header.id);
      log?.debug(`${TAG} raw payload: ${JSON.stringify(payload)}`);
      if (targetId && ids.length > 0 && !ids.includes(targetId)) {
        log?.debug(`${TAG} ignored change event (target=${targetId}, docs=[${ids.join(', ')}])`);
        return;
      }
      ctx.state.pending += 1;
      log?.debug(`${TAG} queued change event (pending=${ctx.state.pending})`);
    });
    // Kick off initial reconcile.
    ctx.state.pending = 1;
  },

  async poll(ctx): Promise<WorkItem | null> {
    if (!ctx.state.pending) return null;
    ctx.state.pending = 0;

    const reactor = await ctx.reactor();
    if (!reactor) return null;

    const configuredId = ctx.context.config.projectDocumentId;
    const docId =
      configuredId ??
      (await findProjectDocumentId(reactor.client, reactor.driveId));
    if (!docId) return null;

    // … persist docId to local config if needed (existing logic) …

    // reactor.client.get with registry-typed T — returns PhClintProjectDocument.
    const doc = await reactor.client.get<typeof DOCUMENT_TYPE>(docId);
    const spec = specFromDocumentState(doc.state.global);
    if (!spec) return null;

    // … hash compare + work-item return (unchanged) …
  },
});
```

Notice what went away:
- `import type { TriggerContext, WorkItem } from 'ph-clint'` — still imported where used, but no generic parameters needed at call sites inside the file.
- `import { isPhClintProjectDocument, type PhClintProjectDocument } from 'ph-clint-app/document-models/ph-clint-project'` — **gone**. `reactor.client.get<DOCUMENT_TYPE>(docId)` already returns the concrete doc type.
- `ctx.state.pending = 0 as number` — gone. `ctx.state: SpecChangeState`.
- `ctx.state.pending as number` — gone. Same reason.
- `const cfg = ctx.context.config as { projectDocumentId?: string } | undefined;` — gone. `ctx.context.config.projectDocumentId` is typed.
- `(payload as { documents?: Array<…> } | undefined)?.documents ?? []` — gone. Payload is typed.

What stays (reason = phase 3 target, not phase 2):
- Manual event handler + pending counter + `findProjectDocumentId` helper + hash compare. Phase 3's `createDocumentChangeTrigger` collapses all of this into one helper.

**Step 3** — Update `src/cli.ts` to import from `./framework.js`:

```ts
export { configSchema } from './framework.js';
```

Or inline the binding into `cli.ts` if that's simpler given the current structure. `framework.ts` is recommended because Phase 4 codegens it anyway.

### 6. Verify `ServiceDefinition<TConfig>` ergonomics

Grep the codebase for existing `defineService(...)` call sites in examples / ph-clint-cli. Confirm:

```ts
const svc = defineService({
  id: 'my-service',
  env: (config, params) => ({
    // config here should be typed as TConfig, not Record<string, unknown>
    PORT: String(config.port),
  }),
  // …
});
```

If `config` isn't inferring correctly, the fix is:
- In `CliOptions.services`, `services?: ServiceDefinition<z.infer<TSchema> & z.infer<TSecrets>>[]` is already declared in `core/types.ts:657` — verify.
- In `createTypes().defineService`, the parameter type is `ServiceDefinition<TConfig>` — explicit.

No API change expected — but write a `.test-d.ts` assertion to lock it in.

## Tests

### Compile-time type tests

**`packages/ph-clint/tests/types/trigger.test-d.ts`**

```ts
import { expectTypeOf } from 'expect-type';
import { defineTrigger } from 'ph-clint';
import type { RegistryEntry, TriggerContext } from 'ph-clint';

type TestRegistry = {
  'test/doc': RegistryEntry<{ global: { name: string } }>;
};
type TestConfig = { projectId: string };

const trigger = defineTrigger<{ pending: number }, TestConfig, TestRegistry>({
  id: 't',
  type: 'condition',
  state: () => ({ pending: 0 }),
  async setup(ctx) {
    expectTypeOf(ctx.state).toEqualTypeOf<{ pending: number }>();
    expectTypeOf(ctx.context.config).toEqualTypeOf<TestConfig>();
    expectTypeOf(ctx.context.on).toBeFunction();

    ctx.context.on?.('powerhouse:document:changed', (data) => {
      expectTypeOf(data.documents).toEqualTypeOf<
        Array<TestRegistry['test/doc']['document']>
      >();
    });
  },
  async poll(ctx) {
    expectTypeOf(ctx.state.pending).toBeNumber();
    const reactor = await ctx.reactor();
    if (reactor) {
      const doc = await reactor.client.get<'test/doc'>('id');
      expectTypeOf(doc).toEqualTypeOf<TestRegistry['test/doc']['document']>();
    }
    return null;
  },
});

// Assigning non-initialized state is a type error.
defineTrigger<{ pending: number }, TestConfig, TestRegistry>({
  id: 't2',
  type: 'condition',
  // No `state` initializer → `ctx.state` starts empty; assignments still typed.
  async setup(ctx) {
    // @ts-expect-error — ctx.state.pending is number, can't assign string
    ctx.state.pending = 'x';
  },
  async poll() { return null; },
});
```

**`packages/ph-clint/tests/types/binding.test-d.ts`**

```ts
import { expectTypeOf } from 'expect-type';
import { z } from 'zod';
import { createTypes, defineRegistry } from 'ph-clint';

// Mock DocumentModelModule — actual type only matters for defineRegistry.
declare const FakeModule: import('document-model').DocumentModelModule<{
  global: { foo: string };
  local: Record<string, never>;
  // … PHBaseState shape
}> & { documentModel: { id: 'test/fake' } };

const configSchema = z.object({ port: z.number(), host: z.string() });
const registry = defineRegistry([FakeModule] as const);

const { defineCommand, defineTrigger, defineService } = createTypes({
  configSchema,
  registry,
});

// defineCommand: ctx.config typed.
defineCommand({
  id: 'c',
  description: '',
  inputSchema: z.object({ x: z.string() }),
  async execute(input, ctx) {
    expectTypeOf(ctx.config).toEqualTypeOf<{ port: number; host: string }>();
    expectTypeOf(input.x).toBeString();
    return null;
  },
});

// defineTrigger: no need to re-pass TConfig/R.
defineTrigger<{ count: number }>({
  id: 't',
  type: 'condition',
  state: () => ({ count: 0 }),
  async poll(ctx) {
    expectTypeOf(ctx.state.count).toBeNumber();
    expectTypeOf(ctx.context.config).toEqualTypeOf<{ port: number; host: string }>();
    return null;
  },
});

// defineService: config typed in env/preflight.
defineService({
  id: 's',
  command: 'my-cmd',
  env: (config) => {
    expectTypeOf(config).toEqualTypeOf<{ port: number; host: string }>();
    return { PORT: String(config.port) };
  },
});
```

### Runtime tests

Add one Jest test in `packages/ph-clint/tests/routine.test.ts` (or a new file) asserting that:

1. A trigger defined with `state: () => ({ count: 42 })` starts with `ctx.state.count === 42` by the time `setup()` runs.
2. Without `state`, `ctx.state` is `{}`.
3. `state()` is called exactly once per trigger instance (not per tick).

These are cheap to write against the existing routine harness.

### Regression

- `pnpm test` in `packages/ph-clint/` — green, ≥95% coverage.
- `pnpm build` in `packages/ph-clint-cli/ph-clint-cli/` — green (spec-change compiles, no casts).
- All 8 examples `pnpm build` green.

## Acceptance criteria

- [ ] `createTypes({ configSchema, registry })` exported from `ph-clint`.
- [ ] `TypedFactory` type exported from `ph-clint`.
- [ ] `defineTrigger<TState, TConfig, R>` signature available on top-level `ph-clint` export.
- [ ] `TriggerContext<TState, TConfig, R>` replaces the old `TriggerContext`.
- [ ] `state: () => TState` initializer works at runtime (new Jest test passes).
- [ ] `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` has **zero** `as` casts on `ctx.context.config`, `ctx.state`, `reactor.client.get(...)`, or event payload.
- [ ] `isPhClintProjectDocument` is no longer imported in `spec-change.ts` (replaced by registry-typed `get`).
- [ ] `packages/ph-clint-cli/ph-clint-cli/src/framework.ts` exists and exports `defineCommand`/`defineTrigger`/`defineService`.
- [ ] `pnpm test:types` in `packages/ph-clint/` passes.
- [ ] Jest suites stay green across ph-clint and all examples; coverage ≥ 95%.

## Pitfalls & decisions

1. **Widening in storage**: `CliOptions.triggers: Trigger[]` needs to be stored as `Trigger<any, any, any>[]` internally because the framework holds triggers from different impls with different TState. Don't try to unify. The generics only matter **inside** each trigger's own closure.

2. **`state: () => TState` vs `initialState: TState`**: Prefer the function. Matches the "defineX factories" pattern used elsewhere in the framework and avoids accidentally sharing mutable initial state across trigger instances (not an issue today — one trigger per CLI — but cheap insurance).

3. **`createTypes` runtime is currently a no-op beyond pass-through**: That's fine. Phase 3's `createDocumentChangeTrigger` will need the registry value at runtime to pre-filter events by documentType; at that point, `createTypes` gets a real body that stores `{ configSchema, registry }` and the returned `createDocumentChangeTrigger` closes over it. Until then, keep the body minimal.

4. **Don't add `createDocumentChangeTrigger` to `TypedFactory` yet**: Defer to Phase 3. The interface is reserved for it but not implemented in Phase 2. If you add it now with a placeholder, Phase 3 will have to change the exported types — worse than adding it clean later.

5. **`defineCli` generic inference**: `defineCli<TSchema, TSecrets>({ configSchema, secretsSchema, … })` already exists. Verify that when a user also passes `registry`, the registry flows into… nothing yet in Phase 2. In Phase 4, ph-clint-cli codegen puts the registry only inside `createTypes(...)`, not in `defineCli({ … })`. So `CliOptions.registry` doesn't need to exist. The registry reaches the framework via `configureReactor({ create: (ctx) => buildDefaultReactor(ctx, { registry, … }) })`.

6. **Don't migrate example 06 in this phase**: That's Phase 3's job, because the migration is only clean with `createDocumentChangeTrigger`. Migrating it here would require writing the same casts-eliminating rewrite twice. Keep Phase 2 focused on ph-clint-cli's spec-change.

7. **`framework.ts` naming**: The impl's binding file. Other names considered: `types.ts`, `bindings.ts`, `defs.ts`. `framework.ts` is descriptive — "this is where ph-clint's framework types get bound to this specific CLI". Phase 4 codegens this exact file.

## Rollout checklist

1. Extend `TriggerContext` / `TriggerOptions` / `Trigger` with `<TState, TConfig, R>` generics.
2. Update `defineTrigger` signature; `trigger.ts` runtime is still a pass-through.
3. Update `routine.ts` (or wherever `TriggerContext` is constructed) to call `trigger.state?.()` on instance creation.
4. Write `types-binding.ts` with `createTypes` and `TypedFactory`.
5. Re-export `createTypes` and `TypedFactory` from `src/index.ts`.
6. Write `.test-d.ts` type tests; confirm `pnpm test:types` passes.
7. Write the runtime Jest test for the state initializer.
8. Create `packages/ph-clint-cli/ph-clint-cli/src/framework.ts`.
9. Migrate `src/triggers/spec-change.ts` to use `defineTrigger` from `../framework.js`. Drop every cast. Remove the `isPhClintProjectDocument` import.
10. `pnpm test && pnpm build` in `packages/ph-clint/`.
11. `pnpm build` in `packages/ph-clint-cli/ph-clint-cli/` and every example.
12. Commit: `feat(types): createTypes binding + typed TriggerContext (phase 2)`.
