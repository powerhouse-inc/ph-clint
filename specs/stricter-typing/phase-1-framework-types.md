# Phase 1 — Framework type surface

**Goal:** Eliminate every `any` at the ph-clint integration boundary. Introduce the core types (`DocumentRegistry`, `TypedReactorClient<R>`, `PhClintEvents<R>`) and thread the registry generic `R` through `ReactorContext<R>` / `CoreContext<TConfig, R>` / `CommandContext<TConfig, R>` / `EventBus<R>`. No runtime behavior changes. No impl-facing ergonomics changes yet — the `ph-clint-cli` spec-change trigger keeps its casts until Phase 2.

## Context for future Claude

Read these first:
- [`specs/issues/ph-clint-type-safety.md`](../issues/ph-clint-type-safety.md) — full problem statement.
- [`specs/stricter-typing/README.md`](./README.md) — overall plan and locked-in design decisions.
- [`CLAUDE.md`](../../CLAUDE.md) — repo conventions (pnpm, example-driven TDD, `pnpm build` after library changes, 95% coverage bar).

**Prerequisites:** None. This is the first phase.

**Key constraint:** Phase 1 must not change runtime behavior. It is purely a type refactor. Impl code (the `ph-clint-cli` spec-change trigger, example 06 trigger) can keep its `as` casts for now — those disappear in Phase 2/3. This constraint keeps the diff reviewable and the blast radius contained.

## Background — why phase 1 comes first

The registry generic `R` is load-bearing for every later phase:
- Phase 2's `createTypes({ configSchema, registry })` returns a `TypedFactory<TConfig, R>`. It can't exist without `R` already threaded through `CommandContext` and `TriggerContext`.
- Phase 3's `createDocumentChangeTrigger<T extends keyof R & string>` can't exist without `TypedReactorClient<R>` and typed events.
- Phase 4's codegen emits `createTypes(...)` bindings; that depends on the helper existing.

So phase 1 lays the type infrastructure. Everything else is built on top.

## Scope

### Files touched

