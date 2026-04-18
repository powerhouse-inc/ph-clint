# ph-clint — Implementation Spec

**Powerhouse Command Line Intelligence** — this document describes the technology choices, design patterns, and runtime architecture for ph-clint, based on analysis of the `agent/` and `agent-rupert-cli/` prototypes.

## Technology Stack

### Language and Runtime

| Technology | Version | Source |
|---|---|---|
| TypeScript | ^6.0 | agent-rupert-cli |
| Node.js | >=22.13.0 | agent-rupert-cli |
| ES Target | ES2022 | both |
| Module System | Node16 (ESM) | agent-rupert-cli |
| JSX | react-jsx | agent-rupert-cli |

Both projects target ES2022 with strict mode. agent-rupert-cli uses the newer TypeScript 6 and Node16 module resolution which is the better fit for a library.

### Core Dependencies

| Package | Version | Purpose |
|---|---|---|
| `zod` | ^4.3 | Schema definitions for commands, compatible with Mastra tools and Powerhouse document operations |
| `ink` | ^6.8 | React-based terminal UI for interactive mode |
| `react` | ^19.2 | Component model for Ink |
| `commander` | ^12.1 | CLI argument parsing for command mode |
| `ink-text-input` | ^6.0 | REPL text input component |
| `ink-spinner` | ^5.0 | Loading/progress indicators |
| `marked` | ^12.0 | Markdown parsing |
| `marked-terminal` | ^7.3 | Terminal-aware markdown rendering (see caveat below) |

> **Caveat: `marked-terminal` list rendering.** `marked-terminal` inserts whitespace-only separator lines (indentation + ANSI reset) between list items, especially in loose lists. The library works around this with two measures in `renderMarkdown()`: (1) a `walkTokens` hook that forces `loose: false` on all lists/items to prevent extra separators from loose-list parsing, and (2) a post-processing filter that strips lines which are whitespace-only after ANSI codes are removed. Additionally, the Ink REPL displays raw text during streaming rather than calling `renderMarkdown()` on every chunk — markdown is rendered once on the final result to avoid visual "jumps" when `marked` reclassifies a growing list from tight to loose. See `specs/archive/issues/marked-terminal-list-spacing.md` for the full investigation.

### Mastra (AI Agent Framework)

| Package | Version | Purpose |
|---|---|---|
| `@mastra/core` | ^1.22 | Agent definitions, tool system, workspace abstraction |
| `@mastra/memory` | ^1.13 | Thread-based conversation memory |
| `@mastra/mcp` | ^1.4 | MCP server/client for tool exposure and consumption |
| `@mastra/libsql` | ^1.7 | Persistent storage for sessions and state |
| `@mastra/loggers` | ^1.1 | Structured logging (Pino) |
| `@mastra/evals` | ^1.2 | Agent evaluation and scoring (optional) |
| `@mastra/observability` | ^1.7 | Tracing and telemetry (optional) |

Mastra serves as the **agent abstraction layer**, avoiding vendor lock-in across LLM providers. It provides a uniform interface for tool definitions, multi-agent coordination, workspaces, and memory — all of which map directly to ph-clint features.

### Powerhouse (Document Reactor)

| Package | Version | Purpose |
|---|---|---|
| `@powerhousedao/reactor` | ^6.0.2 | Document reactor — storage, sync, subscriptions |
| `document-drive` | ^6.0.2 | Drive management and remote document sync |
| `document-model` | ^6.0.2 | Document model definitions and operations |
| `@powerhousedao/agent-manager` | latest | Agent inbox and work-breakdown-structure documents |
| `@powerhousedao/common` | ^6.0.2 | Shared utilities |

The Powerhouse reactor is **not a hard dependency** of the library itself, but a first-class integration target. CLIs that work with Powerhouse documents use the reactor for:

- Loading and subscribing to document changes (event source for routines)
- Dispatching operations to documents (command execution target)
- Mounting remote drives (long-running service managed by the process manager)

### Build Tooling

| Tool | Version | Purpose |
|---|---|---|
| `tsx` | ^4.19 | Development runner (fast TypeScript execution) |
| `tsup` | ^8.5 | Production bundling (used in agent-rupert-cli for MCP server) |

---

## Design Patterns

### Testability Pattern

**Maps to:** Core Design Principle (Testability)

