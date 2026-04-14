# Phase 1: Internal Reactor

## Context

ph-clint CLIs currently have no way to work with Powerhouse documents. The Reactor is the foundational layer — an in-process, event-sourced document store that enables document CRUD and change subscriptions. Without it, neither Switchboard (Phase 2) nor Connect (Phase 3) can function.

The goal is: a CLI can initialize a Reactor with document models, create/read/edit documents, and subscribe to document changes that feed into the existing event bus and trigger system. This enables the core use case — an agent that listens and reacts to document changes.

## Critical: Persistent Storage Across CLI Restarts

The Reactor process is ephemeral (dies with the CLI), but its **storage is persistent**. All Reactor data lives in the ph-clint agent store at `{workdir}/.ph/{cliName}/reactor-storage/`. When the CLI restarts, the Reactor rebuilds from the same PGlite database — all documents, operations, and drives survive.

This is fundamental to the architecture:

- **Documents are durable.** An agent creates documents, accumulates conversation history, tracks state in WBS documents. None of this can be lost on CLI restart.
- **Drives persist.** The default drive (created on first run) is found on subsequent runs. `ensureDrive()` checks before creating.
- **Event sourcing enables this naturally.** The Reactor's PGlite database contains the full operation history. `ReactorBuilder.withKysely(kysely)` accepts an existing database — on restart, the builder runs migrations (idempotent) and the Reactor replays from stored state.
- **Subscriptions are re-established.** The `setup()` hook runs on every CLI start, re-subscribing to document changes. No events are missed because the Reactor rebuilds its read models from the operation log.

**Storage layout:**
```
{workdir}/.ph/{cliName}/
├── reactor-storage/           # PGlite database (Reactor's event-sourced store)
│   ├── pg_wal/                # WAL files
│   └── ...                    # PGlite internals
├── read-model.db              # Phase 2: Switchboard read model (separate DB)
└── ...                        # Other ph-clint state (config, mastra, etc.)
```

The Reactor process (`reactor.kill()`) shuts down cleanly on CLI exit — flushing pending operations, stopping executors, closing the database connection. On next start, PGlite opens the same directory and the Reactor picks up where it left off.

## Integration point: how Reactor fits into ph-clint

### Reactor API surface we use

From `@powerhousedao/reactor`:

```typescript
// Build a reactor
const module = await new ReactorClientBuilder()
  .withReactorBuilder(
    new ReactorBuilder()
      .withDocumentModels([...models])
      .withKysely(kysely)    // PGlite for storage
  )
  .buildModule();

// ReactorClientModule contains:
module.client          // IReactorClient — main API for CRUD + subscriptions
module.reactor         // IReactor — low-level reactor
module.eventBus        // IEventBus — reactor's internal event bus
module.documentIndexer // IDocumentIndexer
module.documentView    // IDocumentView

// Subscribe to document changes (on IReactorClient)
const unsub = module.client.subscribe(
  { documentTypes: ['conversation'] },  // SearchFilter
  (event) => { /* DocumentChangeEvent */ },
  { branch: 'main' },                   // optional ViewFilter
);
// event.type: Created | Updated | Deleted | ChildAdded | ChildRemoved
// event.documents: PHDocument[]

// Document CRUD
await client.create(document);
const doc = await client.get(id);
const results = await client.find(search);
const jobInfo = await client.execute(docId, 'main', [actions]);

// Shutdown
const status = reactor.kill();
await status.completed;
```

### How it plugs into ph-clint

**Current state**: `Integration` interface exists (`types.ts:176`) with `setup(context)` and `teardown()` hooks, but these hooks are **never called** in `cli.ts`. `CliOptions` accepts `integrations?: Integration[]`. `hasReactor` is stubbed to `false` in metadata (`cli.ts:1150`).

**Required core changes**:

1. **Invoke integration lifecycle** — In `cli.ts`, after context is built (after line ~817), iterate `options.integrations` and call `setup(context)`. On CLI exit, call `teardown()`. This is a small change that unblocks all future integrations.

2. **Extend CommandContext** — Add an optional `powerhouse?: PowerhouseContext` field to `CommandContext` in `types.ts`. The integration's `setup()` populates it.

3. **Set `hasReactor`** — Replace the TODO at `cli.ts:1150` with detection: `hasReactor: options.integrations?.some(i => i.id === 'powerhouse') ?? false`.

## Public API

### `definePowerhouseIntegration(options)`

```typescript
import { definePowerhouseIntegration } from 'ph-clint';

const powerhouse = definePowerhouseIntegration({
  // Required: document model modules to register
  documentModels: [conversationModel, taskModel],

  // Optional: default drive to create/find on startup
  drive: {
    name: 'My Agent',           // Drive display name
    icon: 'https://...',        // Optional icon URL
  },

  // Optional: subscribe to document changes → event bus
  subscriptions: {
    documentTypes: ['conversation'],  // Filter by document type
    // Future: documentIds, parentId, etc.
  },
});
```

