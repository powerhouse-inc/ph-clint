# 05 — Reactor Service Manager

A CLI for managing the Powerhouse Vetra development server as a detached background service. Demonstrates the ServiceManager with multi-pattern readiness detection, endpoint capture, process lifecycle events, and reconnection across CLI invocations. No agent.

Ported from `prototypes/agent-rupert-cli/` — the `ReactorPackagesManager` and `ServiceExecutor` patterns, expressed in ph-clint's functional `defineService` style.

## What It Shows

- Detached background service management (start, stop, inspect, reconnect)
- Multi-pattern readiness detection — service is ready when ALL patterns match
- Endpoint capture from stdout (Connect Studio port, Drive URL, MCP server)
- Process lifecycle events on the event bus (`service:pattern-matched`, `service:ready`, `service:stopped`)
- Config-driven port assignment via `configSchema`
- Service state persistence on disk for reconnection after CLI exit
- Restart on crash with configurable retries and delay

## Code

### Service definition

```typescript
import { defineCli, defineCommand, defineService } from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  startupTimeout: z.number().default(90_000).describe('Service startup timeout (ms)'),
});

const vetra = defineService({
  id: 'vetra',
  label: 'Vetra Dev Server',
  command: 'ph vetra --watch',
  env: (config) => ({
    PORT: String(config.switchboardPort),
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    NODE_OPTIONS: '--max-old-space-size=4096',
  }),
  readiness: {
    patterns: [
      {
        name: 'connect-port',
        pattern: /Local:\s*http:\/\/localhost:(\d+)/,
        captures: { 'connect-studio': 1 },
      },
      {
        name: 'drive-url',
        pattern: /Drive URL:\s*(https?:\/\/[^\s]+)/,
        captures: { 'drive-url': 1 },
      },
      {
        name: 'mcp-server',
        pattern: /MCP server available at (https?:\/\/[^\s]+)/,
        captures: { 'mcp-server': 1 },
      },
    ],
    timeout: 90_000,
  },
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
  restart: { enabled: true, maxRetries: 3, delay: 5_000 },
});
```

### Commands

```typescript
const up = defineCommand({
  id: 'up',
  description: 'Start Vetra dev server',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    await services.start('vetra');
    const status = services.list().find((s) => s.id === 'vetra');
    return { text: `Vetra is ready\nConnect Studio: http://localhost:${status.endpoints['connect-studio']}` };
  },
});

const down = defineCommand({
  id: 'down',
  description: 'Stop Vetra dev server',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    await services.stop('vetra');
    return { text: 'Vetra stopped' };
  },
});

const ps = defineCommand({
  id: 'ps',
  description: 'Show service status',
  inputSchema: z.object({}),
  execute: async (_, { services }) => {
    const all = services.list();
    return {
      text: all.map(s =>
        `${s.status === 'ready' ? '●' : '○'} ${s.label} [${s.status}]` +
        (s.endpoints?.['connect-studio'] ? ` :${s.endpoints['connect-studio']}` : '')
      ).join('\n'),
    };
  },
});

const logs = defineCommand({
  id: 'logs',
  description: 'Show recent logs',
  inputSchema: z.object({
    lines: z.number().default(50).describe('Number of lines'),
  }),
  execute: async ({ lines }, { services }) => {
    return { text: services.logs('vetra', lines) };
  },
});
```

### Event handlers

```typescript
const cli = defineCli({
  name: 'svc',
  version: '1.0.0',
  configSchema,
  commands: [up, down, ps, logs],
  services: [vetra],
  events: {
    'service:pattern-matched': (event) => {
      console.log(`  ✓ ${event.name} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      console.log(`✓ ${event.label} is ready — Connect Studio on port ${event.endpoints?.['connect-studio']}`);
    },
    'service:failed': (event) => {
      console.log(`✗ ${event.label} failed: ${event.error}`);
    },
    'service:restarting': (event) => {
      console.log(`↻ ${event.label} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
  },
  interactive: {
    welcome: 'Reactor Service Manager — /up to start, /ps for status, /logs to view output',
  },
});
```

### Usage

```bash
# Command mode
svc up
#   ✓ connect-port matched (2 remaining)
#   ✓ drive-url matched (1 remaining)
#   ✓ mcp-server matched (0 remaining)
# ✓ Vetra Dev Server is ready — Connect Studio on port 3000
# Vetra is ready
# Connect Studio: http://localhost:3000
# Drive URL: http://localhost:4001/drives/main
# MCP server: http://localhost:4001/mcp

svc ps
# ● Vetra Dev Server [ready] :3000 | http://localhost:4001/drives/main | MCP http://localhost:4001/mcp

svc logs --lines 100

svc down
# ■ Vetra Dev Server stopped

# Override port via env var
SVC_SWITCHBOARD_PORT=6100 svc up

# Interactive mode
svc -i
> /up
> /ps
> /logs
> /down
```

## Prototype Origin

This example ports the following from `prototypes/agent-rupert-cli/`:

| Prototype | ph-clint |
|---|---|
| `ReactorPackagesManager` class | `defineService()` + `ServiceManager` |
| `ServiceExecutor` class | `createServiceManager()` |
| `VetraConfig` interface | `configSchema` with Zod |
| `ReadinessPattern[]` array | `readiness.patterns` with named patterns |
| `ServiceHandle.endpoints` Map | `ServiceStatus.endpoints` Record |
| Event-based readiness (`service-ready`) | `service:pattern-matched` + `service:ready` events |
| In-memory logs array | Log files on disk + `logs()` / `watchLogs()` |

Key architectural difference: services are **fully detached** from the CLI process. They survive CLI exit and are reconnected via PID from persisted state files on disk.

## Acceptance Criteria

- [x] `svc up` starts Vetra, waits for all three readiness patterns
- [x] `svc ps` shows status with captured endpoints (port, drive URL, MCP)
- [x] `svc logs` shows captured stdout/stderr from log file
- [x] `svc down` gracefully stops (SIGTERM → timeout → SIGKILL)
- [x] Multi-pattern readiness: service ready only when ALL patterns match
- [x] Endpoint capture from regex groups across multiple patterns
- [x] `service:pattern-matched` events fire as each pattern matches
- [x] Service restart on crash respects `maxRetries` and `delay`
- [x] `SVC_SWITCHBOARD_PORT=6100 svc up` overrides the switchboard port
- [x] Service survives CLI exit, reconnectable via `svc ps`
- [x] Port release verified after service shutdown
