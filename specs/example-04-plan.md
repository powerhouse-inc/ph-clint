# Example 04 — Chat Assistant: Implementation Plan

## Project Structure

Example 04 becomes a full project, modeled on the agent-rupert-cli prototype:

```
examples/04-chat-assistant/
├── package.json              # deps: ph-clint, @mastra/core, @mastra/memory, @mastra/libsql
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── cli.ts                # Entry point — defineCli + defineMastraIntegration
│   ├── commands/
│   │   ├── search.ts         # defineCommand — web search (stubbed for tests)
│   │   └── summarize.ts      # defineCommand — URL summarizer (stubbed for tests)
│   ├── agents/
│   │   └── assistant.ts      # Mastra Agent config (model, instructions, tool refs)
│   └── config.ts             # configSchema (model, apiKey, etc.)
├── tests/
│   ├── streaming.test.ts     # Stream chunk types, iterateFullStream, REPL streaming
│   ├── agent.test.ts         # Agent routing, default subcommand, memory/resume
│   └── cli.test.ts           # Full CLI integration (run with RunOptions)
└── README.md                 # (already exists)
```

## Library vs Example Responsibilities

| Concern | Library (`packages/ph-clint/`) | Example (`examples/04-chat-assistant/`) |
|---|---|---|
| Stream chunk types | `StreamChunk`, `iterateFullStream()` | — |
| Streaming command support | Execute returns `Promise \| AsyncGenerator` | Commands use either |
| REPL streaming | Accumulate chunks, render incrementally | — |
| Integration registry | `Integration` interface, lifecycle hooks | — |
| Agent abstraction | `AgentProvider` interface (stream, memory) | — |
| `defaultCommand` | Routing in REPL + command mode | Config value |
| `--resume <thread-id>` | Flag parsing, passed to agent provider | — |
| `defineMastraIntegration()` | In `src/integrations/mastra/` | Called in `src/agents/assistant.ts` |
| Command→tool adapter | Converts `Command[]` to Mastra `createTool()` | — |
| Agent definitions | — | `src/agents/assistant.ts` |
| Concrete commands | — | `src/commands/*.ts` |

## Implementation Phases

Each phase is a separate commit. Phases 1–3 are library-only (no Mastra dependency). Phase 4 introduces Mastra.

### Phase 1: Streaming Infrastructure

New library code in `core/` and `interactive/`:

- **`StreamChunk` type** — union: `{ type: 'text-delta', text: string }`, `{ type: 'tool-call', toolName: string, args: unknown }`, `{ type: 'tool-result', toolName: string, result: unknown, isError: boolean }`, `{ type: 'error', error: string }`
- **`iterateFullStream()`** — utility that formats `StreamChunk[]` into display strings (the `▶ tool(args)` / `✓ tool → result` pattern from the prototype)
- **Command execute return type** — widen to `Promise<TOutput> | AsyncGenerator<StreamChunk>`. Existing commands unchanged.
- **REPL streaming** — `processInput()` returns a stream-aware result. The session accumulates chunks and renders them.

### Phase 2: Integration Registry + Agent Abstraction

New interfaces in `core/types.ts` (no Mastra imports):

```typescript
interface AgentProvider {
  id: string;
  stream(prompt: string, opts: AgentStreamOptions): AsyncGenerator<StreamChunk>;
}

interface AgentStreamOptions {
  threadId?: string;
  tools?: Map<string, Command>;  // CLI commands available as agent tools
}

interface Integration {
  id: string;
  agents?: AgentProvider[];
  setup?(context: CommandContext): Promise<void>;
  teardown?(): Promise<void>;
}
```

- **`integrations` on `CliOptions`** — array of `Integration` objects
- **`defaultCommand`** — `'agent:<agent-id>'` pattern; bare text routes to named agent
- **`--resume <thread-id>`** — program-level flag (like `--wait`), stripped before Commander sees it

