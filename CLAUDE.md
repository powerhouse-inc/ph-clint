# ph-clint — Powerhouse Command Line Intelligence

## What This Is

ph-clint is a TypeScript framework for building CLI tools that double as agent harnesses. A single set of Zod-based command definitions produces a CLI that works in command mode (`mycli cmd --arg val`), interactive REPL mode (`/cmd --arg val`), and as an MCP server — all from the same code.

The framework is designed for **automatic generation** of CLIs. Given a config object and a set of command schemas (from Mastra agent tools, Powerhouse document operations, or hand-written), you get a fully functional CLI with help, auto-completion, parameter prompting, streaming output, and optional AI agent integration.

## Repository Structure

This is a monorepo:

```
ph-clint/
├── specs/               # Architecture documentation
│   ├── features.md      # 20 features (the "what")
│   └── implementation.md # Tech stack, patterns, runtime (the "how")
├── packages/
│   └── ph-clint/        # The library itself (not yet implemented)
├── examples/            # 8 progressive examples (implementation targets)
│   ├── 01-hello-world/  # Minimal: one command, no integrations
│   ├── 02-task-tracker/ # REPL, workspace, parameter prompting
│   ├── 03-file-watcher/ # Routine loop, triggers, background processes (no agent)
│   ├── 04-chat-assistant/ # Mastra agent, streaming, memory, session resumption
│   ├── 05-service-manager/ # ServiceExecutor, readiness detection, lifecycle events
│   ├── 06-doc-browser/  # Powerhouse reactor, drives, document operations (no agent)
│   ├── 07-doc-agent/    # Mastra + Powerhouse, routine loop, document triggers
│   └── 08-reactor-dev/  # Full reference: multi-agent, services, skills, MCP transport
└── CLAUDE.md            # You are here
```

## Key Concepts

**Commands** are the atomic unit. Defined with Zod input/output schemas + execute function. Compatible with Mastra `createTool()` shape. Usable as CLI subcommands, REPL commands, MCP tools, and agent tools — all from one definition.

**Two modes**: Command mode (one-shot, exit after execution) and interactive mode (REPL with `/command` syntax, persistent session). Both share the same command definitions and routing.

**Routine loop**: A tick-based execution loop (default 2s) with pluggable triggers that produce work items. Works with or without an agent. Triggers can be event-based, timer-based, or condition-based. Runs in REPL or in command mode with `--wait`.

**Two optional integrations** (independent, togglable):
- **Powerhouse** — Document reactor for loading/subscribing/editing Powerhouse documents. Provides event triggers for document changes and standard agent skills for document work.
- **Mastra** — AI agent framework. Provides agent definitions, conversation memory (thread-based, LibSQL), workspace/sandbox isolation, and MCP client for dynamic tool discovery.

**Workspace**: `.ph/cli/{cli-name}/` (local) and `~/.ph/cli/{cli-name}/` (global). When Mastra is enabled, its workspace nests inside at `mastra/`. 5-layer config resolution: ENV vars > .env > local settings > global settings > defaults. Config schemas are Zod with auto-derived env var names.

## Tech Stack

- TypeScript ^6.0, Node.js >=22.13, ES2022, ESM (Node16)
- Zod ^4.3 for all schemas (commands, config, document operations)
- Ink ^6.8 + React ^19.2 for terminal REPL
- Commander ^12.1 for CLI argument parsing
- Mastra ^1.22 (optional) for agents, memory, MCP, workspaces
- Powerhouse Reactor ^6.0.2 (optional) for document operations and subscriptions
- Handlebars for agent skill templates (compiled at build time)

## Package Manager

pnpm is the default (`packageManager` field in root `package.json`, `pnpm-workspace.yaml` present). The monorepo is compatible with npm, yarn, and bun:

- **pnpm**: Uses `pnpm-workspace.yaml` for workspace config. Default for development.
- **npm / yarn / bun**: Use the `workspaces` array in root `package.json`.
- All four support the `workspace:*` protocol for local package references (npm since v7, yarn since v2, bun natively).
- Test scripts use `node node_modules/.bin/jest` (portable across all managers).
- Use `corepack enable` to auto-select the pinned pnpm version.

## Development Approach

The examples/ READMEs contain code snippets showing the target API surface and acceptance criteria. These are the implementation targets — build the library to make those examples work, starting from 01 (simplest) through 08 (full-featured).

The specs/ folder has the full feature list and implementation details. Read `specs/features.md` first for the "what", then `specs/implementation.md` for the "how".

## Testing

Testability is a core design principle. Process-boundary concerns (stdout, stderr, exit) are always injectable via `RunOptions`, never hardcoded. This enables testing at three levels without mocks:

- **Unit tests** (`tests/*.test.ts`) — call `execute()`, `parseArgs()`, `generateHelp()` directly. Pure logic, no process side effects.
- **Integration tests** (`tests/*.test.ts`, `run()` with `RunOptions`) — call `run()` with injected stdout/stderr/exit callbacks. Exercises the full Commander pipeline in-process.
- **E2E tests** (`tests/*.integration.test.ts`) — spawn real subprocesses, assert on actual stdout/stderr/exit codes.

The `ph-clint` library targets **95% code coverage** (statements, branches, functions, lines), measured across unit and integration tests combined.

**Mocking policy**: avoid mocks. Use `RunOptions` injection instead of mocking `process.exit` or `console.log`. Mocks are acceptable only for true external dependencies (network services, third-party APIs) where a real call is impractical.

- Run `pnpm test` in `packages/ph-clint/` — coverage is reported automatically.
- Coverage output: `text` (terminal) + `lcov` (in `coverage/` directory for IDE/CI integration).
- Example packages have their own test suites (unit + integration + e2e) but are not held to the same coverage threshold.

## Conventions

- Commands use `defineCommand()`, CLIs use `defineCli()`, integrations use `define{Name}Integration()`, triggers use `defineTrigger()`, services use `defineService()`
- Config fields auto-map to env vars: `{CLI_NAME}_{UPPER_SNAKE_FIELD_NAME}`
- Interactive mode prefix: `/` for commands, bare text for default subcommand (typically agent)
- Escape interrupts foreground operations in REPL (not Ctrl+C)
- Streaming output via `AsyncGenerator` with typed chunks (text-delta, tool-call, tool-result, error)
- Background processes: CLIExecutor (bounded) and ServiceExecutor (long-running with readiness detection)

## Origin

Derived from two prototypes in the parent workspace:
- `../agent/` — Multi-agent system on Powerhouse Reactor (AgentRoutine, task executors, MCP servers, skills/prompts system)
- `../agent-rupert-cli/` — Mastra-based CLI with Ink REPL (streaming, commands, memory, workspaces)

ph-clint generalizes and unifies the patterns from both into a reusable framework.