| File | Change |
|---|---|
| `packages/ph-clint/src/integrations/powerhouse/types.ts` | Rewrite. Remove all `any`. Add `DocumentRegistry`, `RegistryEntry`, `AnyRegistry`, `TypedReactorClient<R>`, `TypedDocumentChangeEvent<R, T>`. Generic-ify `ReactorContext<R>`, `PowerhouseIntegrationOptions<R>`, `SubscriptionConfig<R>`, `ReactorSetupContext<R>`, `ReactorConfiguration<R>`. |
| `packages/ph-clint/src/integrations/powerhouse/registry.ts` | **New.** Export `defineRegistry(modules)` helper and `InferRegistry<T>` mapped type. |
| `packages/ph-clint/src/integrations/powerhouse/subscriptions.ts` | Replace `any, any` with `IReactorClient` and `DocumentChangeEvent` imports. Typed emit sites. |
| `packages/ph-clint/src/integrations/powerhouse/reactor.ts` | `documentModels: any[]` → `DocumentModelModule[]`. Return type remains opaque (it's the internal module wrapper; callers access it only via `ReactorContext`). |
| `packages/ph-clint/src/integrations/powerhouse/index.ts` | `buildDefaultReactor<R>` generic. Re-export `defineRegistry`, `DocumentRegistry`, `RegistryEntry`, `TypedReactorClient`, `PhClintEvents`. |
| `packages/ph-clint/src/core/types.ts` | Add `PhClintEvents<R>`, `EmitFn<R>`, `OnFn<R>`. Generic-ify `EventBus<R>`, `CoreContext<TConfig, R>`, `CommandContext<TConfig, R>`. Update `Routine.setCapabilities`, `AgentSetupContext`, `Cli.configureReactor`. |
| `packages/ph-clint/src/core/events.ts` | `createEventBus<R>()` signature. Internals unchanged. |
| `packages/ph-clint/src/core/cli.ts` | Propagate `R` generic from `CliOptions` (not added here — comes from default `AnyRegistry`) into contexts when building `CommandContext`. |
| `packages/ph-clint/src/index.ts` | Re-export new public types. |
| `packages/ph-clint/tests/types/powerhouse-client.test-d.ts` | **New.** Compile-time type tests. |
| `packages/ph-clint/tests/types/events.test-d.ts` | **New.** Compile-time type tests. |
| `packages/ph-clint/package.json` | Add `expect-type` (devDependency) for `.test-d.ts` compile-time assertions. |

### Files NOT touched

- `packages/ph-clint/src/core/trigger.ts` — generic upgrades land in Phase 2.
- `packages/ph-clint/src/core/services.ts` — `TConfig` propagation verification lands in Phase 2.
- `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts` — keeps its casts until Phase 2/3.
- `examples/06-connect-agent/agent-cli/src/trigger.ts` — same.
- ph-clint-cli codegen templates — Phase 4.

## Detailed design

### 1. `packages/ph-clint/src/integrations/powerhouse/types.ts`

```ts
/**
 * Types for the Powerhouse integration.
 *
 * All Powerhouse types are imported via `import type` — erased at runtime,
 * no peer-dep coupling at the module level. @powerhousedao/reactor is still
 * an optional peer for runtime, but types flow freely.
 */

import type {
  IReactorClient,
  DocumentChangeEvent,
  SearchFilter,
  ViewFilter,
  PagingOptions,
  PagedResults,
  Operation,
  OperationFilter,
  PropagationMode,
  CreateDocumentOptions,
  BatchLoadRequest,
  BatchLoadResult,
  JobInfo,
} from '@powerhousedao/reactor';
import type {
  DocumentModelModule,
  PHDocument,
  Action,
  PHBaseState,
} from 'document-model';
import type { WorkdirStore } from '../../core/types.js';

// ── Registry ──────────────────────────────────────────────────────

/**
 * One entry in a DocumentRegistry. Carries enough to narrow every
 * IReactorClient method that touches a PHDocument or Action.
 *
 * - `document` — the concrete PHDocument shape returned by `get`, `create`, etc.
 * - `actions` — union of Action types accepted by `execute` / `executeAsync`.
 * - `state` — the global state shape, used by `DocumentModelModule<S>` introspection.
 */
export interface RegistryEntry<
  S extends PHBaseState = PHBaseState,
  A extends Action = Action,
> {
  document: PHDocument<S>;
  actions: A;
  state: S;
}

/**
 * Maps a documentType string → RegistryEntry. Impls build one with
 * `defineRegistry([Module1, Module2] as const)`; see registry.ts.
 */
export type DocumentRegistry = Record<string, RegistryEntry>;

/**
 * Fallback registry used when a CLI doesn't declare one.
 * Every slot resolves to the base PHDocument / Action shapes.
 * `R = AnyRegistry` is the default for ReactorContext, CoreContext, etc.
 */
export type AnyRegistry = Record<string, RegistryEntry>;

// ── Typed client ──────────────────────────────────────────────────

/**
 * Typed view over IReactorClient. Every method that takes a documentType
 * string, returns a PHDocument, or accepts an Action is re-declared with
 * registry-derived types. All other methods are inherited via `Omit<…>`.
 *
 * Runtime: the underlying object IS an IReactorClient — we only cast at the
 * ReactorContext boundary. No runtime wrapping, no perf cost.
 */
export interface TypedReactorClient<R extends DocumentRegistry>
  extends Omit<
    IReactorClient,
    | 'get'
    | 'getChildren'
    | 'getParents'
    | 'find'
    | 'getOperations'
    | 'getDocumentModelModule'
    | 'create'
    | 'createEmpty'
    | 'createDocumentInDrive'
    | 'execute'
    | 'executeAsync'
    | 'rename'
    | 'addChildren'
    | 'removeChildren'
    | 'moveChildren'
    | 'subscribe'
  > {
  get<T extends keyof R & string>(
    identifier: string,
    view?: ViewFilter,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  getChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  getParents<T extends keyof R & string = keyof R & string>(
    childIdentifier: string,
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  find<T extends keyof R & string = keyof R & string>(
    search: Omit<SearchFilter, 'documentTypes'> & { documentTypes?: T[] },
    view?: ViewFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<R[T]['document']>>;

  getOperations<T extends keyof R & string = keyof R & string>(
    documentIdentifier: string,
    view?: ViewFilter,
    filter?: OperationFilter,
    paging?: PagingOptions,
    signal?: AbortSignal,
  ): Promise<PagedResults<Operation<R[T]['actions']>>>;

  getDocumentModelModule<T extends keyof R & string>(
    documentType: T,
  ): Promise<DocumentModelModule<R[T]['state']>>;

  create<T extends keyof R & string>(
    document: R[T]['document'],
    parentIdentifier?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  createEmpty<T extends keyof R & string>(
    documentModelType: T,
    options?: CreateDocumentOptions,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  createDocumentInDrive<T extends keyof R & string>(
    driveId: string,
    document: R[T]['document'],
    parentFolder?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  execute<T extends keyof R & string>(
    documentIdentifier: string,
    branch: string,
    actions: Array<R[T]['actions']>,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  executeAsync<T extends keyof R & string>(
    documentIdentifier: string,
    branch: string,
    actions: Array<R[T]['actions']>,
    signal?: AbortSignal,
  ): Promise<JobInfo>;

  rename<T extends keyof R & string = keyof R & string>(
    documentIdentifier: string,
    name: string,
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  addChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  removeChildren<T extends keyof R & string = keyof R & string>(
    parentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<R[T]['document']>;

  moveChildren<T extends keyof R & string = keyof R & string>(
    sourceParentIdentifier: string,
    targetParentIdentifier: string,
    documentIdentifiers: string[],
    branch?: string,
    signal?: AbortSignal,
  ): Promise<{ source: R[T]['document']; target: R[T]['document'] }>;

  subscribe<T extends keyof R & string>(
    search: Omit<SearchFilter, 'documentTypes'> & { documentTypes?: T[] },
    callback: (event: TypedDocumentChangeEvent<R, T>) => void,
    view?: ViewFilter,
  ): () => void;
}

/** Narrowed DocumentChangeEvent carrying registry-typed documents. */
export interface TypedDocumentChangeEvent<
  R extends DocumentRegistry,
  T extends keyof R & string = keyof R & string,
> extends Omit<DocumentChangeEvent, 'documents'> {
  documents: Array<R[T]['document']>;
}

// ── Reactor context ───────────────────────────────────────────────

export interface ReactorContext<R extends DocumentRegistry = AnyRegistry> {
  /** The Reactor client — typed CRUD + subscription API. */
  client: TypedReactorClient<R>;
  /** The default drive ID (created or found on startup). */
  driveId: string;
  /** Phase 2: Switchboard GraphQL URL. */
  switchboardUrl?: string;
  /** Phase 2: Switchboard drive URL. */
  driveUrl?: string;
  /** Phase 2: Switchboard MCP URL. */
  mcpUrl?: string;
  /** Phase 3: Connect web UI URL. */
  connectUrl?: string;
  /** Internal: the ReactorClientModule. Opaque at the public type level. */
  _module?: unknown;
  /** Teardown — called by the framework on CLI exit. */
  shutdown(): Promise<void>;
}

export interface DriveConfig {
  name: string;
  icon?: string;
}

export interface SubscriptionConfig<R extends DocumentRegistry = AnyRegistry> {
  documentTypes?: Array<keyof R & string>;
}

export interface SwitchboardConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  preflight?: boolean;
}

export interface ConnectConfig {
  enabled: boolean;
  port?: number;
  workdir?: string;
}

export interface PowerhouseIntegrationOptions<
  R extends DocumentRegistry = AnyRegistry,
> {
  documentModels: DocumentModelModule[];
  registry?: R;
  drive?: DriveConfig;
  subscriptions?: SubscriptionConfig<R>;
  switchboard?: SwitchboardConfig;
  connect?: ConnectConfig;
}

export interface ReactorSetupContext<
  R extends DocumentRegistry = AnyRegistry,
> {
  workdir: string;
  config: Record<string, unknown>;
  workspace: WorkdirStore;
  emit?: import('../../core/types.js').EmitFn<R>;
  on?: import('../../core/types.js').OnFn<R>;
  switchboard?: SwitchboardConfig;
}

export interface ReactorConfiguration<
  R extends DocumentRegistry = AnyRegistry,
> {
  create: (ctx: ReactorSetupContext<R>) => Promise<ReactorContext<R>>;
  connect?: ConnectConfig;
  switchboard?: SwitchboardConfig;
}

export interface SwitchboardInstance {
  switchboardUrl: string;
  driveUrl: string;
  mcpUrl: string;
  shutdown(): Promise<void>;
}
```

### 2. `packages/ph-clint/src/integrations/powerhouse/registry.ts` (new)

```ts
import type { DocumentModelModule, PHDocument, Action, PHBaseState } from 'document-model';
import type { DocumentRegistry, RegistryEntry } from './types.js';

/**
 * Helper type: extract the action union from a DocumentModelModule.
 * DocumentModelModule.actions is { [actionName]: (input) => Action } — the
 * return types of those creators are the module's action union.
 *
 * If the module's actions map isn't typed tightly enough, the union collapses
 * to `Action` and execute/executeAsync narrowing falls back to the base. Not
 * a correctness problem — just a DX degradation for that one module.
 */
export type ActionOf<M> =
  M extends { actions: infer Actions }
    ? Actions extends Record<string, (...args: any[]) => infer A>
      ? A
      : Action
    : Action;

/**
 * Infer a DocumentRegistry from a readonly tuple of DocumentModelModule instances.
 *
 * Literal inference requires the module to expose `documentModel.id` as a
 * literal type. Phase 4 changes codegen to emit `as const satisfies
 * DocumentModelModule<…>` for this reason. Modules typed with `:` annotations
 * erase `id` to `string` and will produce a single-keyed `{ [x: string]: … }`
 * registry — enough for `R[T]['document']` narrowing at usage sites where the
 * caller supplies a literal `T`, but `keyof R & string` collapses to `string`
 * (no autocomplete for documentTypes lists).
 */
export type InferRegistry<
  T extends ReadonlyArray<DocumentModelModule<any>>,
> = {
  [M in T[number] as Extract<M['documentModel']['id'], string>]: M extends DocumentModelModule<
    infer S
  >
    ? RegistryEntry<S, ActionOf<M>>
    : never;
};

/**
 * Build a DocumentRegistry from a tuple of DocumentModelModules.
 *
 * ```ts
 * const registry = defineRegistry([PhClintProject, DocumentDrive] as const);
 * // typeof registry:
 * // {
 * //   'powerhouse/ph-clint-project': RegistryEntry<PhClintProjectPHState, PhClintProjectAction>;
 * //   'powerhouse/document-drive':   RegistryEntry<DocumentDrivePHState, DocumentDriveAction>;
 * // }
 * ```
 *
 * Runtime value is a plain object keyed by `documentModel.id`. Used for
 * diagnostic logging and as the runtime lookup in createDocumentChangeTrigger
 * (phase 3). Not strictly needed at runtime today — we carry it so consumers
 * can introspect registered types.
 */
export function defineRegistry<
  const T extends ReadonlyArray<DocumentModelModule<any>>,
>(modules: T): InferRegistry<T> {
  const out: Record<string, unknown> = {};
  for (const mod of modules) {
    out[mod.documentModel.id] = mod;
  }
  return out as InferRegistry<T>;
}
```

### 3. `packages/ph-clint/src/integrations/powerhouse/subscriptions.ts`

```ts
import type { IReactorClient, DocumentChangeEvent } from '@powerhousedao/reactor';
import type {
  SubscriptionConfig,
  DocumentRegistry,
  AnyRegistry,
} from './types.js';
import type { EmitFn } from '../../core/types.js';

export function bridgeSubscriptions<R extends DocumentRegistry = AnyRegistry>(
  client: IReactorClient,
  subscriptions: SubscriptionConfig<R>,
  emit: EmitFn<R>,
): () => void {
  const search: { documentTypes?: string[] } = {};
  if (subscriptions.documentTypes) {
    search.documentTypes = subscriptions.documentTypes as string[];
  }

  return client.subscribe(search, (event: DocumentChangeEvent) => {
    try {
      switch (event.type) {
        case 'created':
          for (const doc of event.documents ?? []) {
            emit('powerhouse:document:created', {
              documentId: doc.header.id,
              documentType: doc.header.documentType as keyof R & string,
            });
          }
          break;
        case 'updated':
          emit('powerhouse:document:changed', {
            changeType: 'updated',
            documents: event.documents as Array<R[keyof R & string]['document']>,
          });
          break;
        case 'deleted':
          for (const doc of event.documents ?? []) {
            emit('powerhouse:document:deleted', { documentId: doc.header.id });
          }
          break;
      }
    } catch {
      // Don't crash the bus on handler errors.
    }
  });
}
```

### 4. `packages/ph-clint/src/integrations/powerhouse/reactor.ts`

Only type changes; runtime body unchanged. `documentModels: any[]` → `DocumentModelModule[]`. Return type of `buildReactor` stays `Promise<ReactorClientModule>` (import that type from `@powerhousedao/reactor` via `import type`). The `lazyImport` pattern is preserved — runtime coupling stays optional; types are erased.

```ts
import type { DocumentModelModule } from 'document-model';
import type { ReactorClientModule } from '@powerhousedao/reactor';

export interface BuildReactorOptions {
  documentModels: DocumentModelModule[];
  storagePath: string;
  enableSync?: boolean;
}

export async function buildReactor(
  options: BuildReactorOptions,
): Promise<ReactorClientModule> { /* body unchanged */ }
```

### 5. `packages/ph-clint/src/core/types.ts` — typed event bus + generic-ify contexts

Add these, and update every existing interface that references `EventBus`, `emit`, `on`, `CoreContext`, `CommandContext`, or `ReactorContext`:

```ts
import type { DocumentRegistry, AnyRegistry, ReactorContext } from '../integrations/powerhouse/types.js';

// ── Framework events ──────────────────────────────────────────────

export interface PhClintEvents<R extends DocumentRegistry = AnyRegistry> {
  'powerhouse:ready': { driveId: string };
  'powerhouse:document:changed': {
    changeType: 'updated';
    documents: Array<R[keyof R & string]['document']>;
  };
  'powerhouse:document:created': {
    documentId: string;
    documentType: keyof R & string;
  };
  'powerhouse:document:deleted': { documentId: string };
}

export type EmitFn<R extends DocumentRegistry = AnyRegistry> = {
  <K extends keyof PhClintEvents<R>>(event: K, data: PhClintEvents<R>[K]): void;
  (event: string, data?: unknown): void;
};

export type OnFn<R extends DocumentRegistry = AnyRegistry> = {
  <K extends keyof PhClintEvents<R>>(
    event: K,
    handler: (data: PhClintEvents<R>[K]) => void,
  ): void;
  (event: string, handler: (data?: unknown) => void): void;
};

export interface EventBus<R extends DocumentRegistry = AnyRegistry> {
  emit: EmitFn<R>;
  on: OnFn<R>;
  off: OnFn<R>;
}

// ── Command / Core context ────────────────────────────────────────

export interface CommandContext<
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  workdir: string;
  workspace: WorkdirStore;
  config: TConfig;
  stdout: (text: string) => void;
  log?: Logger;
  routine?: Routine;
  processes?: ProcessManager;
  services?: ServiceManager;
  emit?: EmitFn<R>;
  on?: OnFn<R>;
  reactor?: () => Promise<ReactorContext<R> | undefined>;
  agent?: () => Promise<AgentProvider | undefined>;
}

export type CoreContext<
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> = Omit<CommandContext<TConfig, R>, 'reactor' | 'agent'>;
```

Update `TriggerContext` **minimally** — just pass the registry through, don't add `TState` / `TConfig` generics yet (Phase 2):

```ts
export interface TriggerContext<R extends DocumentRegistry = AnyRegistry> {
  context: CoreContext<Record<string, unknown>, R>;
  state: Record<string, unknown>;
  reactor: () => Promise<ReactorContext<R> | undefined>;
  agent: () => Promise<AgentProvider | undefined>;
}
```

Update `Routine.setCapabilities`, `AgentSetupContext`, `Cli.configureReactor`:

```ts
interface Routine {
  // …
  setCapabilities<R extends DocumentRegistry = AnyRegistry>(caps: {
    getReactor?: () => Promise<ReactorContext<R> | undefined>;
    getAgent?: () => Promise<AgentProvider | undefined>;
  }): void;
}

interface Cli {
  // …
  configureReactor<R extends DocumentRegistry = AnyRegistry>(
    config: import('../integrations/powerhouse/types.js').ReactorConfiguration<R>,
  ): void;
}
```

### 6. `packages/ph-clint/src/core/events.ts`

Signature change only:

```ts
export function createEventBus<R extends DocumentRegistry = AnyRegistry>(): EventBus<R>;
```

Internals unchanged (it's a plain map of listeners keyed by string).

### 7. `packages/ph-clint/src/core/cli.ts`

Wherever the CLI builds a `CommandContext` to pass into `command.execute(…)`, the `reactor` and `emit`/`on` fields should flow through as `ReactorContext<R>` / `EmitFn<R>` / `OnFn<R>`. Phase 1: default `R = AnyRegistry` everywhere — no impl-facing change.

When `cli.configureReactor(...)` is called, record the `R` via an internal field so Phase 2's `createTypes` can wire the same registry through its returned factory.

### 8. `packages/ph-clint/src/index.ts` — public re-exports

Add:

```ts
export { defineRegistry } from './integrations/powerhouse/registry.js';
export type { InferRegistry, ActionOf } from './integrations/powerhouse/registry.js';
export type {
  DocumentRegistry,
  RegistryEntry,
  AnyRegistry,
  TypedReactorClient,
  TypedDocumentChangeEvent,
  ReactorContext,
  PowerhouseIntegrationOptions,
  SubscriptionConfig,
  ReactorConfiguration,
  ReactorSetupContext,
} from './integrations/powerhouse/types.js';
export type { PhClintEvents, EmitFn, OnFn, EventBus } from './core/types.js';
```

Remove the old non-generic `ReactorContext` / `SubscriptionConfig` / etc. re-exports (they're replaced above).

## Tests

### Compile-time type tests (new)

Add `expect-type` as a devDependency. Create `packages/ph-clint/tests/types/`.

**`packages/ph-clint/tests/types/powerhouse-client.test-d.ts`**

```ts
import { expectTypeOf } from 'expect-type';
import type {
  ReactorContext,
  RegistryEntry,
  TypedReactorClient,
} from 'ph-clint';

// Minimal hand-rolled registry — doesn't depend on impl packages.
type TestDoc = { header: { id: string; documentType: 'test/doc' }; state: { global: { name: string } } };
type TestAction = { type: 'SET_NAME'; input: { name: string } };
type TestRegistry = {
  'test/doc': RegistryEntry<{ global: { name: string } }, TestAction>;
};

declare const reactor: ReactorContext<TestRegistry>;

// `get` with explicit literal type narrows to concrete document.
const doc = await reactor.client.get<'test/doc'>('id');
expectTypeOf(doc).toEqualTypeOf<TestRegistry['test/doc']['document']>();

// `subscribe` with literal narrows event payload.
reactor.client.subscribe<'test/doc'>({ documentTypes: ['test/doc'] }, (ev) => {
  expectTypeOf(ev.documents[0]).toEqualTypeOf<TestRegistry['test/doc']['document']>();
});

// `execute` action input is narrowed to the document's action union.
await reactor.client.execute<'test/doc'>('id', 'main', [{ type: 'SET_NAME', input: { name: 'x' } }]);

// Pass-through methods are inherited from IReactorClient.
expectTypeOf(reactor.client.deleteDocument).toBeFunction();
expectTypeOf(reactor.client.getJobStatus).toBeFunction();

// Unregistered documentType is a type error.
// @ts-expect-error — 'unknown/type' not in registry
reactor.client.get<'unknown/type'>('id');

// @ts-expect-error — 'unknown/type' not in registry
reactor.client.subscribe({ documentTypes: ['unknown/type'] }, () => {});
```

**`packages/ph-clint/tests/types/events.test-d.ts`**

```ts
import { expectTypeOf } from 'expect-type';
import type { OnFn, EmitFn, RegistryEntry } from 'ph-clint';

type TestRegistry = {
  'test/doc': RegistryEntry<{ global: { name: string } }>;
};

declare const on: OnFn<TestRegistry>;
declare const emit: EmitFn<TestRegistry>;

// Framework events are typed.
on('powerhouse:document:changed', (data) => {
  expectTypeOf(data.changeType).toEqualTypeOf<'updated'>();
  expectTypeOf(data.documents).toEqualTypeOf<
    Array<TestRegistry['test/doc']['document']>
  >();
});

on('powerhouse:document:created', (data) => {
  expectTypeOf(data.documentType).toEqualTypeOf<'test/doc'>();
});

on('powerhouse:document:deleted', (data) => {
  expectTypeOf(data.documentId).toBeString();
});

// User events fall through to `unknown`.
on('my:custom:event', (data) => {
  expectTypeOf(data).toEqualTypeOf<unknown>();
});

// emit enforces framework event payloads.
emit('powerhouse:document:changed', {
  changeType: 'updated',
  documents: [],
});

// @ts-expect-error — wrong payload shape for framework event
emit('powerhouse:document:created', { foo: 'bar' });
```

### Jest config for `.test-d.ts`

`.test-d.ts` files are type-checked by `tsc`, not executed by Jest. Add a dedicated script:

```json
"test:types": "tsc --noEmit -p tests/types/tsconfig.json"
```

With `tests/types/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "include": ["**/*.test-d.ts"],
  "compilerOptions": { "noEmit": true }
}
```

And chain it in `test`:

```json
"test": "pnpm test:types && NODE_OPTIONS='--experimental-vm-modules' jest --coverage --detectOpenHandles"
```

### Regression tests

No existing Jest test should break. Run `pnpm test` inside `packages/ph-clint/` — should be green. 95% coverage preserved (we're not adding runtime code; nothing to cover beyond the already-covered event-bus and subscription-bridge paths).

## Acceptance criteria

- [ ] Zero occurrences of ` any` (space + any) or `: any` in `packages/ph-clint/src/integrations/powerhouse/*.ts`.
- [ ] Zero `any` in `packages/ph-clint/src/core/types.ts`.
- [ ] `pnpm test` in `packages/ph-clint/` passes; coverage ≥ 95%.
- [ ] `pnpm test:types` in `packages/ph-clint/` passes.
- [ ] `pnpm build` in `packages/ph-clint/` succeeds.
- [ ] `pnpm build` in `packages/ph-clint-cli/ph-clint-cli/` succeeds without touching any impl source (casts on `ctx.context.config`, `ctx.state`, `reactor.client.get(...)` still work because the cast targets are assignable to the new typed shapes via `AnyRegistry`).
- [ ] `pnpm build` in each of `examples/01` through `examples/08` succeeds.
- [ ] `reactor.client.get(id)` without a type parameter returns `AnyRegistry[keyof AnyRegistry & string]['document']` — i.e. `PHDocument`. Impl casts still compile.

## Pitfalls & decisions

1. **`import type` vs `import`**: Use `import type` for every Powerhouse type (`@powerhousedao/reactor`, `document-model`, `@powerhousedao/shared/document-model`). Runtime imports remain via the existing `lazyImport` pattern. This gives us full typing with zero peer-dep coupling at module load.

2. **`PHDocument` type parameter**: `PHDocument` from `document-model` takes a `PHBaseState` generic. `RegistryEntry` exposes `state: S` separately so `getDocumentModelModule` can return `DocumentModelModule<R[T]['state']>` while `get` returns `R[T]['document']` (i.e. `PHDocument<S>`). Don't collapse these.

3. **`ActionOf<M>` inference can fail silently**: If `DocumentModelModule.actions` isn't typed as a record of creator functions, `ActionOf<M>` collapses to `Action`. That's a DX degradation (no action-union narrowing on `execute`), not a correctness bug. Test it manually against `PhClintProject` (import the module, check `ActionOf<typeof PhClintProject>` in the `.test-d.ts` — expect a proper union; if it comes back as `Action`, note in the Phase 4 plan to tighten the generated actions type).

4. **Generated modules erase literal `id`**: The current `PhClintProject` module uses `: DocumentModelModule<…>` annotation, which widens `id` to `string`. Phase 1 will work with that erasure — `InferRegistry` will produce `{ [x: string]: RegistryEntry<PhClintProjectPHState, …> }`. Usable but the `keyof R & string` collapses to `string` (no autocomplete). **Phase 4** fixes this at codegen. Phase 1 does NOT touch impl code.

5. **`subscribe` return type**: `IReactorClient.subscribe` returns `() => void` (an unsubscribe function). Keep that. Don't re-use the existing `Unsubscribe` alias from `@powerhousedao/reactor` unless necessary — it's fine either way.

6. **Don't over-generic-ify `Routine`**: `Routine.setContext(context: CommandContext)` stays non-generic publicly — the routine stores contexts from different commands that may have different `TConfig`. Use `CommandContext<any, any>` internally or keep `Record<string, unknown>` default. The registry `R` generic only matters where impl code touches it.

7. **`Cli.configureReactor` generic inference**: When an impl calls `cli.configureReactor({ create: (ctx) => buildDefaultReactor(ctx, { registry, … }) })`, TypeScript needs to infer `R` from the `create` return type. This works because `buildDefaultReactor<R>` returns `Promise<ReactorContext<R>>` and the generic flows up. Verify by writing a `.test-d.ts` case.

8. **Don't add `registry?: R` to `CliOptions` yet**: Phase 2 introduces `createTypes({ configSchema, registry })` which is the "right" place to bind the registry. `CliOptions` stays untouched in Phase 1 — the registry flows through `configureReactor` only.

9. **`expect-type` vs `tsd`**: Prefer `expect-type` — it's smaller, runs as plain `tsc --noEmit`, no bundled checker. The assertions compile to nothing at runtime.

## Rollout checklist

1. Verify `ActionOf<typeof PhClintProject>` resolves to a proper action union — write a throw-away `.test-d.ts` against the installed module.
2. Rewrite `types.ts` end-to-end.
3. Add `registry.ts` with `defineRegistry` + `InferRegistry`.
4. Update `subscriptions.ts`, `reactor.ts`, `index.ts`.
5. Update `core/types.ts`, `core/events.ts`, `core/cli.ts`.
6. Update `src/index.ts` public exports.
7. Install `expect-type`, add `tests/types/tsconfig.json` and `test:types` script.
8. Write `powerhouse-client.test-d.ts` and `events.test-d.ts`.
9. Run `pnpm test && pnpm build` in `packages/ph-clint/`.
10. Run `pnpm build` in every example and in `packages/ph-clint-cli/ph-clint-cli/`.
11. Commit: `refactor(types): thread DocumentRegistry through framework boundary (phase 1)`.
