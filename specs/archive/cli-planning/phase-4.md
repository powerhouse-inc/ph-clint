# Phase 4 — ClintProjectSpec as a document model (in `ph-clint-app`)

**Goal:** Replace the JSON file with a live Powerhouse document model edited in Connect (Service A), and drive code generation via Clint's routine + a document-change trigger.

## 4.1 Create the document model

Done via the standard Powerhouse Vetra flow against Clint's own `ph-clint-app`:
1. `cd packages/ph-clint-cli/ph-clint-app && pnpm vetra` (starts Vetra).
2. Create a `powerhouse/ph-clint-project` document model with state matching the `ClintProjectSpec` zod schema from Phase 3.
3. Create operations for each field: `SET_NAME`, `SET_SCOPE`, `SET_FEATURE_POWERHOUSE`, `ADD_SERVICE`, `ADD_SKILL`, etc.
4. Create an editor `ph-clint-project-editor` that renders the spec form (form fields + toggle switches).
5. Export `documentModels` and `editors` from `ph-clint-app/index.ts`.
6. In `ph-clint-cli/src/cli.ts`, register this document model:
   ```ts
   cli.configureReactor({
     create: (ctx) => buildDefaultReactor(ctx, {
       documentModels,
       drive: { name: 'Clint Projects' },
       subscriptions: { documentTypes: ['powerhouse/ph-clint-project'] },
     }),
     switchboard: { enabled: true, port: 4802 },
     connect: { enabled: true, port: 3001, workdir: phClintAppDir },
   });
   ```

## 4.2 Document-change trigger → regen

Location: `packages/ph-clint-cli/ph-clint-cli/src/triggers/spec-change.ts`

Uses `defineTrigger({ type: 'condition' })` with `setup()` subscribing via `ctx.on('powerhouse:document:changed', …)` (the pattern already used in example 06). On each change:
1. Load the latest `ph-clint-project` document state.
2. Convert to `ClintProjectSpec` via a simple state-to-spec adapter.
3. Diff against the last-applied spec (stored in `.ph/ph-clint-cli/.last-spec-hash`).
4. If different: enqueue a `function` work item that calls `generateProject(spec, targetDir, 'update')`.
5. On success, update the hash file.

## 4.3 Bootstrap path for existing JSON-spec projects

The `init` command still writes `project-spec.json`. On first Clint start, a small migration copies that JSON into a newly created Powerhouse document (via `addActions`) and renames the JSON file to `.project-spec.json.migrated`. From then on, Connect is the source of truth.

## 4.4 Service B

Location: `packages/ph-clint-cli/ph-clint-cli/src/services/impl-dev.ts`

A `defineService({ id: 'impl-dev', ... })` that:
- Runs `pnpm dev` in the impl project's root (or `{name}-cli/` if split).
- **Pre-flight check**: reads the current spec and errors out if none of Mastra / routine / Powerhouse-switchboard / Powerhouse-connect is enabled.
- Readiness pattern: `/Local:\s*(https?:\/\/[^\s]+)/` (Connect) when Powerhouse is on, or a generic ph-clint REPL ready line otherwise.
- Captures the Connect URL as an endpoint so the CLI can surface it alongside Clint's own Connect URL.

## 4.5 Deliverables of Phase 4

- Editing a field in the ph-clint-project editor regenerates the impl project within the next routine tick (2s default).
- Toggling Powerhouse on in the editor triggers the flat→split migration automatically.
- `ph-clint services start impl-dev` works when at least one servable feature is on; otherwise prints a clear "nothing to serve" hint.
