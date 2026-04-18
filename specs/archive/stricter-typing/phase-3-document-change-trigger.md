# Phase 3 — Typed document-change trigger helper

**Goal:** Ship `createDocumentChangeTrigger<T>` in `ph-clint/integrations/powerhouse`. It collapses the "subscribe to events + filter by documentType + debounce via pending counter + load doc + narrow/guard + call onChange" pattern into a one-line trigger definition. Rewrite the two existing consumers — `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` and `examples/06-connect-agent/agent-cli/src/trigger.ts` — against the helper. The spec-change trigger drops from ~320 to ~40 user-authored lines; the example 06 trigger becomes trivially composable.

## Context for future Claude

Read these first:
- [`specs/issues/ph-clint-type-safety.md`](../issues/ph-clint-type-safety.md) — problem statement.
- [`specs/stricter-typing/README.md`](./README.md) — overall plan, design decisions.
- [`specs/stricter-typing/phase-1-framework-types.md`](./phase-1-framework-types.md) — framework types phase.
- [`specs/stricter-typing/phase-2-createtypes-binding.md`](./phase-2-createtypes-binding.md) — binding helper phase.
- [`CLAUDE.md`](../../CLAUDE.md) — repo conventions.

**Prerequisites:** Phases 1 and 2 merged. You have:
- `TypedReactorClient<R>`, `DocumentRegistry`, `RegistryEntry`, `TypedDocumentChangeEvent<R, T>` from Phase 1.
- `TriggerContext<TState, TConfig, R>` with `state: () => TState` initializer from Phase 2.
- `createTypes({ configSchema, registry })` returning typed `defineCommand` / `defineTrigger` / `defineService`.
- `ph-clint-cli/ph-clint-cli/src/framework.ts` binding file.
- `ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` migrated to `defineTrigger` from `../framework.js`, no casts, but still with manual event handler + pending counter + hash compare logic.
- `examples/06-connect-agent/agent-cli/src/trigger.ts` **unchanged** — still the hand-written `createDocumentChangeTrigger` callback pattern. Phase 3 replaces it.

**Key constraint:** This phase adds a helper *and* migrates the two real consumers. Tests for both consumers must remain green.

## Background — what the helper needs to do

Read [`examples/06-connect-agent/agent-cli/src/trigger.ts`](../../examples/06-connect-agent/agent-cli/src/trigger.ts) for the minimal pattern, then `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` for the extended pattern. Common responsibilities:

1. **Subscribe** to `powerhouse:document:changed` via the event bus on `setup()`.
2. **Filter** incoming events by documentType (helper) and optionally a specific documentId (user-supplied).
3. **Coalesce** multiple events into a single poll cycle (pending counter).
4. **Initial reconcile**: optionally fire once on startup before any event.
5. **Load** the target document via `reactor.client.get(...)`.
6. **Guard/narrow** the result to the concrete document type.
7. **Call user `onChange(doc, ctx)`** and forward its `WorkItem | null` return.

The helper owns 1–6. Impl code only writes 7 — the user's `onChange` handler. Plus optional: a `filter(doc) => boolean` for skip-conditions that need the full document (e.g., "skip if this change was caused by the agent itself").

## Scope

### Files touched