Returns an `Integration` object with `id: 'powerhouse'`, `setup()`, and `teardown()`.

### `PowerhouseContext` (on CommandContext)

```typescript
interface PowerhouseContext {
  client: IReactorClient;   // Full reactor client API
  driveId: string;           // Default drive ID
}
```

Available in commands as `context.powerhouse`:

```typescript
const myCommand = defineCommand({
  id: 'list-docs',
  inputSchema: z.object({ type: z.string().optional() }),
  execute: async (input, context) => {
    const { client, driveId } = context.powerhouse!;
    const docs = await client.find({ documentTypes: input.type ? [input.type] : undefined });
    return { text: docs.map(d => d.name).join('\n') };
  },
});
```

### Events emitted on the event bus

```typescript
'powerhouse:ready'              // { driveId }
'powerhouse:document:changed'   // { documentId, documentType, changeType, documents }
'powerhouse:document:created'   // { documentId, documentType }
'powerhouse:document:deleted'   // { documentId }
```

These events are consumable by triggers via `ctx.on()` in trigger `setup()`.

## Implementation

### New files

```
packages/ph-clint/src/integrations/powerhouse/
├── index.ts           # definePowerhouseIntegration() — public entry point
├── reactor.ts         # buildReactor() — lazy-loads @powerhousedao/reactor, builds ReactorClientModule
├── drive.ts           # ensureDrive() — find or create the default drive
├── subscriptions.ts   # bridgeSubscriptions() — client.subscribe() → eventBus.emit()
├── config.ts          # PowerhouseIntegrationOptions Zod schema
└── types.ts           # PowerhouseContext, event payload types
```

### Modified files

```
packages/ph-clint/src/core/types.ts
  - Add `powerhouse?: PowerhouseContext` to CommandContext
  - Export PowerhouseContext type (re-exported from integrations/powerhouse/types.ts)

packages/ph-clint/src/core/cli.ts
  - After context build (~line 817): call integration.setup(context) for each integration
  - Before exit: call integration.teardown() for each integration
  - Set hasReactor based on integration presence

packages/ph-clint/src/index.ts
  - Export definePowerhouseIntegration, PowerhouseContext
```

### Module: `integrations/powerhouse/index.ts`

```typescript
export function definePowerhouseIntegration(options: PowerhouseIntegrationOptions): Integration {
  let module: ReactorClientModule | undefined;
  let unsubscribe: (() => void) | undefined;

  return {
    id: 'powerhouse',

    async setup(context: CommandContext) {
      // 1. Lazy-load and build reactor
      module = await buildReactor({
        documentModels: options.documentModels,
        storagePath: context.workspace.getStoreFolder('reactor-storage'),
      });

      // 2. Create/find default drive
      const driveId = await ensureDrive(module.client, options.drive);

      // 3. Bridge subscriptions to event bus
      if (options.subscriptions && context.emit) {
        unsubscribe = bridgeSubscriptions(
          module.client,
          options.subscriptions,
          context.emit,
        );
      }

      // 4. Expose on context
      context.powerhouse = { client: module.client, driveId };

      // 5. Signal readiness
      context.emit?.('powerhouse:ready', { driveId });
    },

    async teardown() {
      unsubscribe?.();
      if (module) {
        const status = module.reactor.kill();
        await status.completed;
      }
    },
  };
}
```

### Module: `integrations/powerhouse/reactor.ts`

```typescript
export async function buildReactor(options: {
  documentModels: DocumentModelModule[];
  storagePath: string;  // Absolute path to persistent PGlite directory
}): Promise<ReactorClientModule> {
  // Lazy imports — @powerhousedao/reactor is a peer dependency
  const { ReactorBuilder, ReactorClientBuilder } = await import('@powerhousedao/reactor');
  const { PGlite } = await import('@electric-sql/pglite');
  const { Kysely } = await import('kysely');
  const { PGliteDialect } = await import('kysely-pglite-dialect');

  // Base document models (always needed)
  const { driveDocumentModelModule } = await import('@powerhousedao/shared/document-drive');
  const { documentModelDocumentModelModule } = await import('document-model');

  // PGlite opens an existing database if the directory exists,
  // or creates a new one if it doesn't. This is what makes the
  // Reactor persistent across CLI restarts — same path, same data.
  const pglite = new PGlite(options.storagePath);
  const kysely = new Kysely({ dialect: new PGliteDialect(pglite) });

  const module = await new ReactorClientBuilder()
    .withReactorBuilder(
      new ReactorBuilder()
        .withDocumentModels([
          documentModelDocumentModelModule,
          driveDocumentModelModule,
          ...options.documentModels,
        ])
        .withKysely(kysely)
        // Migration strategy "auto" (default) runs idempotent migrations
        // on startup — safe for both fresh and existing databases.
    )
    .buildModule();

  return module;
}
```