All framework components that interact with the process environment (stdout, stderr, exit, filesystem) accept injectable callbacks rather than calling process globals directly. This is not optional — it is the standard pattern for all new code.

**The `RunOptions` pattern:**

```typescript
interface RunOptions {
  exit?: (code: number) => void;    // defaults to process.exit
  stdout?: (msg: string) => void;   // defaults to console.log
  stderr?: (msg: string) => void;   // defaults to console.error
}

// Production: uses process defaults
cli.run(process.argv);

// Testing: captures output without mocks or subprocesses
const output: string[] = [];
await cli.run(['node', 'test', 'greet', '--name', 'Alice'], {
  stdout: (msg) => output.push(msg),
  stderr: (msg) => errors.push(msg),
  exit: (code) => { exitCode = code; },
});
```

This pattern applies wherever the framework touches process boundaries: the CLI runner, output renderers, process managers, service executors. As new modules are added, they must follow the same approach — injectable I/O with process defaults.

**Testing levels for CLIs built with ph-clint:**

| Level | How | What it exercises |
|-------|-----|-------------------|
| Unit | `cli.execute('cmd', args)` | Command logic, schema validation |
| Integration | `cli.run(argv, { stdout, stderr, exit })` | Full Commander pipeline, option parsing, error handling |
| E2E | `exec('tsx', ['cli.ts', ...args])` | Real process, real stdout/stderr/exit codes |

### Command Definition Pattern

**Maps to:** Features 3 (Unified Subcommands), 5 (Zod-Based Definitions), 6 (Auto-Generated Help)

Commands follow the Mastra `createTool()` shape — a Zod input schema, an optional output schema, and an execute function. This is the **canonical format** from which CLI args, help text, interactive prompts, MCP tool definitions, and auto-completion are all derived.

```typescript
// Mastra tool shape (from agent-rupert-cli)
createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ location }) => { ... },
});
```

The library wraps this with CLI-specific metadata (prompt behavior, grouping, aliases) while preserving the core shape so that:

- Existing Mastra agent tools can be registered as subcommands directly.
- Powerhouse document operations (which carry Zod schemas) can be adapted into commands.
- Commands can be re-exported as MCP tools without conversion.

### Streaming Execution Pattern

**Maps to:** Feature 8 (Structured and Streaming Output)

Both prototypes converge on `AsyncGenerator<T>` as the output primitive:

- agent-rupert-cli commands return `AsyncGenerator<string>` and the REPL consumes them incrementally.
- agent/ task executors stream stdout/stderr through callbacks.

The library standardizes on a **typed result stream** — commands yield structured chunks (text deltas, tool calls, status updates, structured data) that transport adapters render appropriately. This mirrors the Mastra `fullStream` event types:

```
text-delta | tool-call | tool-result | error | step-finish
```

### REPL Component Architecture

**Maps to:** Features 10 (Interrupt), 14 (Default Interface), 16 (Default Subcommand)

The interactive mode uses Ink's React component model, following agent-rupert-cli's proven pattern:

- `<Static>` for conversation history (immutable, scrolled off-screen).
- Streaming text area for in-progress output.
- `<TextInput>` for user input with auto-completion.
- `useInput()` for Escape key interrupt handling.
- `useApp()` for lifecycle management.
- Two-phase state machine: `idle` ↔ `executing`.

The library provides these as composable components that generated CLIs assemble with their branding and configuration.

### Workspace and Configuration Pattern

**Maps to:** Features 2 (Workspace, Context, and Configuration), 18 (Configuration and Theming)

#### Workspace vs Context

The **workspace** is the user/agent working directory — where data lives. It defaults to `cwd` and is configurable via `--workdir` or an implementation override.

The **context folder** (`{workspace}/.ph/`) is ph-clint's managed state directory. It contains per-workspace config and Mastra databases. The user doesn't edit it directly.

Workspace resolution is a **prerequisite**, not a config value — it must be known before any config files can be located. Resolution order: (1) `cwd` fallback, (2) `--workdir` flag, (3) implementation override. When (3) is set, `--workdir` is hidden from the CLI.

#### Config Resolution (6 layers)