| File | Change |
|---|---|
| `packages/ph-clint/src/integrations/powerhouse/change-trigger.ts` | **New.** Export `createDocumentChangeTrigger<T, TConfig, R, TState>(options)`. |
| `packages/ph-clint/src/integrations/powerhouse/index.ts` | Re-export `createDocumentChangeTrigger` and its options type. |
| `packages/ph-clint/src/index.ts` | Top-level re-export. |
| `packages/ph-clint/src/core/types-binding.ts` | Extend `TypedFactory` with `createDocumentChangeTrigger<T>` — a pre-bound version that doesn't take `R` / `TConfig` at the call site. |
| `packages/ph-clint-cli/ph-clint-cli/src/framework.ts` | Destructure `createDocumentChangeTrigger` from `createTypes(...)` return. |
| `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` | Rewrite using `createDocumentChangeTrigger`. Keep only the hash-compare + regen logic. |
| `examples/06-connect-agent/agent-cli/src/trigger.ts` | **Delete** the hand-written `createDocumentChangeTrigger` export. |
| `examples/06-connect-agent/agent-cli/src/cli.ts` (or wherever it's wired) | Use `createDocumentChangeTrigger` from `ph-clint` instead. |
| `packages/ph-clint/tests/integrations/change-trigger.test.ts` | **New.** Runtime tests for the helper. |
| `packages/ph-clint/tests/types/change-trigger.test-d.ts` | **New.** Compile-time type tests. |

### Files NOT touched

- Other ph-clint-cli triggers (none today, but if any are added pre-phase-3, they stay as-is).
- Other examples (07, 08) — they don't have document-change triggers today.
- ph-clint-cli codegen templates — Phase 4.

## Detailed design

### 1. `createDocumentChangeTrigger` signature

`packages/ph-clint/src/integrations/powerhouse/change-trigger.ts` (new):

```ts
import type { z } from 'zod';
import type { DocumentRegistry, AnyRegistry } from './types.js';
import type {
  Trigger,
  TriggerContext,
  WorkItem,
  Logger,
} from '../../core/types.js';

export interface DocumentChangeTriggerOptions<
  R extends DocumentRegistry,
  T extends keyof R & string,
  TConfig = Record<string, unknown>,
  TState = Record<string, unknown>,
> {
  /** Unique trigger id for logging/routing. */
  id: string;

  /** The document type to watch. Must be a key in the registry. */
  documentType: T;

  /**
   * The specific document id (or a function that resolves one from context).
   * When omitted, the helper watches ALL documents of `documentType` on the
   * default drive and fires `onChange` for each that changes in a tick cycle.
   *
   * When a function is provided, it's resolved lazily on each poll. Returning
   * `undefined` skips the tick.
   */
  documentId?:
    | string
    | ((ctx: TriggerContext<TState, TConfig, R>) => Promise<string | undefined>);

  /**
   * Fire once on startup before any event arrives — useful for reconciling
   * against the current document state. Default: true.
   */
  initialReconcile?: boolean;

  /**
   * Optional predicate: called after loading the document, before onChange.
   * Return false to skip this tick (no work item produced). Useful for
   * de-duping when the impl can't use the registry-supplied hash compare.
   */
  filter?: (
    doc: R[T]['document'],
    ctx: TriggerContext<TState, TConfig, R>,
  ) => boolean | Promise<boolean>;

  /**
   * User's change handler. Receives the loaded, type-narrowed document and
   * the full trigger context. Returns a work item for the routine loop to
   * execute (or null to skip).
   */
  onChange: (
    doc: R[T]['document'],
    ctx: TriggerContext<TState, TConfig, R>,
  ) => Promise<WorkItem | null>;

  /**
   * Optional initial state for the trigger's private slot. Defaults to
   * `{ pending: 0 }`.
   */
  state?: () => TState;
}

/**
 * Build a Trigger that listens for document change events on the event bus,
 * coalesces them, loads the target document, narrows to the registered type,
 * and hands it to the user's onChange handler.
 *
 * Runtime behavior:
 *  1. setup() subscribes to `powerhouse:document:changed`. For each event,
 *     if the documentType matches, bump the pending counter.
 *  2. If `initialReconcile !== false`, also bump pending once on startup.
 *  3. poll() returns null unless pending > 0. When pending > 0, it resolves
 *     the target docId (from `documentId` option), loads the doc via
 *     `reactor.client.get<T>(id)`, applies `filter` if present, and calls
 *     `onChange(doc, ctx)`. The result is returned as the WorkItem.
 *  4. pending is reset to 0 after each poll drain.
 *
 * The payload-id-filtering in step 1 compares against `documentId` if that's
 * a literal string. For function-form `documentId`, filtering is deferred to
 * poll time (all events bump the counter; poll resolves and filters).
 */
export function createDocumentChangeTrigger<
  R extends DocumentRegistry,
  T extends keyof R & string,
  TConfig = Record<string, unknown>,
  TState extends { pending: number } = { pending: number },
>(
  options: DocumentChangeTriggerOptions<R, T, TConfig, TState>,
): Trigger<TState, TConfig, R> {
  const initialReconcile = options.initialReconcile !== false;

  return {
    id: options.id,
    type: 'condition',
    state: options.state ?? (() => ({ pending: 0 } as TState)),

    async setup(ctx) {
      const log = ctx.context.log;
      const on = ctx.context.on;
      if (!on) {
        log?.debug(`[${options.id}] no event bus on CoreContext — poll-only mode`);
        if (initialReconcile) ctx.state.pending = 1;
        return;
      }

      on('powerhouse:document:changed', (payload) => {
        // payload is typed by Phase 1's PhClintEvents<R>.
        const matches = payload.documents.some(
          (d) => d.header.documentType === options.documentType,
        );
        if (!matches) return;

        // If documentId is a literal string, pre-filter on id as well.
        if (typeof options.documentId === 'string') {
          const ids = payload.documents.map((d) => d.header.id);
          if (!ids.includes(options.documentId)) return;
        }

        ctx.state.pending += 1;
        log?.debug(`[${options.id}] queued change (pending=${ctx.state.pending})`);
      });

      if (initialReconcile) ctx.state.pending = 1;
    },

    async poll(ctx): Promise<WorkItem | null> {
      if (!ctx.state.pending) return null;
      ctx.state.pending = 0;

      const reactor = await ctx.reactor();
      if (!reactor) return null;

      const docId =
        typeof options.documentId === 'function'
          ? await options.documentId(ctx)
          : options.documentId;
      if (!docId) return null;

      const doc = await reactor.client.get<T>(docId);

      if (options.filter) {
        const ok = await options.filter(doc, ctx);
        if (!ok) return null;
      }

      return options.onChange(doc, ctx);
    },
  };
}
```

### 2. Extend `TypedFactory`

`packages/ph-clint/src/core/types-binding.ts` — add to `TypedFactory`:

```ts
import type { DocumentChangeTriggerOptions } from '../integrations/powerhouse/change-trigger.js';
import { createDocumentChangeTrigger as baseCreateDocChangeTrigger } from '../integrations/powerhouse/change-trigger.js';

export interface TypedFactory<TConfig, R extends DocumentRegistry> {
  // … existing defineCommand/defineTrigger/defineService …

  /**
   * Typed document-change trigger — TConfig and R are pre-bound from createTypes.
   * User only specifies T (documentType) and optionally TState.
   */
  createDocumentChangeTrigger<
    T extends keyof R & string,
    TState extends { pending: number } = { pending: number },
  >(
    options: DocumentChangeTriggerOptions<R, T, TConfig, TState>,
  ): Trigger<TState, TConfig, R>;
}

// In createTypes():
return {
  defineCommand: /* … */,
  defineTrigger: /* … */,
  defineService: /* … */,
  createDocumentChangeTrigger: baseCreateDocChangeTrigger as TypedFactory<TConfig, R>['createDocumentChangeTrigger'],
};
```

### 3. Rewrite `ph-clint-cli/src/triggers/spec-change.ts`

From ~320 lines to ~60 (including the hash-compare helpers, which stay):

```ts
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkItem } from 'ph-clint';
import { createDocumentChangeTrigger } from '../framework.js';
import { generateProject } from '../codegen/index.js';
import { specFromDocumentState } from '../spec/from-document.js';
import type { ClintProjectSpec } from '../spec/types.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project' as const;
const HASH_DIR = path.join('.ph', 'ph-clint-cli');
const HASH_FILE = '.last-spec-hash';
const TAG = '[spec-change]';

function getHashPath(targetDir: string): string {
  return path.join(targetDir, HASH_DIR, HASH_FILE);
}

async function readLastSpecHash(targetDir: string): Promise<string | null> {
  try {
    return (await fs.readFile(getHashPath(targetDir), 'utf8')).trim() || null;
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeLastSpecHash(targetDir: string, hash: string): Promise<void> {
  const file = getHashPath(targetDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, hash + '\n', 'utf8');
}

export function hashSpec(spec: ClintProjectSpec): string {
  return crypto.createHash('sha256').update(canonicalJson(spec), 'utf8').digest('hex');
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') + '}';
}

export const specChangeTrigger = createDocumentChangeTrigger({
  id: 'spec-change',
  documentType: DOCUMENT_TYPE,
  documentId: async (ctx) => ctx.context.config.projectDocumentId,

  async onChange(doc, ctx): Promise<WorkItem | null> {
    const log = ctx.context.log;
    // doc is PhClintProjectDocument — typed via registry, no casts.
    const spec = specFromDocumentState(doc.state.global);
    if (!spec) {
      log?.debug(`${TAG} document state did not validate, skipping`);
      return null;
    }

    const targetDir = ctx.context.workdir;
    const nextHash = hashSpec(spec);
    const prevHash = await readLastSpecHash(targetDir);
    if (nextHash === prevHash) return null;

    return {
      type: 'function',
      params: {
        fn: async () => {
          log?.info(`${TAG} regenerating project at ${targetDir}`);
          const t0 = Date.now();
          const warnings: string[] = [];
          const result = await generateProject({
            targetDir,
            spec,
            mode: 'update',
            onWarn: (m) => warnings.push(m),
          });
          await writeLastSpecHash(targetDir, nextHash);
          log?.info(
            `${TAG} regenerated in ${Date.now() - t0}ms: ${result.files.length} written, ${result.skipped.length} skipped, ${result.deleted.length} deleted`,
          );
          for (const w of warnings) log?.warn(`${TAG} ${w}`);
        },
      },
      callbacks: {
        onFailure: (err) => {
          log?.error(`${TAG} regen failed: ${err.message}`);
        },
      },
    };
  },
});
```

**What disappeared from the trigger**:
- The whole subscription setup.
- `pending` counter management.
- `findProjectDocumentId` helper (superseded by config-driven `documentId`; for first-time discovery see pitfall #3).
- `extractDocIds` payload parser.
- Event handler casts.
- `isPhClintProjectDocument` guard import.
- The deep `PhClintProjectDocument` type import.

**What stayed**: the hash-compare logic (ph-clint-cli-specific — not worth generalizing), and the regen work-item body.

### 4. Migrate example 06

`examples/06-connect-agent/agent-cli/src/trigger.ts` — delete the hand-written helper. If it's only the helper, delete the whole file.

In `examples/06-connect-agent/agent-cli/src/cli.ts` (or wherever the trigger is registered), replace the hand-rolled one with:

```ts
import { createDocumentChangeTrigger } from '../framework.js';  // once example 06 gets a framework.ts

export const agentChatTrigger = createDocumentChangeTrigger({
  id: 'agent-chat',
  documentType: 'powerhouse/agent-chat',  // or whatever example 06 uses
  // No documentId — watch all chat docs on the drive.
  async onChange(doc, ctx) {
    // existing logic from onDocumentChanged, now with typed `doc`
    // …
  },
});
```

Note: example 06 may not have a `framework.ts` yet — Phase 2 only migrated ph-clint-cli. Either add `framework.ts` to example 06 now as part of Phase 3, or import `createDocumentChangeTrigger` directly from `ph-clint` and pass explicit generics. Adding `framework.ts` is recommended (dogfoods the pattern, consistent with ph-clint-cli).

### 5. Update re-exports

`packages/ph-clint/src/integrations/powerhouse/index.ts`:

```ts
export { createDocumentChangeTrigger } from './change-trigger.js';
export type { DocumentChangeTriggerOptions } from './change-trigger.js';
```

`packages/ph-clint/src/index.ts`:

```ts
export { createDocumentChangeTrigger } from './integrations/powerhouse/change-trigger.js';
export type { DocumentChangeTriggerOptions } from './integrations/powerhouse/change-trigger.js';
```

## Tests

### Runtime tests

**`packages/ph-clint/tests/integrations/change-trigger.test.ts`**

Use the existing in-memory event bus and mock reactor patterns from other tests. Cases:

1. **Event fires, matching documentType, documentId matches (string form)**: `setup()` bumps pending. `poll()` loads doc via `reactor.client.get(docId)`, calls `onChange`, returns its WorkItem.
2. **Event fires, non-matching documentType**: pending stays 0. `poll()` returns null.
3. **Event fires, matching documentType, non-matching documentId (string)**: pending stays 0.
4. **Event fires, matching documentType, documentId is a function**: pending bumps, poll resolves documentId dynamically, loads and handles.
5. **`documentId` function returns `undefined`**: poll returns null, pending stays drained.
6. **`filter` returns false**: poll returns null, no WorkItem even though doc loaded.
7. **`initialReconcile: true` (default)**: `setup()` bumps pending to 1 even without an event.
8. **`initialReconcile: false`**: `setup()` leaves pending at 0.
9. **Multiple events in one tick**: pending accumulates, poll drains all at once, calls `onChange` once (coalesced).
10. **No event bus on context**: `setup()` logs debug and only `initialReconcile` path works.
11. **No reactor**: `poll()` returns null gracefully.
12. **`state` custom initializer**: `ctx.state` starts with caller-supplied shape.

### Compile-time type tests

**`packages/ph-clint/tests/types/change-trigger.test-d.ts`**

```ts
import { expectTypeOf } from 'expect-type';
import { createDocumentChangeTrigger } from 'ph-clint';
import type { RegistryEntry } from 'ph-clint';

type TestRegistry = {
  'test/doc': RegistryEntry<{ global: { name: string } }>;
  'test/other': RegistryEntry<{ global: { count: number } }>;
};

// onChange receives the correctly narrowed doc.
createDocumentChangeTrigger<TestRegistry, 'test/doc'>({
  id: 't',
  documentType: 'test/doc',
  async onChange(doc, ctx) {
    expectTypeOf(doc.state.global.name).toBeString();
    // @ts-expect-error — test/doc does not have `count`
    doc.state.global.count;
    return null;
  },
});

// Unregistered documentType is a type error.
createDocumentChangeTrigger<TestRegistry, 'test/unknown'>({
  id: 't2',
  // @ts-expect-error — 'test/unknown' not in registry
  documentType: 'test/unknown',
  async onChange() { return null; },
});

// documentId function receives typed ctx.
createDocumentChangeTrigger<TestRegistry, 'test/doc'>({
  id: 't3',
  documentType: 'test/doc',
  documentId: async (ctx) => {
    // ctx.context.config is untyped here (no TypedFactory binding)
    return 'some-id';
  },
  async onChange() { return null; },
});
```

Also add a case using `createTypes(...).createDocumentChangeTrigger` to verify TConfig/R binding.

### Regression

- `pnpm test` in `packages/ph-clint/` — green, coverage ≥ 95%.
- `pnpm test:types` green.
- `pnpm build` + `pnpm test` in `packages/ph-clint-cli/ph-clint-cli/` — spec-change tests still cover regen flow.
- `pnpm build` + `pnpm test` in `examples/06-connect-agent/agent-cli/` — chat-trigger tests still pass.

## Acceptance criteria

- [ ] `createDocumentChangeTrigger` exported from `ph-clint` top-level.
- [ ] `TypedFactory.createDocumentChangeTrigger` available on `createTypes(...)` return.
- [ ] `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts`:
  - [ ] Uses `createDocumentChangeTrigger` from `../framework.js`.
  - [ ] Under 80 user-authored LOC (down from ~320).
  - [ ] No manual event subscription, no pending counter, no payload parsing.
  - [ ] No import of `isPhClintProjectDocument` or `PhClintProjectDocument`.
- [ ] `examples/06-connect-agent/agent-cli/src/trigger.ts`:
  - [ ] Deleted, or reduced to a re-export / thin wrapper.
  - [ ] Callers use `createDocumentChangeTrigger` from `ph-clint` (or example-local `framework.ts`).
- [ ] Runtime tests cover all 12 cases listed above.
- [ ] `.test-d.ts` locks in type narrowing and `@ts-expect-error` cases.
- [ ] `pnpm test` green across `packages/ph-clint`, `packages/ph-clint-cli/*`, and all 8 examples.

## Pitfalls & decisions

1. **`TState extends { pending: number }` constraint**: The helper manages `pending` internally. If a user wants extra state alongside `pending`, they can extend the shape via the `state` initializer: `state: () => ({ pending: 0, lastSeen: 0 })` with `TState = { pending: number; lastSeen: number }`. Keep the constraint — it's the contract the helper needs.

2. **Coalescing**: Multiple events within a tick become **one** `onChange` call. This is the right default (Powerhouse tends to emit multiple change events for a single logical update). If a consumer needs per-event processing, they can fall back to hand-rolled `defineTrigger` — document this explicitly in the JSDoc.

3. **First-time documentId discovery**: spec-change today has fallback logic: "if no `projectDocumentId` is configured, scan the drive for any `powerhouse/ph-clint-project` document and pin the first one to local config". That logic **does not belong in the helper** — it's impl-specific. Keep it in spec-change's `documentId` resolver:

   ```ts
   documentId: async (ctx) => {
     if (ctx.context.config.projectDocumentId) return ctx.context.config.projectDocumentId;
     const reactor = await ctx.reactor();
     if (!reactor) return undefined;
     const found = await findFirstProjectDoc(reactor.client, reactor.driveId);
     if (found) await persistConfiguredId(ctx, found);
     return found;
   },
   ```

   Helper `findFirstProjectDoc` and `persistConfiguredId` stay as local functions in `spec-change.ts`. Kept small.

4. **`initialReconcile: true` by default**: The two real consumers both want this. If an impl doesn't, they set `initialReconcile: false`. Defaulting true matches the 80% case.

5. **Don't filter by documentId in the event handler when it's a function**: Calling an async function inside the event handler is a footgun (reactor isn't available, config may change). Defer filtering to poll: all events bump pending; poll resolves docId and loads. If docId is `undefined`, poll returns null. This is correct and simpler than trying to cache across ticks.

6. **The helper is a `Trigger`, not a factory of triggers**: Calling `createDocumentChangeTrigger({ … })` returns one Trigger instance. If an impl needs to watch two documentTypes, they call the helper twice. No multiplexing.

7. **Logging tag**: The helper logs `[<id>]` — the trigger's id. Impl code that wraps it and adds its own tag (like `[spec-change]`) should log from inside `onChange`/`filter`, not the helper.

8. **Why the helper lives under `integrations/powerhouse` and not `core`**: It's Powerhouse-specific — closes over `powerhouse:document:changed` event semantics. Keep the `core` layer integration-agnostic.

9. **`TypedFactory` addition is additive**: Phase 2 reserved the slot for this method. Phase 3 fills it in. No existing consumer breaks.

## Rollout checklist

1. Write `packages/ph-clint/src/integrations/powerhouse/change-trigger.ts`.
2. Add to `integrations/powerhouse/index.ts` and top-level `src/index.ts`.
3. Extend `TypedFactory` in `types-binding.ts` with `createDocumentChangeTrigger`.
4. Write `tests/integrations/change-trigger.test.ts` (12 cases).
5. Write `tests/types/change-trigger.test-d.ts`.
6. `pnpm test && pnpm test:types && pnpm build` in `packages/ph-clint/`.
7. In `packages/ph-clint-cli/ph-clint-cli/src/framework.ts`, destructure `createDocumentChangeTrigger` from `createTypes(...)`.
8. Rewrite `src/triggers/spec-change.ts` using the helper.
9. Update `src/cli.ts` if the trigger registration path changed (shouldn't have).
10. `pnpm test && pnpm build` in `packages/ph-clint-cli/ph-clint-cli/`.
11. In `examples/06-connect-agent/agent-cli/`, add `src/framework.ts` with its own `createTypes` binding (use whatever the example's configSchema + registry look like).
12. Delete `examples/06-connect-agent/agent-cli/src/trigger.ts` (or reduce to nothing).
13. Update `examples/06-connect-agent/agent-cli/src/cli.ts` to use the framework-level helper.
14. `pnpm test && pnpm build` in `examples/06-connect-agent/agent-cli/`.
15. Run `pnpm build` in the other 7 examples to ensure no collateral breakage.
16. Commit: `feat(types): createDocumentChangeTrigger helper + migrate consumers (phase 3)`.
