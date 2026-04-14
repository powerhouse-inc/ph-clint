# Phase 3: Connect UI (Persistent Web Client)

## Context

Phase 2 exposes the agent's Reactor via Switchboard (GraphQL + MCP). Phase 3 adds a web UI by running Connect as a **persistent child process** managed by the ServiceManager. Unlike the Reactor and Switchboard (which are in-process and tied to the CLI lifecycle), Connect survives CLI exit — the user can close the terminal and the web UI keeps running.

This is the same pattern used in example 05 (`reactor-project` service), where `ph vetra` is spawned as a child process with readiness detection. The difference: Phase 3 auto-registers the Connect service definition when `connect.enabled` is true, so implementations don't need to write service boilerplate.

## How Connect runs

Connect is a Vite-based web application from `@powerhousedao/connect`. In the Powerhouse ecosystem, the `ph` CLI runs it via `ph connect` or as part of `ph vetra`. For ph-clint, we run it as a managed service:

```
CLI process                          Connect process (persistent)
┌─────────────────┐                  ┌─────────────────┐
│ ph-clint CLI    │  spawn           │ Connect (Vite)   │
│                 │ ──────────────── │                  │
│ ServiceManager  │  readiness       │ http://localhost  │
│  detects ready  │ ◄─────────────── │  :3000           │
│                 │                  │                  │
│ CLI exits       │                  │ keeps running    │
└─────────────────┘                  └─────────────────┘
```

On next CLI launch, the ServiceManager detects the existing Connect instance (port already in use) rather than starting a new one.

## Public API extension

### Config addition

```typescript
const powerhouse = definePowerhouseIntegration({
  // ...Phase 1+2 options...
  connect: {
    enabled: true,        // default: false
    port: 3000,           // default: 3000
  },
});
```

When `connect.enabled` is true, the integration auto-registers a service definition. This requires `switchboard.enabled` to also be true (Connect needs a Switchboard URL to point at).

### PowerhouseContext extension

```typescript
interface PowerhouseContext {
  client: IReactorClient;      // Phase 1
  driveId: string;             // Phase 1
  switchboardUrl?: string;     // Phase 2
  driveUrl?: string;           // Phase 2
  mcpUrl?: string;             // Phase 2
  connectUrl?: string;         // Phase 3: http://localhost:3000
}
```

### Additional events

```typescript
'powerhouse:connect:ready'     // { connectUrl }
```

### Auto-registered service commands

When Connect is enabled, the standard service commands become available:
- `connect-start` — Start Connect (if not already running)
- `connect-stop` — Stop Connect
- `connect-restart` — Restart Connect
- `connect-logs` — View Connect output

## Implementation

### Service definition

The integration generates a `ServiceDefinition` equivalent to:

```typescript
defineService({
  id: 'connect',
  name: 'Connect Studio',
  description: 'Powerhouse Connect web interface',
  command: (params) => {
    // Option A: Use the ph CLI
    return `ph connect --port ${params.port} --default-drives-url ${params.driveUrl}`;
    // Option B: Use npx with the Connect package directly
    // return `npx @powerhousedao/connect --port ${params.port}`;
  },
  paramsSchema: z.object({
    port: z.coerce.number().default(3000),
    driveUrl: z.string(),
  }),
  env: (config, params) => ({
    PH_CONNECT_DEFAULT_DRIVES_URL: params.driveUrl,
    PH_CONNECT_DRIVES_PRESERVE_STRATEGY: 'preserve-all',
  }),
  readiness: {
    patterns: [
      {
        name: 'connect',
        pattern: /Local:\s*(http:\/\/localhost:\d+)/,
        captures: { 'connect-studio': { group: 1, type: 'website' } },
      },
    ],
    timeout: 30_000,
  },
  preflight: [
    checkPort((ctx) => ctx.params?.port as number ?? 3000, 'Connect Studio'),
  ],
  shutdown: { signal: 'SIGTERM', timeout: 5_000 },
  restart: { enabled: false, maxRetries: 0, delay: 0 },
});
```

### How the service is injected

The integration adds the Connect service to `CliOptions.services` during `definePowerhouseIntegration()`, **not** during `setup()`. This is because `defineCli()` reads the services array at construction time (before `setup()` runs) to register service commands.

