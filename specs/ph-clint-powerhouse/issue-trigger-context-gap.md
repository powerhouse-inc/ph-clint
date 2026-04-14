# Issue: Trigger → Agent → Document response loop is unreasonably hard to wire

## Summary

Connecting a document change trigger to an agent response (the core use case for examples 06-08) requires fighting the framework at every step. What should be a 10-line callback involves ~100 lines of workarounds, module-level state, wrapper hacks, and still doesn't work because the subscription bridge never fires events.

## The task

When a user sends a message in Connect (web UI), the agent CLI should:
1. Detect the document change
2. Read the last message
3. If it's from a stakeholder, invoke the agent
4. Write the agent's response back to the document

This is the entire point of the connect-agent example.

## Challenges encountered

### 1. TriggerContext has no access to PowerhouseContext or the agent

The `TriggerContext` passed to `setup()` and `poll()` only exposes:
- `config` — the resolved CLI config object (not CommandContext)
- `state` — a private state bag for the trigger
- `emit` / `on` — event bus

It does **not** expose:
- `context.powerhouse` (the Reactor client + drive ID)
- The agent provider
- The full `CommandContext`

**Consequence**: The trigger callback has no way to read documents or invoke the agent. The only workaround is module-level mutable state (`let phContext`, `let innerAgent`) set from outside the trigger.

### 2. Agent provider is lazily created and inaccessible

The CLI's `getAgentProvider()` is a private function inside `run()`. There is no public API to get the agent provider from outside the REPL/command execution path. The agent is only created when:
- Interactive mode starts (REPL)
- A prompt is passed in command mode
- A skill is invoked

**It is never created when the CLI starts in routine-only mode** (no `-i`, no prompt). This means the trigger cannot use the CLI's agent — it has to create its own separate agent instance.

**Consequence**: We had to export `createInnerAgent()` and call it from a wrapped integration setup, duplicating the agent creation logic and creating a second agent instance that doesn't share memory/thread context with the REPL agent.

### 3. PowerhouseContext is set during integration.setup() but triggers can't observe it

The integration's `setup()` sets `context.powerhouse` and emits `powerhouse:ready`. But:
- `ensureIntegrationsReady()` runs **before** `routine.start()` (which calls `trigger.setup()`)
- So the `powerhouse:ready` event fires before the trigger is listening
- The trigger's `TriggerContext.config` is the resolved config, not the full `CommandContext`, so there's no `context.powerhouse` to read

**Consequence**: We had to wrap the integration object itself to intercept `setup()` and capture the PowerhouseContext into a module-level variable. This is fragile and non-obvious.

### 4. Subscription bridge events never fire

After solving problems 1-3 with workarounds, the trigger still doesn't fire because `powerhouse:document:changed` events are never emitted. The `bridgeSubscriptions()` function calls `client.subscribe(search, callback)`, but:
- It's unclear whether the Reactor client's `subscribe()` method fires for changes made through `client.execute()` (the path Switchboard uses internally)
- It may only fire for external sync/replication events
- There is no logging, no error, no indication that the subscription is or isn't working
- The subscription filter `{ documentTypes: ['powerhouse/agent-chat'] }` may not match the Reactor's internal event format

**Consequence**: Even with all the plumbing in place, the trigger never fires. The entire approach is dead in the water without a working subscription mechanism.

### 5. No way to bridge Connect → CLI without subscriptions

There is currently no alternative mechanism for the CLI to know when a document changes via Connect/Switchboard. Options considered:
- **Polling**: The trigger could periodically read the document and check for new messages. This works but is inelegant and wasteful.
- **WebSocket**: Connect to Switchboard's own WebSocket subscription endpoint. This would work but means subscribing to our own API, which is circular.
- **Direct event bridging**: If the Reactor client emitted events on `execute()`, the subscription bridge would work. This may be a Powerhouse Reactor issue.

## Proposed infrastructure improvements

### A. Enrich TriggerContext with CommandContext

```typescript
interface TriggerContext {
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data?: unknown) => void) => void;
  // NEW:
  powerhouse?: PowerhouseContext;  // set after integration.setup()
  getAgentProvider?: () => Promise<AgentProvider | undefined>;
}
```

Or more generally, pass the full `CommandContext`:

```typescript
interface TriggerContext {
  context: CommandContext;  // the real one, with powerhouse, services, etc.
  state: Record<string, unknown>;
  // emit/on inherited from context
}
```

### B. Eagerly create the agent when a routine with triggers is configured

If the CLI has triggers + an agent loader, create the agent provider during `ensureIntegrationsReady()` rather than waiting for REPL/prompt. The trigger is the primary consumer of the agent in routine mode.

### C. Call trigger.setup() AFTER integration.setup()

This already happens (ensureIntegrationsReady → routine.start → trigger.setup), but the trigger should receive the **post-setup** context, not a stale copy. If TriggerContext wraps CommandContext, this happens naturally.

### D. Fix or replace the subscription bridge

Either:
1. **Verify** that `client.subscribe()` fires for `client.execute()` changes and fix if it doesn't
2. **Add a polling fallback** built into the Powerhouse integration — check for document changes every N seconds as a complement to event-based subscriptions
3. **Emit events directly** from the integration's `execute` path — when the bridge's `DocumentDispatcher.addAction()` fires, also emit on the event bus

### E. Provide a `createDocumentReactionTrigger` helper

The "react to document changes with agent response" pattern is the core use case. It should be a one-liner:

```typescript
const trigger = createDocumentReactionTrigger({
  documentType: 'powerhouse/agent-chat',
  shouldRespond: (state) => {
    const lastMsg = state.messages.at(-1);
    return lastMsg && !agentIds.has(lastMsg.sender) && lastMsg.type === 'Text';
  },
  getPrompt: (state) => state.messages.at(-1)!.text.join(''),
  agentId: AGENT_ID,
});
```

This helper would handle all the plumbing: finding documents, checking last message sender, invoking the agent, writing the response back.

## Current state of cli.ts

The file is ~160 lines with module-level mutable state, an integration wrapper hack, an eager agent creation in the integration setup callback, and a trigger callback that does all the document reading / agent invocation manually. It should be ~30 lines. The complexity is entirely accidental, forced by infrastructure gaps.

## Files involved

- `packages/ph-clint/src/core/types.ts` — TriggerContext definition
- `packages/ph-clint/src/core/routine.ts` — trigger setup/poll lifecycle
- `packages/ph-clint/src/core/cli.ts` — ensureIntegrationsReady, getAgentProvider, routine.start ordering
- `packages/ph-clint/src/integrations/powerhouse/subscriptions.ts` — bridgeSubscriptions
- `examples/06-connect-agent/agent-cli/src/cli.ts` — the suffering
- `examples/06-connect-agent/agent-cli/src/trigger.ts` — the trigger definition
