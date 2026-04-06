# 05 — Service Manager

A CLI for managing multiple background services (dev servers, databases, workers). Demonstrates the ServiceExecutor with readiness detection, process lifecycle events, and the event handler system. No agent.

## What It Shows

- Background service management (start, stop, inspect)
- Readiness detection via regex patterns on stdout
- Endpoint capture from service output (URLs, ports)
- Process lifecycle events on the event bus
- Event handlers reacting to service state changes
- Multiple concurrent services

## Code

### Service definitions

```typescript
import { defineCli, defineCommand, defineService } from 'ph-clint';
import { z } from 'zod';

const configSchema = z.object({
  apiPort: z.number().default(3000).describe('API server port'),
  dbPort: z.number().default(5432).describe('Database port'),
});

const apiServer = defineService({
  id: 'api',
  label: 'API Server',
  command: 'node server.js',
  env: (config) => ({ PORT: String(config.apiPort) }),
  readiness: {
    pattern: /listening on (?:http:\/\/)?[\w.:]+:(\d+)/i,
    timeout: 15_000,
    captures: { port: 1 },
  },
  shutdown: { signal: 'SIGTERM', timeout: 5_000 },
  restart: { enabled: true, maxRetries: 3, delay: 2_000 },
});

const database = defineService({
  id: 'db',
  label: 'Database',
  command: 'docker compose up postgres',
  readiness: {
    pattern: /ready to accept connections/i,
    timeout: 30_000,
  },
  shutdown: { signal: 'SIGTERM', timeout: 10_000 },
});

const worker = defineService({
  id: 'worker',
  label: 'Background Worker',
  command: 'node worker.js',
  readiness: {
    pattern: /worker started, processing queue/i,
    timeout: 10_000,
  },
});
```

### Commands

```typescript
const up = defineCommand({
  id: 'up',
  description: 'Start all services',
  inputSchema: z.object({
    only: z.string().optional().describe('Start only this service (api, db, worker)'),
  }),
  execute: async ({ only }, { services }) => {
    const targets = only ? [only] : ['db', 'api', 'worker'];
    for (const id of targets) {
      await services.start(id);
    }
    return { text: `Started: ${targets.join(', ')}` };
  },
});

const down = defineCommand({
  id: 'down',
  description: 'Stop all services',
  inputSchema: z.object({
    only: z.string().optional().describe('Stop only this service'),
  }),
  execute: async ({ only }, { services }) => {
    const targets = only ? [only] : services.list().map(s => s.id);
    for (const id of targets) {
      await services.stop(id);
    }
    return { text: `Stopped: ${targets.join(', ')}` };
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
        (s.endpoints?.port ? ` :${s.endpoints.port}` : '')
      ).join('\n'),
      data: all,
    };
  },
});

const logs = defineCommand({
  id: 'logs',
  description: 'Show recent logs for a service',
  inputSchema: z.object({
    service: z.string().describe('Service ID'),
    lines: z.number().default(50).describe('Number of lines'),
  }),
  execute: async ({ service, lines }, { services }) => {
    const log = services.logs(service, lines);
    return { text: log };
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
  services: [apiServer, database, worker],
  events: {
    'service:ready': (event) => {
      console.log(`✓ ${event.label} is ready` +
        (event.endpoints?.port ? ` on port ${event.endpoints.port}` : ''));
    },
    'service:failed': (event) => {
      console.log(`✗ ${event.label} failed: ${event.error}`);
    },
    'service:restarting': (event) => {
      console.log(`↻ ${event.label} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
  },
  interactive: {
    welcome: 'Service Manager — /up to start, /ps for status',
  },
});
```

### Usage

```bash
# Command mode
svc up
svc ps
svc logs --service api --lines 100
svc down --only worker

# Interactive mode
svc -i
> /up
# ✓ Database is ready
# ✓ API Server is ready on port 3000
# ✓ Background Worker is ready
> /ps
# ● API Server [ready] :3000
# ● Database [ready]
# ● Background Worker [ready]
> /logs --service api
> /down --only worker
```

## Acceptance Criteria

- [ ] `svc up` starts all services sequentially, waits for readiness
- [ ] `svc up --only api` starts only the API server
- [ ] `svc ps` shows status of all services with endpoint info
- [ ] `svc logs --service api` shows captured stdout/stderr
- [ ] `svc down` gracefully stops all services (SIGTERM → timeout → SIGKILL)
- [ ] Readiness detection extracts port from stdout via regex capture group
- [ ] Service restart on failure respects `maxRetries` and `delay`
- [ ] Event handlers fire for `service:ready`, `service:failed`, `service:restarting`
- [ ] `SVC_API_PORT=8080 svc up` overrides the API server port
- [ ] In REPL, service events appear as they happen without interrupting input
- [ ] Port release is verified after service shutdown
