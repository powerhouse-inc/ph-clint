# Skill: ph-integration

## Why This Skill Exists

The Powerhouse integration is the deepest and most opinionated part of ph-clint. It wraps the Reactor component (document storage, operation replay, drive management, subscriptions) into a composition that the CLI framework manages. The integration surface includes: document registries for type safety, reactor lifecycle (create, configure, shutdown), drive management (personal vs watched, local vs remote), subscriptions for change detection, folder operations for navigation, and document change triggers for automation.

Without guidance, developers either try to use the Reactor directly (missing the typed wrapper) or misconfigure drives (creating personal drives when they need watched, or vice versa). The registry pattern — `defineRegistry([Model1, Model2] as const)` — is non-obvious but critical for type safety across the entire document pipeline.

## What The Skill Covers

- `defineRegistry()` for typed document model registration
- `buildDefaultReactor()` — the standard reactor composition
- `configureReactor` on defineCli — declarative reactor setup
- Drive configuration: personal (read/write) vs watched (read-only sync)
- Document subscriptions and event bridging
- Folder operations: listFolder, createFolder, findDocument
- Document change triggers with createDocumentChangeTrigger
- ReactorContext: client, drives, driveId, personalDriveId, shutdown

## What The Skill Does NOT Cover

- Building Switchboard/Connect applications (see `ph-app-development`)
- Document model creation (that's a Powerhouse domain skill, not a ph-clint skill)
- Agent tool conversion for document operations (see `agent-integration`)

## File Plan

### .preamble.md (~140 lines)

Powerhouse integration architecture:
- The Reactor is an in-process document engine. It loads document models, stores documents in drives, replays operation histories, and accepts new actions. ph-clint wraps it with typed accessors and lifecycle management.
- Integration is optional and lazy — Powerhouse dependencies are only imported when `configureReactor` is set on defineCli
- The registry pattern provides end-to-end type safety:
  ```
  const registry = defineRegistry([MyModel, OtherModel] as const);
  ```
  This creates a type-level map from document type strings to their state/action types. The typed reactor client then narrows `get()`, `execute()`, etc. by document type.
- `as const` on the array is critical — without it, TypeScript loses the literal types and the registry becomes `AnyRegistry`

Drive mental model:
- A drive is a collection of documents and folders (it's itself a document of type `powerhouse/document-drive`)
- `personal` role: the agent's own drive. It can create, edit, and delete documents here. The first personal drive sets `driveId` and `personalDriveId` on ReactorContext.
- `watched` role: a remote drive synced for reading. Created via `ensureRemoteDrive()`. Documents sync from the remote source but can't be edited locally.
- Most CLIs need one personal drive. Multi-drive setups are for agents that watch external data sources.

Subscriptions:
- Wire document changes to the event bus with `bridgeSubscriptions()`
- Filter by document type, document ID, or custom predicate
- Changes arrive as events that can drive triggers or command execution

Folder operations:
- `createFolderOperations(client, driveId)` gives a file-system-like API over a drive's folder hierarchy
- `listFolder(path)` → entries (documents and subfolders)
- `createFolder(path)` → creates nested folders
- `findDocument(folderPath, name)` → find by name
- Useful for organizing documents into project-based hierarchies

Pitfalls:
- Forgetting `as const` on defineRegistry array — loses type safety silently
- Using `drive` (singular) when multi-drive is needed, or vice versa
- Not awaiting reactor initialization — the reactor is created lazily on first access
- Subscribing to document types not in the registry — no type error, but no events
- Folder paths use `/` separator and are relative to drive root

### .cli-docs.md

Extract from HTML docs:
- `defineRegistry()` function and `DocumentRegistry` type
- `ReactorContext<R>` interface (client, drives, driveId, personalDriveId, shutdown)
- `ReactorSetupContext<R>` — what `configureReactor.create` receives
- `ReactorConfiguration<R>` — the `configureReactor` option shape
- `buildDefaultReactor()` and `BuildDefaultReactorOptions`
- `DriveConfig` and `DriveEntry` types
- `FolderOperations` interface (listFolder, createFolder, findDocument)
- `FolderEntry` type
- `SubscriptionConfig` type
- `createDocumentChangeTrigger()` and `DocumentChangeTriggerOptions`
- `TypedReactorClient<R>` type
- `isDocType()` type guard

### .result.md

> Reactor is configured with document models registered, drives created (personal and/or watched), and optionally subscriptions wired. Commands can access typed reactor client via `context.reactor()`. Document change triggers fire correctly.

### 00.define-registry.md

Phase: Create a typed document model registry.

Steps:
- Import document model modules (each exports a DocumentModelModule)
- Call `defineRegistry([Model1, Model2] as const)`
- The `as const` assertion is mandatory for type inference
- Verify: the registry type maps document type strings to `RegistryEntry<State, Actions>`
- Export the registry for use in createTypes and configureReactor
- If using createTypes: `const { defineCommand } = createTypes({ configSchema, registry })`

### 01.configure-reactor.md

Phase: Set up configureReactor on defineCli.

Steps:
- In codegen projects: the `@clint:begin reactor` marker region contains `cli.configureReactor(...)`. Update `project-spec.json` to set the Powerhouse level (Reactor/Switchboard/Connect) and run `{{commands.clint-project-regen.id}}` to regenerate the marker region. Never hand-edit `cli.ts` markers.
- In manual projects: add `configureReactor` call after `defineCli()`:
  ```
  cli.configureReactor({
    create: async (ctx) => buildDefaultReactor(ctx, { ... }),
  });
  ```
- `create` is the factory — called lazily on first reactor access
- Use `buildDefaultReactor(ctx, options)` for the standard composition
- The ctx parameter is `ReactorSetupContext` — has workdir, config, emit, workspace, etc.

### 02.setup-drives.md

Phase: Configure personal and watched drives.

Steps:
- Single drive (simple): `{ drive: { name: 'my-drive' } }`
- Multi-drive: `{ drives: [{ name: 'projects', role: 'personal' }, { name: 'specs', role: 'watched', remoteUrl: '...' }] }`
- Personal drive: local, read/write, sets `driveId` on ReactorContext
- Watched drive: synced from remote, read-only locally
- The first personal drive becomes the default `personalDriveId`
- Verify: `context.reactor()` then returns ReactorContext with correct driveId

### 03.add-subscriptions.md

Phase: Wire document change subscriptions to the event bus.

Steps:
- Configure subscriptions in buildDefaultReactor:
  ```
  subscriptions: {
    documentTypes: ['my-doc-type'],
    onChange: (event) => { /* handle change */ },
  }
  ```
- Or use `bridgeSubscriptions()` for manual wiring to the event bus
- Filter by document type, document ID, or both
- onChange receives typed change events when using a typed registry
- Use events to trigger re-computation, notifications, or other commands

### 04.add-folder-operations.md

Phase: Set up folder operations for document navigation.

Steps:
- Create folder operations: `const folders = createFolderOperations(reactor.client, reactor.personalDriveId)`
- Use in commands: `const entries = await folders.listFolder('projects/active')`
- Create folders: `await folders.createFolder('projects/active/new-project')`
- Find documents: `const doc = await folders.findDocument('projects', 'my-spec')`
- Optionally auto-generate folder commands: `createFolderCommands(folders)`
- Store folders instance on context or pass through command arguments

### 05.add-change-trigger.md

Phase: Create document change triggers for reactive workflows.

Steps:
- Use createDocumentChangeTrigger (from createTypes for typed version):
  ```
  const trigger = createDocumentChangeTrigger({
    id: 'spec-change',
    documentType: 'my-doc-type',
    initialReconcile: true,
    onChange: async (docs, ctx) => ({
      type: 'command',
      params: { commandId: 'regen', args: {} },
    }),
  });
  ```
- Options: documentType (single or array), documentId (string or async resolver), initialReconcile (default true), filter (per-doc predicate)
- Register in defineCli triggers array alongside routine config
- The trigger polls for document changes and produces WorkItems

## Research Before Writing

| What | Where |
|------|-------|
| `defineRegistry` | `packages/ph-clint/src/integrations/powerhouse/registry.ts` |
| Registry types | `packages/ph-clint/src/integrations/powerhouse/registry.ts` — InferRegistry, RegistryEntry |
| `buildDefaultReactor` | `packages/ph-clint/src/integrations/powerhouse/index.ts` |
| Reactor builder | `packages/ph-clint/src/integrations/powerhouse/reactor.ts` |
| Drive management | `packages/ph-clint/src/integrations/powerhouse/drives.ts` |
| Folder operations | `packages/ph-clint/src/integrations/powerhouse/folders.ts` |
| Subscriptions | `packages/ph-clint/src/integrations/powerhouse/subscriptions.ts` |
| Document change trigger | `packages/ph-clint/src/integrations/powerhouse/change-trigger.ts` |
| Type guard (isDocType) | `packages/ph-clint/src/integrations/powerhouse/type-guard.ts` |
| ReactorContext type | `packages/ph-clint/src/core/types.ts` (search `ReactorContext`) |
| configureReactor handling | `packages/ph-clint/src/core/cli.ts` — search for `configureReactor` |
| Example 06 (Connect Agent) | `examples/06-connect-agent/` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Powerhouse Integration" section |
