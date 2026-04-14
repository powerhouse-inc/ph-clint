# Phase 2: Switchboard (Remote Access)

## Context

Phase 1 gives CLIs an in-process Reactor for document operations and subscriptions. Phase 2 optionally exposes that same Reactor via Switchboard — a GraphQL API and MCP endpoint — making the agent's documents accessible to external tools, other agents, and (in Phase 3) a web UI.

The key constraint: **Switchboard wraps the existing Phase 1 Reactor**. It does not create a second one. This is achieved through `initializeAndStartAPI`'s `clientInitializer` callback pattern, which accepts a factory function returning a `ReactorClientModule` — we return the one we already built in Phase 1.

## Integration point: how Switchboard wraps the Reactor

### The `initializeAndStartAPI` callback pattern

From `@powerhousedao/reactor-api` (`packages/reactor-api/src/server.ts:638`):

```typescript
export async function initializeAndStartAPI(
  clientInitializer: (documentModels: DocumentModelModule[]) => Promise<ReactorClientModule>,
  options: Options,
  processorApp: ProcessorApp,
): Promise<API & { client, syncManager, documentModelRegistry }>
```

The `clientInitializer` is a factory that receives dynamically-discovered document models and returns a `ReactorClientModule`. Switchboard calls `packages.init()` first to discover models, then passes them to this callback.

**Our approach**: provide a `clientInitializer` that **ignores** the `documentModels` parameter and returns the Phase 1 `ReactorClientModule` directly. We don't use dynamic package loading — our models are registered at build time.

```typescript
// Phase 1 already built this:
const reactorModule: ReactorClientModule = /* from Phase 1 */;

// Phase 2 wraps it:
const api = await initializeAndStartAPI(
  async (_dynamicModels) => reactorModule,  // return pre-built module
  {
    port: 4001,
    dbPath: '.ph/read-model.db',
    mcp: true,
    packages: [],           // no dynamic package loading
  },
  'agent',
);
```

### What Switchboard provides

Once started, `initializeAndStartAPI` creates:
- **Express HTTP server** on the configured port
- **GraphQL endpoint** at `/graphql` (Apollo Server gateway)
- **MCP endpoint** at `/mcp` (via `setupMcpServer` from `@powerhousedao/reactor-mcp`)
- **WebSocket subscriptions** at `/graphql/subscriptions`
- **Health check** at `/health`
- **GraphQL playground** at `/explorer`

### What it extracts from our ReactorClientModule

```typescript
const reactorClient = reactorClientModule.client;                              // IReactorClient
const syncManager = reactorClientModule.reactorModule?.syncModule?.syncManager; // ISyncManager
const reactorProcessorManager = reactorClientModule.reactorModule?.processorManager;
const documentModelRegistry = reactorClientModule.reactorModule?.documentModelRegistry;
```

All of these are available from `ReactorClientBuilder.buildModule()` — Phase 1 already produces them. The only requirement is that `ReactorBuilder` was used (not `withReactor()`), so `reactorModule` is populated.

### Switchboard's infrastructure we skip

| Switchboard feature | Our approach |
|---------------------|-------------|
| Dynamic package loading (Vite HMR) | Skip — models registered at build time |
| Auth / Renown identity | Skip — local-first, no auth |
| Sentry / OpenTelemetry | Skip — not needed for CLI agents |
| Feature flags | Skip — hardcode defaults |
| Custom processors | Skip — no Vetra processor |
| Package management service | Skip — no HTTP registry |
| HTTPS / TLS | Skip — localhost only |

This means we call `initializeAndStartAPI` with minimal options — port, dbPath, MCP enabled, empty packages list. No auth, no HTTPS, no processors.

## Public API extension

### Config addition to `definePowerhouseIntegration()`

```typescript
const powerhouse = definePowerhouseIntegration({
  // ...Phase 1 options...
  switchboard: {
    enabled: true,        // default: false
    port: 4001,           // default: 4001
  },
});
```

When `switchboard.enabled` is false (default), Phase 2 code is never imported.

### PowerhouseContext extension

```typescript
interface PowerhouseContext {
  client: IReactorClient;      // Phase 1
  driveId: string;             // Phase 1
  switchboardUrl?: string;     // Phase 2: http://localhost:4001/graphql
  driveUrl?: string;           // Phase 2: http://localhost:4001/d/{driveId}
  mcpUrl?: string;             // Phase 2: http://localhost:4001/mcp
}
```

### Additional events