1. **`--config <path>` flag** — path relative to `cwd` (not workspace). Highest priority.
2. **Environment variables** (`{CLINAME}_{FIELD_NAME}`) — per-field overrides.
3. **Local config** (`{workspace}/.ph/{cli-name}.config.local.json`) — per-workspace persistent config.
4. **User config** (`~/.ph/{cli-name}.config.user.json`) — user-wide defaults.
5. **Implementation defaults** — values passed from the project to `defineCli()`.
6. **Hardcoded defaults** — from Zod schema `.default()` calls.

#### Typed Config Schema

Config schemas are Zod objects, same as command inputs. The framework provides a generic type so implementations get full type safety:

```typescript
// Implementation defines the schema
const configSchema = z.object({
  apiKey: z.string().describe('API key'),
  port: z.number().default(3000),
});

// CommandContext.config is typed as z.infer<typeof configSchema>
// Not Record<string, unknown>
```

#### First-Run Prompting

If the schema has mandatory fields without defaults and no layer provides a value, the framework prompts the user interactively and writes the answers to the local config file. This replaces the need for manual config file creation on first run.

### Process Management Pattern

**Maps to:** Features 9 (Background Processes), 10 (Interrupt and Cancellation)

The agent/ prototype provides two mature task executors that the library incorporates:

**CLIExecutor** — for commands that run to completion:
- `child_process.spawn()` with streaming stdout/stderr capture.
- Configurable timeout with graceful kill (SIGTERM → SIGKILL).
- Retry logic with exponential backoff.
- Max output buffer with truncation.

**ServiceExecutor** — for long-running processes:
- Boot phase with **readiness detection** via regex patterns on output streams.
- Endpoint capture groups (extract URLs/ports from startup output).
- Graceful shutdown with configurable signal and timeout.
- Port release verification after termination.
- Restart policy with configurable max retries.
- Circular log buffer (capped at configurable size).

Both emit lifecycle events (`started`, `completed`, `failed`, `output`, `ready`, `restarting`) that feed into the event handler system.

### Event Bus Pattern

**Maps to:** Feature 11 (Event Handlers)

A central `EventEmitter`-based bus that all event sources publish to:

| Event Source | Examples |
|---|---|
| Powerhouse Reactor | Document change, drive sync, inbox message |
| Background processes | Process started, ready, output, completed, failed |
| External | Webhook, MCP call, transport-specific (Slack message, etc.) |
| Internal | Timer, session event, command completion |

Handlers subscribe to event types and can inspect payloads. The bus is decoupled from both the routine loop and the REPL — it's a shared backbone.

### Routine Loop Pattern

**Maps to:** Feature 12 (Routine Loop)

Generalized from the agent/ prototype's `AgentRoutine`, which uses a tick-based loop driven by Powerhouse document triggers (inbox messages, WBS goals). The library abstracts this into a **trigger-agnostic loop** that works with or without an agent.

**Loop structure (per tick):**

```
while (status === 'running') {
  iterationStart = now()

  // 1. Poll triggers for new work
  for (trigger of registeredTriggers) {
    workItem = trigger.poll(context)
    if (workItem) queue.push(workItem)
  }

  // 2. Execute next queued item (FIFO)
  if (queue.hasWork()) {
    item = queue.next()
    item.status = 'in-progress'
    try {
      result = await execute(item)
      item.status = 'succeeded'
      await item.callbacks?.onSuccess?.(result)
    } catch (error) {
      item.status = 'failed'
      await item.callbacks?.onFailure?.(error)
    }
    queue.remove(item)
  }

  // 3. Respect timing constraints
  elapsed = now() - iterationStart
  idle = max(minimumIdleMs, minimumTickMs - elapsed)
  await sleep(idle)
}
```

**Trigger interface:**

Triggers are pluggable objects that produce work items. Each trigger implements:

```typescript
interface Trigger {
  id: string;
  poll(context: RoutineContext): WorkItem | null;
  setup?(): Promise<void>;     // called when loop starts
  teardown?(): Promise<void>;  // called when loop stops
}
```

**Polling vs push-activation:**

Triggers currently support only polling (`type: 'condition'`): the routine calls `poll()` every tick. Push-activated triggers are planned in two stages:

1. **Near-term — expose `on()` in `TriggerContext`.** Adding `on(event, handler)` alongside the existing `emit()` lets a condition trigger subscribe to events during `setup()` and buffer incoming items for `poll()` to drain:

