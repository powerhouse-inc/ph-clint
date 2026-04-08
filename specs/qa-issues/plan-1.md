Plan: Connect MCP tools to agent after Vetra service becomes ready

## Problem

The agent is created with static `tools: cliTools` (agent-rupert.ts:77). The MCP client
(`connectMcp`, `getMcpTools`) exists and works but is never called. When Vetra's MCP server
becomes ready, the URL is captured by the readiness pattern but never passed to `connectMcp()`.
The agent cannot call `reactor_mcp__*` tools and enters a confusion loop.

## Analysis

Two things need to happen:
1. **Call `connectMcp(url)`** when the Vetra service reports its mcp-server endpoint ready.
2. **Make agent tools dynamic** so newly connected MCP tools become available on the next LLM turn.

The Mastra `Agent` constructor accepts `tools` as either a static object or an async function
`() => Promise<ToolsInput>`. The prototype at `prototypes/agent-rupert-cli/` already demonstrates
this pattern. The `service:ready` event already fires with `event.endpoints['mcp-server']`.

### Where to connect

The connection must happen where we have access to both the service event and the MCP client.
Two options:

**Option A — In the 05b event handler (cli.ts)**
Add `connectMcp(ep['mcp-server'])` inside the existing `service:ready` handler. Simple, direct,
but couples 05b-specific event wiring to the MCP module.

**Option B — In the agent factory, listening to events**
Have `createAgent` register an event listener. More encapsulated but requires the agent factory
to receive the event bus.

Option A is simpler and matches how the prototype works. The event handler already has
`ep['mcp-server']` in scope. This is 05b-specific wiring, so it belongs in 05b's cli.ts.

### Where to make tools dynamic

Change `tools: cliTools` → `tools: async () => ({ ...cliTools, ...(await getMcpTools()) })` in
agent-rupert.ts. This is a one-line change. The Mastra Agent re-evaluates `tools` on each turn
when it's a function, so newly connected MCP tools appear automatically.

## Plan

### Step 1 — Make agent tools dynamic (agent-rupert.ts)

Change line 77 from:
```ts
tools: cliTools,
```
to:
```ts
tools: async () => ({
  ...cliTools,
  ...(await getMcpTools()),
}),
```

Add import:
```ts
import { getMcpTools } from '../mcp/client.js';
```

### Step 2 — Connect MCP on service ready (cli.ts)

In the `service:ready` event handler (lines 109-115), add the MCP connection:

```ts
'service:ready': async (event) => {
  const ep = event.endpoints ?? {};
  console.log(
    `✓ ${event.label} is ready` +
      (ep['connect-studio'] ? ` — Connect Studio on port ${ep['connect-studio']}` : ''),
  );
  if (ep['mcp-server']) {
    await connectMcp(ep['mcp-server']);
    console.log(`  ✓ MCP client connected to ${ep['mcp-server']}`);
  }
},
```

Add import:
```ts
import { connectMcp } from './mcp/client.js';
```

### Step 3 — Disconnect MCP on service stop (cli.ts)

In the `service:stopped` handler, add cleanup:

```ts
'service:stopped': async (event) => {
  console.log(`■ ${event.label} stopped`);
  if (event.serviceId === 'vetra') {
    await disconnectMcp();
  }
},
```

Add `disconnectMcp` to the import.

### Step 4 — Tests

- Unit test: verify `getMcpTools()` returns empty when not connected (already implicit).
- Integration test: verify the `service:ready` event handler calls `connectMcp` with the
  captured mcp-server URL. This can be tested by mocking the event emission.
- Verify the agent's `tools` property is a function, not a static object.

## Scope

- **05b changes**: `src/cli.ts` (event handler + import), `src/agents/agent-rupert.ts` (dynamic tools + import)
- **No library changes needed** — the framework already supports async event handlers and the
  Mastra Agent already supports `tools` as an async function.
- **Risk**: Low. The `getMcpTools()` call is safe (returns `{}` when not connected or on error).
  The async tools function adds negligible latency per turn.
