# Powerhouse Integration for ph-clint

Three optional, independently-toggleable layers that add Powerhouse document capabilities to any ph-clint CLI.

## Architecture

```
Layer 3 (optional): Connect UI          ← Persistent child-process service
         ↕ HTTP
Layer 2 (optional): Switchboard         ← In-process GraphQL + MCP endpoint
         ↕ wraps
Layer 1 (optional): Internal Reactor    ← In-process event-sourced document store
         ↕ subscribe()
         ph-clint event bus → triggers → routine loop → agent
```

Each layer is lazy-loaded and unloadable. Layer 2 requires Layer 1. Layer 3 requires Layer 2.

## Phases

| Phase | Layer | What it adds | Key dependency |
|-------|-------|-------------|----------------|
| [Phase 1](./phase-1-reactor.md) | Internal Reactor | In-process document store, subscriptions → event bus | `@powerhousedao/reactor` |
| [Phase 2](./phase-2-switchboard.md) | Switchboard | GraphQL API + MCP endpoint wrapping the reactor | `@powerhousedao/reactor-api` |
| [Phase 3](./phase-3-connect.md) | Connect UI | Persistent web UI service connecting to Switchboard | `@powerhousedao/connect` (CLI) |

## How they run

| Layer | Runs as | Lifecycle |
|-------|---------|-----------|
| Reactor | In-process, lazy-loaded | Tied to CLI process |
| Switchboard | In-process, lazy-loaded | Tied to CLI process |
| Connect | Child process (ServiceManager) | Persists beyond CLI |

## Public API (all phases)

```typescript
import { definePowerhouseIntegration } from 'ph-clint';

const { integration, services } = definePowerhouseIntegration({
  // Phase 1: Reactor
  documentModels: [myModel],
  drive: { name: 'My Agent' },
  subscriptions: { documentTypes: ['powerhouse/agent-chat'] },

  // Phase 2: Switchboard (requires Phase 1)
  switchboard: { enabled: true, port: 4001 },

  // Phase 3: Connect (requires Phase 2)
  connect: { enabled: true, port: 3000 },
});

const cli = defineCli({
  name: 'my-agent',
  integrations: [integration],
  services: [...services],
  // ...
});
```