### Module: `integrations/powerhouse/subscriptions.ts`

```typescript
export function bridgeSubscriptions(
  client: IReactorClient,
  subscriptions: SubscriptionConfig,
  emit: (event: string, data?: unknown) => void,
): () => void {
  const search: SearchFilter = {};
  if (subscriptions.documentTypes) {
    search.documentTypes = subscriptions.documentTypes;
  }

  return client.subscribe(search, (event) => {
    switch (event.type) {
      case 'Created':
        for (const doc of event.documents) {
          emit('powerhouse:document:created', {
            documentId: doc.id,
            documentType: doc.documentType,
          });
        }
        break;
      case 'Updated':
        emit('powerhouse:document:changed', {
          changeType: event.type,
          documents: event.documents,
        });
        break;
      case 'Deleted':
        for (const doc of event.documents) {
          emit('powerhouse:document:deleted', { documentId: doc.id });
        }
        break;
    }
  });
}
```

### Module: `integrations/powerhouse/drive.ts`

```typescript
export async function ensureDrive(
  client: IReactorClient,
  driveConfig?: { name: string; icon?: string },
): Promise<string> {
  // Check if a drive already exists
  const drives = await client.find({ /* drive search */ });
  if (drives.length > 0) return drives[0].id;

  // Create a new drive with the configured name
  const driveId = generateDriveId(driveConfig?.name ?? 'default');
  // ... create drive document via client
  return driveId;
}
```

## Core changes detail

### `cli.ts` — Integration lifecycle

After the service manager setup block (after line ~817), add:

```typescript
// Initialize integrations
if (options.integrations) {
  for (const integration of options.integrations) {
    await integration.setup?.(context);
  }
}
```

Before process exit (in the cleanup path), add:

```typescript
// Teardown integrations (reverse order)
if (options.integrations) {
  for (const integration of [...options.integrations].reverse()) {
    await integration.teardown?.();
  }
}
```

### `types.ts` — Context extension

```typescript
export interface CommandContext<TConfig = Record<string, unknown>> {
  workdir: string;
  workspace: WorkdirStore;
  config: TConfig;
  stdout: (text: string) => void;
  log?: Logger;
  routine?: Routine;
  processes?: ProcessManager;
  services?: ServiceManager;
  emit?: (event: string, data?: unknown) => void;
  powerhouse?: PowerhouseContext;  // ← NEW
}
```

## Testing strategy

### Unit tests

- `definePowerhouseIntegration()` returns correct Integration shape
- `bridgeSubscriptions()` maps DocumentChangeEvent types to correct event bus events
- Config validation (missing documentModels, invalid options)

### Integration tests

- Full lifecycle: setup → reactor is running → document CRUD works → teardown → reactor stopped
- **Persistence across restarts**: setup → create document → teardown → setup again (same storagePath) → document still exists
- **Drive persistence**: first setup creates drive → teardown → second setup finds existing drive (no duplicate)
- Subscription bridge: create document → event emitted on bus
- Context extension: `context.powerhouse` is populated after setup

### E2E tests (in example 06)

- CLI starts with Powerhouse integration → reactor ready event emitted
- Document change trigger fires → work item queued

## Dependencies

**Peer dependencies** (added to ph-clint's package.json):
```json
"peerDependencies": {
  "@powerhousedao/reactor": "^6.0.2",
  "@electric-sql/pglite": "^0.2",
  "document-model": "^6.0.2"
},
"peerDependenciesMeta": {
  "@powerhousedao/reactor": { "optional": true },
  "@electric-sql/pglite": { "optional": true },
  "document-model": { "optional": true }
}
```

All optional — only needed when `definePowerhouseIntegration()` is used.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| PGlite is heavy (~20MB) | Lazy-loaded; only imported when integration is used |
| Reactor startup is slow on existing DB | PGlite reopens quickly; migrations are idempotent and skip if already applied |
| Storage corruption on unclean exit | PGlite uses WAL; designed for crash recovery. `reactor.kill()` flushes cleanly when possible |
| Integration lifecycle not yet called in cli.ts | Small change; test thoroughly with existing test suite to avoid regressions |
| `client.subscribe()` error handling | Wrap callback in try/catch, log errors, don't crash the event bus |
| Storage path must be deterministic | Always `workspace.getStoreFolder('reactor-storage')` — same workdir + same cliName = same path |