```typescript
defineTrigger({
  id: 'doc-change',
  type: 'condition',
  setup: async (ctx) => {
    ctx.on('document:changed', (data) => {
      ctx.state.pending = data;               // push fills the buffer
    });
  },
  poll: async (ctx) => {
    if (ctx.state.pending) {                   // poll drains it
      const data = ctx.state.pending;
      ctx.state.pending = null;
      return { type: 'command', params: { commandId: 'sync', args: data } };
    }
    return null;
  },
});
```

2. **Later — `type: 'event'` with declarative shorthand.** A dedicated event trigger type with `events` and `map` fields auto-generates the setup/poll plumbing:

```typescript
defineTrigger({
  id: 'doc-change',
  type: 'event',
  events: ['document:changed'],
  map: (event, data) => ({
    type: 'command',
    params: { commandId: 'sync', args: { docId: data.id } },
  }),
});
```

The **event trigger** bridges the event bus into the loop — it listens for specific event types and converts them into work items. This is how Powerhouse document changes, process completions, and external signals enter the loop. Condition triggers can also be purely polling-based (check a condition, query an API) without going through the event bus.

**Work item execution** dispatches based on type:

| Work Item Type | Execution Path | Agent Required? |
|---|---|---|
| `command` | Invoke a CLI subcommand with args | No |
| `function` | Call an arbitrary async function | No |
| `agent` | Stream a prompt to the active Mastra agent | Yes |
| `skill` | Execute a named skill with context | Yes |
| `idle` | No-op (no triggers fired) | No |

This separation means the loop can drive:

- **Non-agentic automation** — Watch for file changes → run build command. Poll an API → dispatch notification. React to process completion → start next step in a pipeline.
- **Agentic autonomy** — Receive inbox message → agent interprets and acts. WBS goal becomes available → agent executes the associated skill. Agent decides what to do next based on accumulated context.

**State machine:** `init` → `ready` → `running` ↔ `stopping`. Mirrors the AgentRoutine prototype. `ready` means all triggers have been set up. `stopping` drains the current work item before transitioning back to `ready`.

**Command mode with `--wait`:** The loop can be started in command mode when the CLI is invoked with a `--wait` flag. The process stays alive, the loop ticks, and triggers fire. Output goes to stdout. The process exits when the loop is explicitly stopped or a configured exit condition is met (e.g., a specific trigger fires, a work item completes, or a timeout elapses).

**Interaction with the REPL:** In interactive mode, the loop runs concurrently with user input. Work items execute in the background (or foreground if configured). The user can inspect the loop state, pause/resume it, and manually queue work items via built-in commands (e.g., `/routine status`, `/routine pause`).

### Skills Authoring and Build Pipeline

**Maps to:** Feature 15 (Agent Skills)

Skills are authored as Handlebars markdown templates and compiled at build time. The pipeline follows the pattern established in agent-rupert-cli:

**Authoring (source):**
```
skills-src/
├── agent-profiles/
│   ├── AgentBase.md              # Base profile with Powerhouse primer
│   └── {AgentName}.md            # Agent-specific instructions
└── skills/
    └── {skill-name}/
        ├── .preamble.md          # Domain briefing (optional)
        ├── 00.first-scenario.md  # Numbered scenario files
        ├── 01.second-scenario.md
        └── .result.md            # Expected outcome (optional)
```

**Build step (`build:skills`):**
1. Load the CLI's resolved configuration (from the Zod config schema).
2. Register Handlebars helpers (`formatDate`, `join`, `exists`, `eq`, `default`, etc.).
3. Render agent profile templates with config values injected (ports, paths, URLs, timeouts).
4. For each skill directory: concatenate preamble + sorted scenarios + result into a single `SKILL.md` with YAML frontmatter (name, description, metadata).
5. Generate a TypeScript module exporting compiled agent instructions as constants.

**Output:**
```
skills/{skill-name}/SKILL.md      # Compiled skill files
src/generated/agent-instructions.ts  # Agent system prompts with config baked in
```

**Standard Powerhouse skills** (shipped with the library when Powerhouse integration is enabled):

