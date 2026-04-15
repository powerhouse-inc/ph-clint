# ph-clint — Features

**Powerhouse Command Line Intelligence** — a configurable framework for building fast CLI tools that function as whitelabel agent harnesses, equally at home in a terminal, a chat GUI, or a messaging app.

This library is designed for **automatic generation** of fully functional CLIs — through code generation when possible, with coding agents where needed. A set of Zod-based tool or operation definitions should be sufficient to produce a working CLI with both command and interactive modes.

## Core Design

The library provides a framework for creating CLIs that operate in two modes:

- **Command mode** — `{cli-tool} {subcommand} {args}` for scripting and one-shot execution.
- **Interactive mode** — A REPL with a welcome message, user input field, and `/subcommand args` syntax.

Both modes share the same command definitions, routing, and execution logic. The framework is structured so it can accept (sub)command inputs from different sources — not just stdio/terminal — making it pluggable into chat GUIs, messaging apps, or any other input transport.

### Design Principle: Testability

Testability is a first-class design principle — both for the ph-clint library itself and for the CLIs built with it.

CLIs are inherently testable: they have well-defined inputs (argv, stdin) and outputs (stdout, stderr, exit codes). ph-clint preserves and amplifies this by keeping process-boundary concerns (stdout, stderr, process.exit) injectable rather than hardcoded. Every layer of the framework — commands, the CLI runner, output rendering — accepts optional callbacks for I/O, defaulting to process globals in production but replaceable in tests without mocks.

This means CLIs built with ph-clint can be tested at multiple levels:

- **Unit** — Call `execute()` or `parseArgs()` directly on the CLI instance. Pure functions, no process side effects.
- **Integration** — Call `run()` with injected stdout/stderr/exit callbacks. Exercises the full Commander pipeline without spawning a subprocess.
- **End-to-end** — Spawn the CLI as a child process and assert on real stdout/stderr/exit codes.

The framework avoids patterns that make testing difficult: global mutable state, implicit singletons, hardcoded I/O. When new features are added, they must preserve these properties.

### Design Principle: First-class Capabilities, not Generic Integrations

Reactor and agent are **first-class framework capabilities**, not pluggable third-party integrations. Both are 100% optional and lazy-loaded for performance, but their APIs are designed into the framework's type system.

There is no generic `Integration` interface — YAGNI. The framework knows about exactly two optional capabilities (reactor and agent) and exposes them with typed, symmetric APIs. Both follow the same lifecycle pattern: late configuration via `configureReactor()` / `configureAgent()`, lazy loading on first access, and uniform `reactor()` / `agent()` async accessors on both `CommandContext` and `TriggerContext`.

Decoupling is achieved through **lazy loading and optional types** — the `reactor()` and `agent()` accessors return `undefined` when not configured — not through abstraction layers that obscure the actual capabilities. The key distinction: we want **decoupling** (no startup cost when not used, no type dependency when not configured) but not **genericness** (no `Integration[]` bag where capabilities lose their identity and type safety).

## Features

### 1. Fast Startup via Lazy Loading

Dependencies are lazy-loaded so that CLI tools start instantly. Heavy modules (AI SDKs, document model libraries, etc.) are only imported when the subcommand that needs them is actually invoked.

### 2. Workspace, Context, and Configuration

The framework separates two concepts:

- **Workspace** — The directory where the user and AI agent collaborate on data. This is the user's working area — files, assets, project data. It defaults to `process.cwd()` and is fully under the user's control.
- **Context folder** — A `.ph/` directory inside the workspace where ph-clint stores its own managed state: configuration, databases, session data. The user doesn't edit these directly.

#### Workspace Resolution

The workspace directory is a **prerequisite** — it must be resolved before any configuration is loaded, because config file paths depend on it. Resolution order (later overrides earlier):

1. **Fallback:** `process.cwd()` — always available.
2. **CLI flag:** `--workdir <path>` / `-w <path>` — a global flag on every CLI, lets the user point to any directory.
3. **Implementation override:** The project using ph-clint can set the workspace path programmatically (e.g., via its own flag parsing, environment variable, or hardcoded value). When an implementation override is set, the `--workdir` flag is **hidden** from the CLI — the implementation owns the decision.

The workspace directory is always passed to the Mastra integration as the Mastra Workspace root, so agents operate on the same files the user sees.

#### Context Folder Layout

Inside the workspace, ph-clint maintains a `.ph/` directory:

```
{workspace}/
├── .ph/
│   ├── {cli-name}.config.local.json    # Per-workspace config (layer 3)
│   └── {cli-name}/                     # CLI-managed state
│       └── mastra/                     # Mastra database (when enabled)
│           └── mastra.db
├── ...                                 # User/agent files
```

