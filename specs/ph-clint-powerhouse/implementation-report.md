# Powerhouse Integration — Implementation Report

Status: **Phases 1–3 implemented in library**. Phase 4 (Example 06) not started.

## Phase 1: Internal Reactor — DONE

In-process, event-sourced document store with persistent PGlite storage and subscription bridge to the ph-clint event bus.

### What was built

**`src/integrations/powerhouse/reactor.ts`** — `buildReactor(options)` lazy-loads six peer dependencies (`@powerhousedao/reactor`, `@electric-sql/pglite`, `kysely`, `kysely-pglite-dialect`, `@powerhousedao/shared/document-drive`, `document-model`) via a `lazyImport()` wrapper that prevents TypeScript from resolving types at compile time. Constructs a `ReactorClientModule` using `ReactorClientBuilder` → `ReactorBuilder` with the user's document models plus the two base models (drive, document-model). PGlite opens a persistent directory at `{workdir}/.ph/{cliName}/reactor-storage/` — survives CLI restarts.

**`src/integrations/powerhouse/drive.ts`** — `ensureDrive(client, driveConfig?)` calls `client.getDrives()` and returns the first existing drive ID, or creates a new one via `client.addDrive()` with the configured name/icon. Default name is `'default'`.

**`src/integrations/powerhouse/subscriptions.ts`** — `bridgeSubscriptions(client, subscriptions, emit)` calls `client.subscribe()` with an optional `documentTypes` filter. Maps Reactor events to ph-clint event bus:
- `Created` → one `powerhouse:document:created` per document (with `documentId`, `documentType`)
- `Updated` → one `powerhouse:document:changed` (with `changeType`, `documents`)
- `Deleted` → one `powerhouse:document:deleted` per document (with `documentId`)
- Errors in the callback are caught silently (don't crash the bus).
- Returns the unsubscribe function from `client.subscribe()`.

**`src/integrations/powerhouse/types.ts`** — TypeScript interfaces for the integration. All Reactor types are `any` (peer dep not importable at compile time):
- `PowerhouseContext` — `{ client, driveId, switchboardUrl?, driveUrl?, mcpUrl?, connectUrl? }`
- `DriveConfig` — `{ name, icon? }`
- `SubscriptionConfig` — `{ documentTypes? }`
- `SwitchboardConfig` — `{ enabled, port? }`
- `ConnectConfig` — `{ enabled, port? }`
- `PowerhouseIntegrationOptions` — combined options for all three phases
- `SwitchboardInstance` — internal handle with URLs + `shutdown()`

**`src/core/types.ts`** — Added `powerhouse?: PowerhouseContext` to `CommandContext`. Imports `PowerhouseContext` from the integration types.

### Core lifecycle hooks

**`src/core/cli.ts`** — Three insertion points:

1. **Setup** (after event bus registration, before Resolvable resolution, ~line 819): iterates `options.integrations` and calls `integration.setup?.(context)` in order.

2. **Teardown — interactive mode** (after headless REPL loop exits, before `exit(0)`): iterates `options.integrations` in reverse and calls `integration.teardown?.()`.

3. **Teardown — command mode** (after routine stop at end of `runImpl`): same reverse-order teardown.

4. **`hasReactor` in metadata**: replaced `false` TODO with `options.integrations?.some(i => i.id === 'powerhouse') ?? false`.

### Events emitted

| Event | When | Payload |
|-------|------|---------|
| `powerhouse:document:created` | Reactor subscription fires `Created` | `{ documentId, documentType }` |
| `powerhouse:document:changed` | Reactor subscription fires `Updated` | `{ changeType, documents }` |
| `powerhouse:document:deleted` | Reactor subscription fires `Deleted` | `{ documentId }` |
| `powerhouse:ready` | End of `setup()` | `{ driveId }` |

### Tests (15 tests)

- `bridgeSubscriptions`: Created/Updated/Deleted mapping, unsubscribe function, documentTypes filter passthrough, error resilience, missing documents gracefully handled
- `ensureDrive`: existing drive returned, new drive created, config passed, default name fallback, null drives list
- `PowerhouseContext` type shape with/without Phase 2+3 fields

---

## Phase 2: Switchboard — DONE

GraphQL + MCP endpoint wrapping the Phase 1 Reactor via `initializeAndStartAPI`.

### What was built

**`src/integrations/powerhouse/switchboard.ts`** — `startSwitchboard(options)` lazy-loads `@powerhousedao/reactor-api` and calls `initializeAndStartAPI` with:
- A `clientInitializer` callback that ignores the `documentModels` parameter and returns the Phase 1 `ReactorClientModule` directly (no second Reactor instance)
- Minimal options: `{ port, dbPath, mcp: true, packages: [] }` — no auth, no HTTPS, no processors
- Returns a `SwitchboardInstance` with computed URLs and a `shutdown()` method that attempts `api.stop()` or falls back to closing the HTTP server.

### Wiring in `setup()`

After Phase 1 completes, if `options.switchboard?.enabled`:
- Imports and calls `startSwitchboard()` with `reactorModule`, port (default 4001), `read-model.db` path, and `driveId`
- Extends `PowerhouseContext` with `switchboardUrl`, `driveUrl`, `mcpUrl`
- Emits `powerhouse:switchboard:ready` with all three URLs

### Wiring in `teardown()`

Switchboard shutdown runs before Reactor shutdown (reverse order). Calls `switchboard.shutdown()`.

### Events emitted

| Event | When | Payload |
|-------|------|---------|
| `powerhouse:switchboard:ready` | After Switchboard HTTP server starts | `{ switchboardUrl, driveUrl, mcpUrl }` |

### Tests

Switchboard module has 0% coverage — requires `@powerhousedao/reactor-api` as a runtime dependency. Will be exercised by Example 06 E2E tests.

---

## Phase 3: Connect UI — DONE

Persistent web UI child process managed by ServiceManager.

### What was built

**`src/integrations/powerhouse/connect.ts`** — `connectServiceDefinition(connectConfig)` returns a `ServiceDefinition`:
- `id: 'connect'`, `name: 'Connect Studio'`
- Command: `ph connect --port {port} --default-drives-url {driveUrl}`
- Env vars: `PH_CONNECT_DEFAULT_DRIVES_URL`, `PH_CONNECT_DRIVES_PRESERVE_STRATEGY`
- Readiness: pattern `/Local:\s*(http:\/\/localhost:\d+)/` with 30s timeout, captures `connect-studio` as `website` endpoint
- Shutdown: `SIGTERM` with 5s timeout
- Restart: disabled

### Wiring

**At construction time** (`definePowerhouseIntegration`): if `options.connect?.enabled`, the service definition is added to the `services` array returned alongside the `integration`. The consumer merges these into `CliOptions.services`. This is necessary because `defineCli` reads services at construction time before `setup()` runs.

**In `setup()`**: after Phase 2 Switchboard is ready, if Connect is enabled and `driveUrl` is available, auto-starts the Connect service via `context.services.start('connect', { params: { port, driveUrl } })`. Failure is non-fatal (caught, logged as warning).

**No teardown**: Connect persists beyond CLI exit by design (ServiceManager detached processes).

### Return type

`definePowerhouseIntegration()` returns `PowerhouseIntegrationResult`:
```typescript
{
  integration: Integration;  // Pass to CliOptions.integrations
  services: ServiceDefinition[];  // Merge into CliOptions.services
}
```

### Tests (9 tests)

- `connectServiceDefinition`: correct id/name/description, command string with port and driveUrl, default port 3000, env vars, readiness patterns, shutdown config, restart disabled

---

## Core changes summary

### Modified files

| File | Change |
|------|--------|
| `src/core/types.ts` | Import `PowerhouseContext`, add `powerhouse?` to `CommandContext` |
| `src/core/cli.ts` | Integration setup (1 block), teardown (2 blocks, interactive + command mode), `hasReactor` detection |
| `src/index.ts` | Export `definePowerhouseIntegration`, `PowerhouseIntegrationResult`, and all Powerhouse types |
| `package.json` | `./powerhouse` export path, 8 optional peer deps with meta |

### New files

| File | LOC | Purpose |
|------|-----|---------|
| `src/integrations/powerhouse/types.ts` | 91 | All TypeScript interfaces |
| `src/integrations/powerhouse/reactor.ts` | 65 | Lazy reactor builder with PGlite |
| `src/integrations/powerhouse/drive.ts` | 35 | Drive find-or-create |
| `src/integrations/powerhouse/subscriptions.ts` | 53 | Event bridge |
| `src/integrations/powerhouse/switchboard.ts` | 75 | Switchboard wrapper |
| `src/integrations/powerhouse/connect.ts` | 47 | Connect service definition |
| `src/integrations/powerhouse/index.ts` | 171 | `definePowerhouseIntegration()` orchestrator |
| `tests/powerhouse-integration.test.ts` | ~230 | Unit tests for modules |
| `tests/powerhouse-cli.test.ts` | ~160 | Integration lifecycle tests |

### Test results

- **849 tests pass** (814 existing + 35 new), 0 regressions
- Build clean, no TypeScript errors
- Coverage thresholds fail due to untestable modules (reactor.ts, switchboard.ts require peer deps)

### Peer dependencies added (all optional)

| Package | Version | Used by |
|---------|---------|---------|
| `@powerhousedao/reactor` | ^6.0.2 | Phase 1: ReactorBuilder, ReactorClientBuilder |
| `@powerhousedao/reactor-api` | ^6.0.2 | Phase 2: initializeAndStartAPI |
| `@powerhousedao/reactor-mcp` | ^6.0.2 | Phase 2: MCP endpoint (transitive) |
| `@powerhousedao/shared` | ^6.0.2 | Phase 1: driveDocumentModelModule |
| `@electric-sql/pglite` | ^0.2.0 | Phase 1: PGlite database |
| `document-model` | ^6.0.2 | Phase 1: documentModelDocumentModelModule |
| `kysely` | ^0.27.0 | Phase 1: query builder for PGlite |
| `kysely-pglite-dialect` | ^0.1.0 | Phase 1: Kysely dialect for PGlite |

---

## Known gaps

1. **No Zod validation of `PowerhouseIntegrationOptions`** — Options are TypeScript interfaces only. Runtime validation (e.g. rejecting `connect.enabled` without `switchboard.enabled`) would require a Zod schema in a `config.ts` module, as originally planned.

2. **`reactor.ts` and `switchboard.ts` have 0% test coverage** — They can only be tested with the Powerhouse packages installed. Example 06 will provide E2E coverage.

3. **`initializeAndStartAPI` signature assumptions** — The `switchboard.ts` implementation assumes specific options shape and return type based on the Phase 2 spec's code analysis. Must be validated against the actual `@powerhousedao/reactor-api` package.

4. **`ensureDrive` assumes `getDrives()` returns drive IDs** — Based on spec. Actual Reactor client API may differ.

5. **Shutdown path for Ink REPL** — The non-headless interactive mode (`startInkRepl`) exits via `exit(0)` without teardown. Only the headless path (used in tests) has teardown. The Ink path is `/* istanbul ignore next */` and runs in real terminals — teardown there would need to happen inside `startInkRepl` or via a cleanup callback.

---

## Phase 4: Example 06 (`06-connect-agent`) — PLANNED

### Overview

A ph-clint CLI that connects a Mastra AI agent to the Powerhouse document ecosystem. Users can chat with the agent via the terminal REPL or via Connect (browser). All messages are persisted as operations on an **agent-chat** document in a Reactor drive. The CLI enables all three Powerhouse layers (Reactor + Switchboard + Connect) plus a Mastra agent with memory.

### Two-project structure

```
examples/06-connect-agent/
├── agent-app/          # Reactor package (Vetra project) — DONE
│   ├── document-models/agent-chat/   # Document model + generated code
│   ├── editors/agent-chat-editor/    # Connect editor (boilerplate, needs UI)
│   ├── package.json                  # Powerhouse deps (@powerhousedao/reactor, etc.)
│   └── ...
└── agent-cli/          # ph-clint CLI project — TO BUILD
    ├── src/
    │   ├── index.ts        # defineCli + definePowerhouseIntegration + defineMastraIntegration
    │   ├── agent.ts        # Mastra agent definition
    │   ├── bridge.ts       # StreamChunk ↔ agent-chat document operations bridge
    │   └── trigger.ts      # Document change trigger (agent-chat → agent response)
    ├── tests/
    ├── package.json        # ph-clint (file:), agent-app (file:), mastra deps
    └── tsconfig.json
```

**`agent-app`** is a standalone Reactor package built with Vetra tooling. It is already created: document model defined, code generated, types clean, 29 tests pass. The ph-clint CLI project (`agent-cli`) imports it as a `file:` dependency to get the document model module and generated types.

**`agent-cli`** is the ph-clint project that wires everything together.

### Agent-Chat document model (already implemented in `agent-app`)

**Type ID**: `powerhouse/agent-chat`

**State** (`AgentChatState`):
- `topic: string | null` — Optional conversation subject
- `agents: AgentInfo[]` — Participating AI agents (id, name, role, description, avatar, ethAddress, removed)
- `stakeholders: Stakeholder[]` — Human participants (id, name, avatar, ethAddress, removed)
- `messages: ChatMessage[]` — Conversation messages
- `pruneLength: number | null` — Max messages kept in state (older pruned on write)

**Message types** (`ChatMessage.type`):
| MessageType | Fields used | Maps to ph-clint StreamChunk |
|-------------|-------------|------------------------------|
| `Text` | `text: string[]`, `format` | `text-delta` (each chunk → one `sendText` or auto-append) |
| `ToolCall` | `toolCall: { name, argsJson }` | `tool-call` |
| `ToolResult` | `toolResult: { name, result, isError }`, `format` | `tool-result` |
| `Error` | `error: string`, `format` | `error` |

**Key behaviors**:
- `sendTextOperation`: Auto-appends to last message if same sender + type Text (streaming-friendly)
- `pruneMessagesIfNeeded`: After each send, trims to `pruneLength` from the end
- `markAsReadOperation`: Tracks which participants have read each message
- `addReaction` / `removeReaction`: Emoji reactions per message

**5 modules, 28 operations**:
- `base`: setTopic, clearTopic, setPruneLength, removePruneLength
- `stakeholders`: addStakeholder, removeStakeholder, readdStakeholder, setStakeholderName/Avatar/EthAddress
- `agents`: addAgent, removeAgent, readdAgent, setAgentName/Description/Role/Avatar/EthAddress
- `messages`: sendText, sendError, sendToolCall, sendToolResult, deleteMessage, markAsRead
- `reactions`: addReaction, removeReaction

### StreamChunk ↔ Document bridge (`bridge.ts`)

The bridge translates between Mastra's streaming protocol and agent-chat document operations. Two directions:

**Agent output → Document** (writing): Consumes the agent's `AsyncGenerator<StreamChunk>` and dispatches document operations:

```
StreamChunk { type: 'text-delta', text }     → sendText({ sender: agentId, text, format: 'MarkDown' })
StreamChunk { type: 'tool-call', name, args } → sendToolCall({ sender: agentId, toolName, argsJson })
StreamChunk { type: 'tool-result', ... }      → sendToolResult({ sender: agentId, toolName, result, isError })
StreamChunk { type: 'error', error }          → sendError({ sender: agentId, error })
```

Text-delta chunks accumulate and flush on: (a) tool-call/tool-result/error chunk, (b) stream end, or (c) a configurable flush interval. This leverages `sendTextOperation`'s auto-append behavior — repeated `sendText` calls from the same sender extend the last message's `text[]` array rather than creating new messages.

**Document → Agent input** (reading): Reads `state.messages` and converts to Mastra message format for agent context:

```
ChatMessage { type: 'Text', sender, text }        → { role: sender==agent ? 'assistant' : 'user', content: text.join('') }
ChatMessage { type: 'ToolCall', toolCall }         → { role: 'assistant', content: [{ type: 'tool-use', ... }] }
ChatMessage { type: 'ToolResult', toolResult }     → { role: 'tool', content: toolResult.result }
ChatMessage { type: 'Error', error }               → { role: 'assistant', content: error }
```

### Document change trigger (`trigger.ts`)

A ph-clint trigger that listens for `powerhouse:document:changed` events on the event bus. When a message is added to the agent-chat document by a stakeholder (human user), it produces a work item for the routine loop. The agent then processes the message and writes its response back to the document.

Filter logic:
1. Event `documentType` must be `powerhouse/agent-chat`
2. The latest message's `sender` must be a stakeholder ID (not an agent ID)
3. The latest message must not already have a response from an agent

This prevents infinite loops (agent responds → triggers change → but sender is agent → filtered out).

### CLI definition (`index.ts`)

```typescript
import { defineCli, definePowerhouseIntegration, defineMastraIntegration } from 'ph-clint';
import { agentChatDocumentModelModule } from 'agent-app/document-models/agent-chat';

const { integration, services } = definePowerhouseIntegration({
  documentModels: [agentChatDocumentModelModule],
  drive: { name: 'Agent Chat' },
  subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
  switchboard: { enabled: true, port: 4001 },
  connect: { enabled: true, port: 3000 },
});

const mastra = defineMastraIntegration({ agent: chatAgent });

export const cli = defineCli({
  name: 'connect-agent',
  version: '0.1.0',
  integrations: [integration, mastra],
  services: [...services],
  triggers: [documentChangeTrigger],
  // commands, config, etc.
});
```

### User interaction flows

**Flow 1 — Terminal REPL**:
1. User types message in REPL (default subcommand or `/chat`)
2. CLI dispatches `addStakeholder` (if first message) + `sendText` to agent-chat document
3. Document change event fires → trigger produces work item
4. Routine loop picks up work item → agent generates response (streamed)
5. Bridge writes StreamChunks to document as `sendText`/`sendToolCall`/`sendToolResult`
6. Response text streamed to terminal

**Flow 2 — Connect (browser)**:
1. User opens Connect at `localhost:3000`, navigates to agent-chat document
2. Editor UI shows conversation, user types message
3. Editor dispatches `sendText` operation → Reactor processes it
4. Switchboard subscription → event bus → trigger → agent response (same as steps 3-5 above)
5. Reactor state updates → Switchboard pushes to Connect → editor re-renders with response

### Implementation steps

#### Step 1: Scaffold `agent-cli` project
- `package.json` with dependencies: `ph-clint` (file:), `agent-app` (file:), `@mastra/core`, `@ai-sdk/anthropic`
- `tsconfig.json` extending ph-clint conventions
- Basic `src/index.ts` with `defineCli` + `definePowerhouseIntegration` (no agent yet)
- Verify: CLI starts, Reactor initializes, Switchboard serves GraphQL, Connect opens

#### Step 2: StreamChunk ↔ Document bridge
- Implement `bridge.ts` with `writeStreamToDocument()` and `readDocumentAsMessages()`
- Unit tests: each StreamChunk type maps correctly, text-delta buffering works, flush on tool activity
- Unit tests: document messages convert to Mastra message format

#### Step 3: Agent definition
- Implement `agent.ts` with Mastra agent (system prompt, tools, model config)
- Agent receives conversation history from document, responds via stream
- Configure Mastra memory with thread per document ID

#### Step 4: Document change trigger
- Implement `trigger.ts` listening to `powerhouse:document:changed`
- Filter: only stakeholder messages, only agent-chat documents
- Unit tests: filter logic, work item shape

#### Step 5: Wire everything together
- Connect bridge + agent + trigger in `index.ts`
- REPL default subcommand sends user text → document → trigger → agent → document → terminal
- Integration tests: full round-trip message flow

#### Step 6: Agent-chat editor UI (in `agent-app`)
- Implement the editor component in `editors/agent-chat-editor/editor.tsx`
- Chat bubble UI, message input, auto-scroll, sender avatars
- Uses `useSelectedAgentChatDocument()` hook + action creators from generated code

#### Step 7: E2E tests
- CLI starts all three layers successfully
- Send message via REPL → agent responds → response visible in document state
- Switchboard GraphQL returns updated document with messages
- Connect editor loads and displays conversation

### Acceptance criteria

1. `pnpm start` in `agent-cli/` starts Reactor + Switchboard + Connect without errors
2. User can type a message in the REPL and receive an AI agent response
3. Messages are persisted in the agent-chat document (survives CLI restart)
4. Connect at `localhost:3000` shows the conversation with a working editor
5. Sending a message via Connect triggers the agent to respond
6. Agent tool calls and results are recorded as ToolCall/ToolResult messages
7. Text streaming uses auto-append (single message with multiple text chunks, not many messages)
8. Message pruning works when `pruneLength` is configured
9. All existing ph-clint tests continue to pass (0 regressions)

### Dependencies

| Package | Source | Used for |
|---------|--------|----------|
| `ph-clint` | `file:../../packages/ph-clint` | CLI framework |
| `agent-app` | `file:../agent-app` | Document model module + types |
| `@mastra/core` | npm | Agent framework |
| `@ai-sdk/anthropic` | npm | Claude model provider |
| `@powerhousedao/reactor` | npm ^6.0.2 | Reactor runtime (peer dep of ph-clint) |
| `@powerhousedao/reactor-api` | npm ^6.0.2 | Switchboard (peer dep of ph-clint) |
| `@powerhousedao/shared` | npm ^6.0.2 | Drive document model (peer dep of ph-clint) |
| `@electric-sql/pglite` | npm ^0.2.0 | PGlite storage (peer dep of ph-clint) |
| `document-model` | npm ^6.0.2 | Base document model (peer dep of ph-clint) |
| `kysely` + `kysely-pglite-dialect` | npm | PGlite query layer (peer dep of ph-clint) |

### Validation goals

This example serves as the first real-world validation of the Phases 1-3 library code against actual Powerhouse packages. Known gaps to validate:
- `buildReactor()` successfully creates a `ReactorClientModule` with PGlite
- `ensureDrive()` correctly uses the Reactor client API (`getDrives()`, `addDrive()`)
- `startSwitchboard()` correctly calls `initializeAndStartAPI` with the right options shape
- Subscription events fire correctly and bridge to the event bus
- Connect service starts and connects to the Switchboard drive URL