```typescript
'powerhouse:switchboard:ready'  // { switchboardUrl, driveUrl, mcpUrl }
```

## Implementation

### New file

```
packages/ph-clint/src/integrations/powerhouse/
├── switchboard.ts     # startSwitchboard() — lazy-loads reactor-api, starts API server
```

### Module: `integrations/powerhouse/switchboard.ts`

```typescript
import type { ReactorClientModule } from './types.js';

export interface SwitchboardInstance {
  switchboardUrl: string;
  driveUrl: string;
  mcpUrl: string;
  shutdown(): Promise<void>;
}

export async function startSwitchboard(options: {
  reactorModule: ReactorClientModule;
  port: number;
  dbPath: string;
  driveId: string;
}): Promise<SwitchboardInstance> {
  // Lazy import — @powerhousedao/reactor-api is a peer dependency
  const { initializeAndStartAPI } = await import('@powerhousedao/reactor-api');

  const api = await initializeAndStartAPI(
    async (_documentModels) => options.reactorModule,
    {
      port: options.port,
      dbPath: options.dbPath,
      mcp: true,
      packages: [],
    },
    'agent',
  );

  const switchboardUrl = `http://localhost:${options.port}/graphql`;
  const driveUrl = `http://localhost:${options.port}/d/${options.driveId}`;
  const mcpUrl = `http://localhost:${options.port}/mcp`;

  return {
    switchboardUrl,
    driveUrl,
    mcpUrl,
    async shutdown() {
      // Close HTTP server
      // api.httpAdapter exposes the underlying Express/HTTP server
    },
  };
}
```

### Changes to `integrations/powerhouse/index.ts`

The `setup()` function gains a conditional Phase 2 block:

```typescript
async setup(context: CommandContext) {
  // Phase 1: build reactor, drive, subscriptions (unchanged)
  module = await buildReactor({ ... });
  const driveId = await ensureDrive(module.client, options.drive);
  // ...subscriptions...
  context.powerhouse = { client: module.client, driveId };

  // Phase 2: optionally start Switchboard
  if (options.switchboard?.enabled) {
    const { startSwitchboard } = await import('./switchboard.js');
    switchboard = await startSwitchboard({
      reactorModule: module,
      port: options.switchboard.port ?? 4001,
      dbPath: context.workspace.getStoreFolder('read-model.db'),
      driveId,
    });
    context.powerhouse.switchboardUrl = switchboard.switchboardUrl;
    context.powerhouse.driveUrl = switchboard.driveUrl;
    context.powerhouse.mcpUrl = switchboard.mcpUrl;
    context.emit?.('powerhouse:switchboard:ready', {
      switchboardUrl: switchboard.switchboardUrl,
      driveUrl: switchboard.driveUrl,
      mcpUrl: switchboard.mcpUrl,
    });
  }

  context.emit?.('powerhouse:ready', { driveId });
},

async teardown() {
  // Phase 2: shutdown Switchboard first (reverse order)
  await switchboard?.shutdown();
  // Phase 1: shutdown reactor
  unsubscribe?.();
  const status = module?.reactor.kill();
  await status?.completed;
},
```

## Testing strategy

### Integration tests

- Switchboard starts on configured port, `/health` returns 200
- GraphQL endpoint accepts introspection query
- MCP endpoint responds to tool listing
- Same reactor instance is used (create doc via Phase 1 client, query via GraphQL)
- Shutdown: HTTP server closes, port released

### Conditional loading test

- When `switchboard.enabled: false`, `@powerhousedao/reactor-api` is never imported
- Verify with module load tracking or mock

## Dependencies

**Additional peer dependencies**:
```json
"peerDependencies": {
  "@powerhousedao/reactor-api": "^6.0.2",
  "@powerhousedao/reactor-mcp": "^6.0.2"
},
"peerDependenciesMeta": {
  "@powerhousedao/reactor-api": { "optional": true },
  "@powerhousedao/reactor-mcp": { "optional": true }
}
```

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| `initializeAndStartAPI` expects specific ReactorModule shape | Verify all required fields are present from Phase 1's `buildModule()` |
| Read model DB path conflicts with reactor storage | Use separate paths: `reactor-storage/` vs `read-model.db` |
| Switchboard's package manager calls `init()` with empty packages list | Verify it handles empty gracefully (it should — defaults to `[]`) |
| Port conflicts | Add preflight check (reuse `checkPort` from existing service pattern) |
| Express/GraphQL adds significant memory | Lazy-loaded; only when explicitly enabled |
