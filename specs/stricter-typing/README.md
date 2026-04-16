# ph-clint stricter typing — implementation plan

## Source issue

See [`specs/issues/ph-clint-type-safety.md`](../issues/ph-clint-type-safety.md) for the full problem statement and evidence. Short version: ph-clint erases type information at every impl-facing boundary (reactor client is `any`, event payloads are `unknown`, `TriggerContext` has no generics, config only propagates into commands). Every impl project pays an "untype tax" — manual casts, hand-mirrored state shapes, deep-path imports, runtime-only detection of upstream API changes.

## Goal

Make "working with a typed document state from an impl project" **the default path**. When a dev writes a trigger, service, or command that touches a Powerhouse document, they should get:

- Typed `ctx.context.config` from the CLI's `configSchema` — no casts.
- Typed `ctx.state` from a `state: () => TState` initializer — no casts.
- Typed `reactor.client.get(id, 'my-type')` returning the concrete document shape — no type params, no guards.
- Typed `reactor.client.subscribe({ documentTypes: ['my-type'] }, event => …)` with narrowed payload — no reverse-engineering.
- Typed `reactor.client.execute(id, 'main', [myAction(…)])` with the document's action union autocompleted.
- Typed `on('powerhouse:document:changed', data => …)` — no payload guessing.
- Top-level imports from the impl's reactor package — no `impl-app/document-models/foo/v1/gen/types` paths.

## Design decisions (already locked in)

1. **No backward-compat shims.** No production impls exist yet. Single typed surface; break what needs breaking.
2. **Wrap the full `IReactorClient` PHDocument surface.** Not just hot paths. The value prop of ph-clint is a low-friction sandbox for devs who don't know Powerhouse internals — every call that touches a `PHDocument`, `Action`, or `documentType` string gets narrowed via the registry. Non-document methods (`loadBatch`, `getJobStatus`, `deleteDocument`, …) pass through unchanged via `extends Omit<IReactorClient, …>`.
3. **Registry entry carries document + actions + state**, not just the document:
   ```ts
   interface RegistryEntry<S, A> { document: PHDocument<S>; actions: A; state: S; }
   type DocumentRegistry = Record<string, RegistryEntry>;
   ```
   This lets us narrow `execute(actions)` to the target document's action union — the biggest single DX win after `get`.
4. **`defineRegistry([M1, M2] as const)` with literal-type inference.** Terse for impls. Requires generated module files to use `satisfies DocumentModelModule<…>` instead of `: DocumentModelModule<…>` — handled by codegen in Phase 4. Fallback if inference fails: explicit object form `defineRegistry({ 'my/type': Module })`.
5. **Binding-helper pattern via `createTypes({ configSchema, registry })`.** One binding per CLI returns pre-typed `defineCommand` / `defineTrigger` / `defineService` / `createDocumentChangeTrigger`. Users don't re-pass generics at every call site. Runtime is a thin pass-through; types do the work.
6. **Typed event bus via declaration merging.** `PhClintEvents<R>` interface enumerates framework-emitted events. `on` / `emit` become overloaded: typed for known events, fallback `unknown` for user-defined events.
7. **`ReactorContext<R>` carries the registry type.** Propagated from `CliOptions.registry` through `CoreContext<TConfig, R>` and `CommandContext<TConfig, R>` into every callback. Default `R = AnyRegistry` preserves the loose shape for CLIs without a registry.
8. **No generic for the client class itself.** `IReactorClient` is imported via `import type` — zero runtime cost, no optional-peer-dep problem. Previous "generic TClient" idea rejected as over-engineering.

## Phases (in order)

Each phase is a single commit, testable in isolation, and assumes the prior phases are merged.

| Phase | Title | Scope |
|---|---|---|
| 1 | [Framework type surface](./phase-1-framework-types.md) | Replace `any` in powerhouse integration. Introduce `DocumentRegistry`, `TypedReactorClient<R>`, `PhClintEvents<R>`, typed event bus. Thread `R` through `ReactorContext` / `CoreContext` / `CommandContext`. No behavior change; existing impl keeps its casts. |
| 2 | [Binding helper & trigger generics](./phase-2-createtypes-binding.md) | `TriggerContext<TState, TConfig, R>` with `state: () => TState` initializer. `ServiceDefinition<TConfig>` already exists — verify end-to-end. New `createTypes({ configSchema, registry })` returns pre-typed `defineCommand` / `defineTrigger` / `defineService`. Migrate `ph-clint-cli` spec-change to use it (casts disappear but structure stays). |
| 3 | [Typed document-change trigger helper](./phase-3-document-change-trigger.md) | Ship `createDocumentChangeTrigger<T>` in `ph-clint/integrations/powerhouse`. Rewrite `ph-clint-cli/src/triggers/spec-change.ts` against it — from ~320 lines to ~20. Rewrite `examples/06-connect-agent/agent-cli/src/trigger.ts` against it to validate ergonomics for a second impl shape. |
| 4 | [Codegen-emitted registry & top-level re-exports](./phase-4-codegen-registry.md) | ph-clint-cli codegen emits `src/framework.ts` per impl with `createTypes({ configSchema, registry })`. Generated document-model modules use `satisfies` to preserve literal `id`. Impl's reactor package (`ph-clint-app`) re-exports document types, action creators, and guards from a top-level `index.ts` so impl code never imports deep paths. |

## Success criteria (across all phases)

- Zero `any` in `packages/ph-clint/src/integrations/powerhouse/` and `packages/ph-clint/src/core/types.ts`.
- `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts`: zero `as` casts on `ctx.context.config`, `ctx.state`, `reactor.client.get(…)`, or event payloads.
- `examples/06-connect-agent/agent-cli/src/trigger.ts`: same — zero casts.
- Impl code imports from `ph-clint-app` (root), not `ph-clint-app/document-models/<name>/v1`.
- New compile-time type-tests under `packages/ph-clint/tests/types/` cover the typed client, typed events, and typed trigger context.
- Existing test suite (`pnpm test` in `packages/ph-clint/`) stays green; 95% coverage preserved.

## What's explicitly out of scope

- Typing `AgentProvider` / Mastra output streams beyond the existing `StreamChunk` union (separate concern).
- Typing service-manager captured endpoints (ReadinessPattern captures) — those are runtime-discovered strings; typing would add churn for little gain.
- Typing `ProcessManager.run()` — shell-out ergonomics, not the integration surface that drives the complaint.
- Narrowing `IReactorClient.loadBatch`, `getJobStatus`, `waitForJob`, `deleteDocument*` — job- and delete-flavored methods don't benefit from registry narrowing.