The REPL routes bare text → `agentProvider.stream(text, { threadId, tools })` → renders stream chunks.

Command mode: `assist "question"` → same stream → stdout → exit.

### Phase 3: Example Tests (Red)

Write example 04 tests against the library API. Tests use a **test agent provider** (not Mastra) — an in-process `AgentProvider` that yields predetermined chunks. This keeps tests fast and deterministic without mocking Mastra internals.

```typescript
// Test helper — not a mock of Mastra, but a real AgentProvider implementation
function createTestAgent(responses: Map<string, StreamChunk[]>): AgentProvider {
  return {
    id: 'test-assistant',
    async *stream(prompt, opts) {
      const chunks = responses.get(prompt) ?? [{ type: 'text-delta', text: 'I don\'t know' }];
      for (const chunk of chunks) yield chunk;
    },
  };
}
```

Tests cover:
- Bare text → agent streaming (REPL + command mode)
- `/search` and `/summarize` → direct command execution
- Tool call/result chunks rendered inline
- `--resume` passes thread ID to agent provider
- Escape interrupts stream (partial output preserved)
- Thread ID displayed on exit

### Phase 4: Mastra Integration (Green)

New code in `src/integrations/mastra/`:

- **`defineMastraIntegration()`** — takes agent configs, memory config, returns an `Integration`
- **`MastraAgentProvider`** — wraps `agent.stream()` + `iterateFullStream()` from Mastra's `fullStream`
- **Command→tool adapter** — converts `Command` definitions to Mastra `createTool()` format so agents can use CLI commands as tools
- **Memory wiring** — thread-based via `@mastra/memory` + `@mastra/libsql`

This is the only code that imports from `@mastra/*`. It's lazy-loaded.

### Phase 5: Example Project Wiring + E2E

- Wire `src/cli.ts` with real Mastra agent (using a cheap model or test mode)
- `pnpm build` + `pnpm start` verification
- E2E tests that spawn the real CLI (may skip LLM calls or use a test agent)

## Design Decisions

1. **`AgentProvider` is the abstraction boundary.** Core code never imports Mastra. The Mastra integration produces `AgentProvider` instances that the core consumes. This keeps the door open for other agent frameworks.

2. **Test agent is a real `AgentProvider`, not a Mastra mock.** Tests exercise the full pipeline (routing, streaming, REPL rendering) with a deterministic agent. No mocking of Mastra internals. Mastra-specific tests live in the integration package.

3. **Streaming is additive.** Existing `Promise<TOutput>` commands keep working. `AsyncGenerator<StreamChunk>` is the new capability. The framework detects which type was returned and handles accordingly.

4. **`--resume` is a program-level flag** (like `--wait`), stripped before Commander sees it.

5. **Lazy loading.** Mastra is only imported when an agent command is invoked. `assist /search --query X` never loads Mastra.

6. **Memory is internal to `AgentProvider`.** The library only cares about `threadId` as an opaque string passed through to the provider. Memory backend selection is the integration's concern.

7. **Streaming chunks flow through REPL/command-mode rendering, not routine `onOutput`.** Routines stay as-is (they work with command results); streaming is a foreground concern.

## Prototype Reference

The `prototypes/agent-rupert-cli/` project demonstrates the target patterns:
- `src/stream-utils.ts` — `iterateFullStream()` formatting of Mastra's fullStream chunks
- `src/repl/Repl.tsx` — Ink REPL with streaming accumulation + Static history
- `src/repl/CommandRunner.tsx` — streaming command executor component
- `src/mastra/index.ts` — Mastra instance setup (agents, tools, storage, memory)
- `src/mastra/agents/*.ts` — Agent definitions with workspace, skills, tools
- `src/commands/registry.ts` — AsyncGenerator-based command registry
- `src/commands/prompt.tsx` — bare text → agent routing
- `src/config/reactor-config.ts` — 3-layer config resolution