A global config file lives in the user's home directory:

```
~/.ph/{cli-name}.config.user.json       # User-wide config (layer 4)
```

#### Configuration Schema

Every implementation project defines its config shape as a **Zod schema**, the same way commands are defined. The framework provides a generic type that derives the TypeScript type from the schema, giving implementations type-strict access to resolved config values:

```typescript
const configSchema = z.object({
  apiKey: z.string().describe('API key for the service'),
  maxRetries: z.number().default(3).describe('Maximum retry attempts'),
});

const cli = defineCli({
  name: 'mycli',
  configSchema,
  // ...
});

// In commands: context.config is typed as z.infer<typeof configSchema>
```

Each config field automatically maps to an environment variable name by convention (e.g., a field `connectPort` in a CLI named `reactor` maps to `REACTOR_CONNECT_PORT`). This means:

- Config validation and type safety come for free from the schema.
- The set of supported environment variables is derived, not hand-maintained.
- Help/docs can list all available env vars automatically.

#### Configuration Resolution

Configuration is resolved through **six layers**, where each layer overrides the one below it:

1. **Config file flag** (`--config <path>` / `-c <path>`) — highest priority. Path is relative to `cwd` (not the workspace). For one-off overrides or CI/CD use.
2. **Environment variables** (`{CLINAME}_{FIELD_NAME}`) — per-field overrides via env vars.
3. **Local config** (`{workspace}/.ph/{cli-name}.config.local.json`) — per-workspace persistent config.
4. **User config** (`~/.ph/{cli-name}.config.user.json`) — user-wide defaults across workspaces.
5. **Implementation defaults** — values passed from the project code to `defineCli()` (e.g., in the config schema's `.default()` calls or as explicit overrides).
6. **Hardcoded defaults** — sensible values baked into the Zod schema via `.default()`.

#### First-Run Config Prompting

If the config schema has **mandatory fields without defaults** (i.e., `z.string()` with no `.default()` and no `.optional()`), and no layer provides a value, the framework **automatically prompts the user** on first run. The prompted values are written to the local config file (`{workspace}/.ph/{cli-name}.config.local.json`) so the user is only asked once per workspace.

This ensures CLIs with required configuration (API keys, endpoints, etc.) provide a smooth onboarding experience without requiring the user to manually create config files.

#### Mastra Integration

When an agent is configured, the **Mastra database** lives at `{workspace}/.ph/{cli-name}/mastra/mastra.db`. The workspace directory itself is passed to Mastra as the agent's working directory, so agents read and write files in the same space as the user. When the reactor is also configured, a future extension will allow the Mastra workspace to map directly onto a Powerhouse document drive or reactor, enabling agents to work with documents through the same workspace abstraction.

### 3. Unified Subcommands

Subcommands are available in both modes:

- **Command mode:** `mycli greet --name Alice`
- **Interactive mode:** `/greet --name Alice`

The same command definition drives both surfaces with no duplication.

### 4. Auto-Completion

Both command mode and interactive mode provide auto-completion for:

- Subcommand names
- Arguments and options

In command mode this integrates with shell completion (bash/zsh/fish). In interactive mode it is built into the REPL input.

### 5. Zod-Based Command Definitions (Mastra / MCP Compatible)

Commands are defined using Zod schemas for their inputs and outputs, following the same shape used by **Mastra agent tools** and **MCP tools**. This means:

- Command definitions can be **derived from existing Mastra agent tools**.
- Command definitions can be **derived from Powerhouse document operations**, which already carry Zod schemas.
- Commands are automatically exposable as MCP tools or agent capabilities without adapter code.

### 6. Auto-Generated Help

Help text and usage documentation are **fully derived from Zod schemas** — command descriptions, parameter names, types, defaults, and constraints are all extracted automatically. No hand-written help strings needed.

- `mycli --help` and `mycli subcommand --help` work out of the box.
- `/help` and `/help subcommand` work in interactive mode.
- Help output adapts to the active transport (formatted for terminal, plain text for chat, structured for programmatic use).

### 7. Interactive Parameter Prompting

In interactive mode, when a user invokes a subcommand without providing all mandatory parameters, the framework **automatically queries the user** for the missing values. This uses the Zod schema (descriptions, types, defaults) to generate appropriate prompts.

Subcommand definitions can configure this behavior:

- **`promptForDefaults`** — When `true`, the user is prompted even for parameters that have default values, giving them a chance to override. When `false` (the default), defaults are applied silently.
- **`promptOptional`** — A list of optional parameter names that should be prompted for interactively, rather than omitted. Useful for parameters that are technically optional but frequently set by users.

In command mode, missing mandatory parameters result in an error with usage help (standard CLI behavior).

### 8. Structured and Streaming Output

Commands return **structured results** — not raw strings. A command execution produces a result object that can carry data, status, and optionally streamed content.

- **Streaming** — Commands can yield output incrementally via `AsyncGenerator`, essential for agent responses, long-running operations, and real-time feedback.
- **Structured data** — Commands can return typed result objects (tables, lists, key-value pairs, etc.) that transports render appropriately.
- **Transport-specific rendering** — The terminal adapter renders markdown, tables, and spinner animations. A chat GUI might render cards or rich embeds. JSON mode returns raw structured data for programmatic consumption. Each transport adapter is responsible for mapping structured results to its native format.

### 9. Background Processes

The framework provides built-in support for running **child processes in the background**, covering two use cases:

- **Long-running CLI commands** — e.g., builds, migrations, batch operations that run to completion.
- **Services** — e.g., dev servers, watchers, or daemons that run indefinitely until stopped.

Multiple background processes can run in parallel. Their lifecycle is managed by the framework:

- **Output streaming** — stdout/stderr from background processes is captured and surfaced through the CLI interface (viewable on demand in interactive mode).
- **Completion / status events** — Process start, completion, failure, and output events plug into the event handler system (see below), so routines can react to them automatically.
- **Process control** — Interactive mode exposes built-in commands to list, inspect, and stop background processes.

### 10. Interrupt and Cancellation

In interactive mode, the user can **interrupt** running operations without killing the CLI:

- **Escape interrupts the foreground operation** — If a command or agent response is in progress, Escape cancels it gracefully and returns to the input prompt. The REPL itself stays alive.
- **Background process control** — Background processes can be individually interrupted or killed via built-in commands (e.g., `/stop <id>`). Escape never kills background processes implicitly — they require explicit action.
- **Nested cancellation** — When a command is interrupted, the framework propagates cancellation through the entire execution chain (middleware, streaming output, child tasks) using `AbortController` / `AbortSignal`. Command implementations receive the signal and can clean up resources.
- **Agent interruption** — When the default subcommand is streaming an agent response, Escape stops the generation and keeps the partial response visible. The conversation session remains valid for follow-up turns.

In command mode, Escape behaves as standard (terminates the process).

### 11. Event Handlers

CLIs can register **event handlers** that listen to incoming events from any source. Event handlers are the mechanism through which external signals (document changes, process lifecycle, webhooks, timers) enter the CLI's execution model. Background process events (completion, failure, output) are first-class event sources.

### 12. Routine Loop

The framework provides a **routine loop** — a tick-based execution loop that drives autonomous behavior. The loop runs in interactive mode (REPL) and in command mode with a `--wait` flag that keeps the process alive.

Each tick of the loop:

1. **Check triggers** — Poll registered trigger sources for new work. Triggers are pluggable and produce **work items** when they detect something actionable.
2. **Queue work** — New work items are added to a FIFO queue.
3. **Execute** — If work is pending, execute the next item. If not, idle.
4. **Wait** — Respect a configurable minimum tick interval (default 2s) and minimum idle time (default 500ms) before the next tick.

**Trigger sources** are pluggable. The library ships with:

- **Event trigger** — Fires when specific events arrive on the event bus (e.g., a document changed, a process completed).
- **Timer trigger** — Fires on a schedule (cron-like or interval-based).
- **Condition trigger** — Fires when a predicate function returns true (polled each tick).

The Powerhouse integration adds triggers for document changes (inbox messages, WBS goal updates). Implementations can define custom triggers for any domain-specific signal.

**Work items** have a type, parameters, and optional success/failure callbacks. Built-in types:

- **`command`** — Execute a CLI subcommand with given arguments.
- **`agent`** — Send a prompt to the configured agent (requires Mastra integration).
- **`skill`** — Execute an agent skill by name with a context object.
- **`idle`** — No-op, used when no triggers fired.

Custom work item types can be registered by implementations.

**The loop works with or without an agent.** For non-agentic use cases, the loop can drive purely command-based automation — e.g., a CLI that watches a directory for changes and runs a build command, or a CLI that polls an API and dispatches notifications. When an agent is involved, the loop feeds work items to the agent for interpretation and execution, enabling autonomous agent behavior where the agent drives its own decisions based on incoming triggers.

**State machine:** `init` → `ready` → `running` ↔ `stopping`. The loop only ticks while in `running` state. Stopping drains the current work item gracefully before transitioning back to `ready`.

**Error handling:** Errors in individual work items are caught, logged, and trigger the failure callback — the loop itself continues. This ensures a single failed task doesn't crash the routine.

### 13. Middleware and Lifecycle Hooks

Commands support **middleware** — functions that run before and/or after command execution. This enables cross-cutting concerns without modifying individual command implementations:

- **Pre-execution hooks** — Auth checks, workspace initialization, input validation, permission gates.
- **Post-execution hooks** — Logging, analytics, result caching, cleanup.
- **Error hooks** — Custom error formatting, retry logic, fallback behavior.

Middleware can be registered globally (applies to all commands) or per-command. Middleware is composable and ordered.

### 14. Default Interface

The default interactive mode experience is:

- A **welcome message** (configurable per CLI).
- An **empty input field** ready for user input.
- The list of available `/subcommands` discoverable via auto-completion or a help command.

### 15. Agent Skills

When a CLI includes agent capabilities (via agent configuration), agents are equipped with **skills** — structured, multi-step guides that teach agents how to perform domain-specific tasks.

Skills are authored as **Handlebars markdown templates** with build-time configuration injection. A skill consists of:

- A **preamble** (`.preamble.md`) — technology primer and domain briefing.
- **Numbered scenario files** (`00.check-prerequisites.md`, `01.implement.md`, etc.) — step-by-step task breakdowns.
- An optional **result** (`.result.md`) — expected outcome description.

At build time, these are compiled into a single `SKILL.md` file with YAML frontmatter, with configuration values (ports, paths, URLs, etc.) injected from the CLI's Zod config schema.

**Standard Powerhouse skills:** When the reactor is configured, agents receive a default skill set out of the box:

- **Powerhouse Technology Primer** — Embedded in the base agent profile. Covers the Reactor component, document model system (self-contained, cryptographically verifiable documents with append-only operation history), drives, Connect, Switchboard, and the Fusion platform.
- **Document Access and Editing** — How to read documents, dispatch operations via `addActions`, work with drives (vetra drive for specifications, preview drive for testing), and follow the mandatory two-step modification process (MCP update + source file update).
- **Document Modeling** — Creating document models: state schemas, operations, pure deterministic reducers, GraphQL type naming conventions, error handling patterns, and the available scalar types (OID, PHID, Amount variants, etc.).

Implementations can add their own domain-specific skills alongside or in place of these defaults.

### 16. Default Subcommand (Agent Prompt)

CLIs can designate a **default subcommand** that handles bare text input (i.e., input that doesn't start with `/` or match a subcommand name). The typical use case is forwarding the text as a **prompt to an agent**, which interprets the intent and invokes the appropriate subcommands to fulfill the request.

### 17. Session and Conversation Memory

In interactive mode, the framework maintains a **session** that persists across turns. When a default subcommand routes to an agent, conversation history is preserved so the agent has context from prior exchanges.

- Sessions are identified by a **thread ID** and stored in the workspace.
- Sessions can be **resumed** across CLI invocations (e.g., `mycli -i --resume <thread-id>`).
- The memory backend is pluggable (in-memory, SQLite/LibSQL, or custom).

### 18. Configuration and Theming

Since the library is whitelabel, each generated CLI is defined by a **configuration object** that controls its identity and appearance:

- **Name and version** — CLI binary name, display name, version string.
- **Branding** — Welcome message, prompt character/prefix, description.
- **Colors and styling** — Color palette for terminal output (primary, secondary, error, muted). Theming is optional — sensible defaults are provided.
- **Behavior** — Default subcommand, workspace path, enabled features.

This configuration is the primary input for code generation: a config object plus a set of command definitions produces a complete CLI.

### 19. CLI Scaffolding and Code Generation

The library includes tooling to **generate a new CLI project** from inputs:

- **From a config + command set** — Given a configuration object and a collection of Zod-based command definitions (from Mastra tools, MCP tools, or Powerhouse document operations), generate a fully functional CLI package.
- **Incremental generation** — When new commands are added or schemas change, regenerate only the affected parts without overwriting custom code.
- **Escape hatches** — Generated CLIs have clear extension points where hand-written code can override or augment generated behavior, without being clobbered by re-generation.

### 20. Transport-Agnostic Input

The framework decouples command parsing and execution from the input source. The terminal/stdio is just one adapter. The same CLI core can receive commands from:

- A terminal REPL (default)
- A web-based chat UI
- A messaging app (Slack, Discord, etc.)
- An MCP client
- Programmatic / library usage

This makes the library a **whitelabel agent harness** — a single command and routing layer that powers multiple user-facing surfaces.