```typescript
export function definePowerhouseIntegration(options): {
  integration: Integration;
  services?: ServiceDefinition[];  // Injected into CliOptions.services
} {
  const services: ServiceDefinition[] = [];

  if (options.connect?.enabled) {
    services.push(connectServiceDefinition(options.connect));
  }

  return {
    integration: { id: 'powerhouse', setup, teardown },
    services,
  };
}
```

**Alternative**: `definePowerhouseIntegration()` could return an `Integration` directly and the CLI detects the Connect service from it. The exact wiring depends on how `defineCli` evolves — this is a design decision to resolve during implementation.

### Auto-start behavior

During `setup()`, after Switchboard is ready:

```typescript
// Phase 3: auto-start Connect if enabled
if (options.connect?.enabled && context.services) {
  const driveUrl = context.powerhouse!.driveUrl!;
  await context.services.start('connect', {
    params: { port: options.connect.port ?? 3000, driveUrl },
  });
  // Readiness is detected by ServiceManager via log pattern matching
  // The 'service:ready' event fires when Connect outputs "Local: http://localhost:PORT"
}
```

The `service:ready` event handler populates `context.powerhouse.connectUrl`:

```typescript
eventBus.on('service:ready', (event) => {
  if (event.id === 'connect') {
    context.powerhouse!.connectUrl = event.endpoints?.['connect-studio'];
    context.emit?.('powerhouse:connect:ready', {
      connectUrl: context.powerhouse!.connectUrl,
    });
  }
});
```

## How Connect is invoked

### Option A: Via `ph` CLI (recommended)

Requires the Powerhouse CLI (`ph-cli`) to be installed. This is already the pattern in example 05.

```
ph connect --port 3000 --default-drives-url http://localhost:4001/d/{driveId}
```

### Option B: Via `npx` with the Connect package

If `@powerhousedao/connect` exposes a CLI entry point. This avoids the `ph` CLI dependency but may not be available.

### Option C: Custom Vite invocation

Start Vite with the Connect base config. More complex but avoids external dependencies.

The right choice depends on what's available in the Powerhouse ecosystem at implementation time. Option A is the simplest and proven.

## Testing strategy

### Integration tests

- Connect service starts, readiness pattern matches, `connectUrl` populated
- Connect serves HTML at the configured port (HTTP GET returns 200)
- CLI exit does not kill Connect (process persists)
- Second CLI launch detects existing Connect (port check)
- `connect-stop` stops the process, port is released

### Mock fixture

Similar to `05-ph-rupert/tests/fixtures/test-server.js`:
- A simple Node.js server that prints `Local: http://localhost:PORT` after startup
- Used in tests instead of actual Connect to avoid heavy dependencies

## Dependencies

**No new peer dependencies for ph-clint itself**. Connect is an external process — it's the implementation's responsibility to have `ph` or the Connect package installed.

For example 06, add to `devDependencies`:
```json
"ph-cli": "latest"
```
Or document as a system requirement.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Connect persists after CLI exit (intentional, but could surprise users) | Log clearly: "Connect running at http://localhost:3000 — use /connect-stop to stop" |
| Port 3000 conflict with other dev servers | Configurable port; preflight check |
| `ph connect` command may not exist or have different flags | Abstract behind the service command string; document alternatives |
| Connect startup is slow (Vite compilation) | 30s timeout; user sees readiness progress via service events |
| Switchboard URL not yet available when Connect starts | Start Connect in `setup()` only after Switchboard emits ready event |

## Relationship to example 06-connect-agent

Example 06 enables all three phases:

```typescript
const powerhouse = definePowerhouseIntegration({
  documentModels: [conversationModel],
  drive: { name: 'Chat Agent' },
  subscriptions: { documentTypes: ['conversation'] },
  switchboard: { enabled: true, port: 4001 },
  connect: { enabled: true, port: 3000 },
});
```

The example adds:
- A conversation document model
- A trigger that reacts to conversation changes
- A Mastra agent that handles messages
- The user interacts via Connect (browser) or terminal (REPL)

But the three Powerhouse layers are entirely generic — any ph-clint CLI can use them.