| Skill | Content |
|---|---|
| **Powerhouse Technology Primer** | Reactor architecture, document model system (self-contained, cryptographically verifiable, append-only), drives, Connect, Switchboard, Fusion platform, available scalar types |
| **Document Access and Editing** | Reading documents, dispatching operations via `addActions`, drive operations (`ADD_FILE`, `ADD_FOLDER`, `DELETE_NODE`, `MOVE_NODE`), the mandatory two-step modification process (MCP + source files) |
| **Document Modeling** | State schema design, operation definition, pure deterministic reducers (no `Math.random()`, `Date.now()`, async), GraphQL naming conventions (`<Name>State` not `<Name>GlobalState`), error handling patterns, batch operations |

Implementations extend or replace these with domain-specific skills. The build pipeline is the same regardless — Handlebars templates with config injection, compiled to SKILL.md files that Mastra loads at runtime via the `Workspace.skills` array.

### Agent Integration Pattern

**Maps to:** Features 16 (Default Subcommand / Agent Prompt), 17 (Session and Conversation Memory)

The Mastra agent integration from agent-rupert-cli:

```typescript
// Agent streaming with memory
const stream = await agent.stream(prompt, {
  maxSteps: 200,
  memory: { thread: threadId, resource: 'cli-user' },
});
yield* iterateFullStream(stream.fullStream);
```

Key aspects:

- **Thread-based memory** — Conversations persist across turns via `threadId`, stored in LibSQL.
- **Session resumption** — CLI can resume a prior session by thread ID (`--resume <id>`).
- **Multi-agent switching** — Different agents can be selected at runtime (`--agent <name>`), each with their own tool set, workspace, and skills.
- **Dynamic tool availability** — Agent tools can be loaded asynchronously (e.g., MCP tools from a running reactor project become available after the project starts).

### MCP Dual Role

**Maps to:** Features 5 (Zod-Based Definitions), 20 (Transport-Agnostic Input)

The library uses MCP in two directions:

1. **As server** — CLI commands are exposable as MCP tools, allowing Claude Desktop, Cursor, or other MCP clients to invoke them. Uses `@mastra/mcp` MCPServer with HTTP or stdio transport.

2. **As client** — CLIs can connect to external MCP servers to dynamically acquire additional tools. The agent-rupert-cli pattern of connecting to a reactor's MCP endpoint and merging its tools into the agent's toolset is directly reusable.

---

## Runtime Architecture

The central challenge is that a CLI session manages a **mix of execution modes** simultaneously:

### Execution Modes

| Mode | Examples | Lifecycle |
|---|---|---|
| **Synchronous command** | Parse args, read config, format output | Immediate return |
| **Async command** | Agent prompt, document operation, API call | Awaited, cancelable |
| **Streaming command** | Agent response, build output | AsyncGenerator, interruptible |
| **Background command** | Build, migration, batch job | Fire and forget, monitored |
| **Background service** | Reactor, dev server, watcher | Starts, stays alive, managed shutdown |

### Process Lifecycle

```
CLI Start
  ├─ Command mode → parse args → execute single command → exit
  └─ Interactive mode → start REPL
       ├─ User input → dispatch command → stream result
       ├─ Background processes → managed by ProcessManager
       │    ├─ CLIExecutor instances (bounded lifetime)
       │    └─ ServiceExecutor instances (until stopped)
       ├─ Event loop → EventBus receives events from all sources
       │    ├─ Process lifecycle events
       │    ├─ Reactor document subscriptions
       │    └─ External events (MCP, webhooks)
       ├─ Routines → triggered by events, execute command sequences
       └─ Escape → cancel foreground, REPL stays alive
```

### Concurrency Model

The runtime is **single-threaded with async I/O** (standard Node.js), but manages concurrent activity:

- **Foreground** — One command executes at a time in the REPL. Escape cancels it via `AbortController`.
- **Background** — Multiple child processes run concurrently, managed by `ProcessManager`. Each has its own stdout/stderr capture and event emission.
- **Event bus** — A central `EventEmitter`-based bus that all event sources publish to and routines subscribe to.
- **Reactor subscriptions** — The Powerhouse reactor's `subscribe()` calls push document change events onto the event bus asynchronously.

### First-class Capabilities: Reactor and Agent

Powerhouse Reactor and Mastra Agent are **first-class framework capabilities** with typed APIs, lazy-loaded and optional. Either can be configured independently. Both follow the same lifecycle: late configuration via `configureReactor()` / `configureAgent()`, lazy loading on first access, and uniform `reactor()` / `agent()` async accessors. Both are configured via Zod schemas that feed into the 6-layer config system, so implementations only need to supply their specific defaults.

#### Powerhouse Reactor Capability

**Configuration:** `cli.configureReactor({ create: ..., connect?: ..., switchboard?: ... })` after `defineCli()`.

The library provides a standard Powerhouse config schema covering:

- **Document models** — Which models to load into the reactor.
- **Remote drives** — URLs of drives to mount at startup, with sync options.
- **Document subscriptions** — Document IDs to watch, mapped to event bus topics.
- **Reactor storage** — Storage backend selection (memory, filesystem, pglite).

At runtime, when accessed:

1. **Reactor initialization** — The `create` factory builds a reactor instance with `ReactorBuilder`, loading the configured document models. Called lazily on first `reactor()` access.
2. **Drive mounting** — Connect to configured remote drives via `document-drive` for sync.
3. **Document subscriptions** — `reactor.subscribe({ids: [...]})` to listen for changes. These fire as events on the bus.
4. **Document operations** — Commands dispatch operations to documents through the reactor. Operations carry Zod schemas and can be adapted to CLI subcommands.

Implementations provide their reactor factory via `configureReactor()`. The `buildDefaultReactor()` convenience helper composes `buildReactor()` + `ensureDrive()` + `bridgeSubscriptions()` + `startSwitchboard()` for the common case. An implementation like a reactor package dev CLI would default to mounting the agent manager drive and loading inbox/WBS document models, while a different CLI might mount entirely different drives.

When both reactor and agent are configured, the library automatically provisions the **standard Powerhouse skill set** for agents (technology primer, document access/editing, document modeling). These skills are shipped as Handlebars templates with the library and compiled during the build step with the implementation's config values injected. Implementations can extend, replace, or supplement these with domain-specific skills.

#### Mastra Agent Capability

**Configuration:** `cli.configureAgent((ctx: AgentSetupContext) => Promise<AgentProvider>)` after `defineCli()`.

The library provides a standard Mastra config schema covering:

- **Agents** — Agent definitions with model, instructions, and tool assignments.
- **Tools** — Static tool registrations (from CLI commands or external sources).
- **Memory** — Storage backend and thread configuration.
- **MCP servers** — External MCP endpoints to connect to for dynamic tools.
- **Observability** — Tracing, logging, and evaluation settings.

At runtime, when accessed:

1. **Mastra instance** — Created lazily on first `agent()` access via the factory provided to `configureAgent()`.
2. **Agent selection** — The active agent is selected by CLI flag or interactive command.
3. **Tool composition** — Static tools (defined at build time) + dynamic tools (from MCP servers discovered at runtime) are merged into the agent's available toolset.
4. **Memory** — `@mastra/memory` with configured backend, keyed by thread ID.
5. **Streaming** — Agent responses stream through `fullStream`, yielding typed chunks that the output system renders.
6. **Skills** — Compiled SKILL.md files are loaded via the `Workspace.skills` array. The standard Powerhouse skills (when the reactor is also configured) are included automatically alongside implementation-specific skills.

#### Workspace Relationship: User Space vs. Context vs. Mastra

The **workspace** is the user's working directory. The **context folder** (`{workspace}/.ph/`) is ph-clint's managed area. Mastra operates on the workspace directly.

```
{workspace}/                              # User/agent working directory
├── .ph/                                  # Context folder (ph-clint managed)
│   ├── {cli-name}.config.local.json      # Per-workspace config
│   └── {cli-name}/                       # CLI state
│       └── mastra/                       # Mastra state (when enabled)
│           └── mastra.db                 # LibSQL database for memory
├── ...                                   # User/agent data files
```

Global config:
```
~/.ph/{cli-name}.config.user.json         # User-wide defaults
```

When an agent is configured:

- The **Mastra `Workspace`** (`LocalFilesystem`) is rooted at the workspace directory itself — agents operate on the same files the user sees. This is the key difference from the previous design where Mastra was nested in a subdirectory.
- **Mastra storage** (LibSQL for memory) lives at `{workspace}/.ph/{cli-name}/mastra/mastra.db`, inside the context folder.
- The **session store** for conversation memory uses the same LibSQL instance — the CLI's thread IDs map directly to Mastra's `memory.thread` parameter.

When no agent is configured:

- The workspace and context folder function standalone. No Mastra directories are created.

**Future: Workspace ↔ Powerhouse Drive mapping.** When both reactor and agent are configured, a future extension will allow the Mastra workspace to map directly onto a Powerhouse document drive. This would let agents read and write documents through the standard `Workspace` filesystem abstraction, with the reactor handling sync, operations, and subscriptions transparently underneath.

---

## Module Structure (Preliminary)

```
ph-clint/
├── src/
│   ├── core/
│   │   ├── command.ts          # Command definition, registry, routing
│   │   ├── config.ts           # 6-layer config resolution, Zod schema → ENV mapping
│   │   ├── workspace.ts        # Workspace resolution (cwd / --workdir / override)
│   │   ├── events.ts           # EventBus, event types
│   │   └── types.ts            # Shared types
│   ├── routine/
│   │   ├── loop.ts             # Tick-based routine loop (state machine, timing)
│   │   ├── trigger.ts          # Trigger interface and base implementations
│   │   ├── triggers/
│   │   │   ├── event.ts        # EventBus → work item bridge
│   │   │   ├── timer.ts        # Interval/cron-based trigger
│   │   │   └── condition.ts    # Predicate-polling trigger
│   │   ├── work-item.ts        # Work item types, queue, lifecycle
│   │   └── executor.ts         # Work item dispatch (command, function, agent, skill)
│   ├── execution/
│   │   ├── cli-executor.ts     # Sync/async command execution
│   │   ├── service-executor.ts # Long-running service management
│   │   ├── process-manager.ts  # Background process orchestration
│   │   └── abort.ts            # AbortController integration
│   ├── output/
│   │   ├── stream.ts           # Typed result stream (AsyncGenerator)
│   │   ├── renderer.ts         # Transport-agnostic result rendering
│   │   └── formats.ts          # Output chunk types
│   ├── interactive/
│   │   ├── repl.tsx            # Main REPL component
│   │   ├── input.tsx           # Text input with auto-completion
│   │   ├── prompt.tsx          # Parameter prompting UI
│   │   ├── markdown.tsx        # Terminal markdown rendering
│   │   └── process-panel.tsx   # Background process status view
│   ├── cli/
│   │   ├── parser.ts           # Commander.js integration
│   │   ├── completion.ts       # Shell completion generation
│   │   └── entry.ts            # CLI entry point builder
│   ├── transports/
│   │   ├── terminal.ts         # Ink-based terminal adapter
│   │   ├── mcp.ts              # MCP server adapter
│   │   └── programmatic.ts     # Library/API adapter
│   ├── integrations/
│   │   ├── powerhouse/
│   │   │   ├── config.ts       # Standard Powerhouse config schema
│   │   │   ├── reactor.ts      # Reactor builder and lifecycle
│   │   │   ├── drives.ts       # Drive mounting and sync
│   │   │   └── operations.ts   # Document operation → command adapter
│   │   └── mastra/
│   │       ├── config.ts       # Standard Mastra config schema
│   │       ├── agents.ts       # Agent setup, selection, streaming
│   │       ├── workspace.ts    # Mastra workspace nested in CLI workspace
│   │       ├── memory.ts       # Session/thread memory bridge
│   │       └── mcp-client.ts   # MCP client for dynamic tools
│   ├── skills/
│   │   ├── build.ts            # Handlebars compilation pipeline
│   │   ├── helpers.ts          # Handlebars helpers (formatDate, join, exists, eq, etc.)
│   │   └── powerhouse/         # Standard Powerhouse skill templates
│   │       ├── agent-profiles/
│   │       │   └── AgentBase.md          # Base profile with technology primer
│   │       └── skills/
│   │           ├── document-access/      # Document reading, operations, drives
│   │           └── document-modeling/    # State schemas, reducers, error handling
│   └── index.ts                # Public API
├── skills-src/                 # Implementation-specific skill templates (user-authored)
└── skills/                     # Compiled SKILL.md output (generated)
```

This structure keeps the core command/event system independent of reactor and agent concerns. Powerhouse and Mastra helpers are self-contained under `integrations/` with their own config schemas, and plug into the core via `configureReactor()` / `configureAgent()`, the event bus, command registry, and workspace system.
