# ph-clint — Powerhouse Command Line Intelligence

## What This Is

ph-clint is a TypeScript framework for building CLI tools that double as agent harnesses. A single set of Zod-based command definitions produces a CLI that works in command mode (`mycli cmd --arg val`), interactive REPL mode (`/cmd --arg val`), and as an MCP server — all from the same code.

The framework is designed for **automatic generation** of CLIs. Given a config object and a set of command schemas (from Mastra agent tools, Powerhouse document operations, or hand-written), you get a fully functional CLI with help, auto-completion, parameter prompting, streaming output, and optional AI agent integration.

## Repository Structure

This repository contains independent projects (not a pnpm workspace). Each project has its own `node_modules` and `pnpm-lock.yaml`. Examples reference the library via `"ph-clint": "file:../../packages/ph-clint"` (pnpm creates a symlink).

```
ph-clint/
├── specs/               # Architecture documentation
│   ├── features.md      # 20 features (the "what")
│   └── implementation.md # Tech stack, patterns, runtime (the "how")
├── packages/
│   └── ph-clint/        # The library itself
├── examples/            # 8 progressive examples (implementation targets)
│   ├── 01-hello-world/  # Minimal: one command, no integrations
│   ├── 02-task-tracker/ # REPL, workspace, parameter prompting
│   ├── 03-file-watcher/ # Routine loop, triggers, background processes (no agent)
│   ├── 04-chat-assistant/ # Mastra agent, streaming, memory, session resumption
│   ├── 05-vetra/          # ServiceManager, multi-pattern readiness, Vetra dev server
│   ├── 06-doc-browser/  # Powerhouse reactor, drives, document operations (no agent)
│   ├── 07-doc-agent/    # Mastra + Powerhouse, routine loop, document triggers
│   └── 08-reactor-dev/  # Full reference: multi-agent, services, skills, MCP transport
└── CLAUDE.md            # You are here
```

**Important**: After changing `packages/ph-clint/` source, run `pnpm build` there before the examples can see the updated code.

**Critical**: When `pnpm build` produces **new files** in `dist/` (not just changes to existing ones), you must also run `pnpm install` inside the example directory. pnpm's `file:` protocol copies dist at install time — new files won't appear in the example's `node_modules` until reinstalled. Symptoms: "Cannot find module" errors for files that clearly exist in the library's `dist/`. This does NOT apply to changes to existing dist files (pnpm hardlinks those).

## Key Concepts

**Commands** are the atomic unit. Defined with Zod input/output schemas + execute function. Compatible with Mastra `createTool()` shape. Usable as CLI subcommands, REPL commands, MCP tools, and agent tools — all from one definition.

**Two modes**: Command mode (one-shot, exit after execution) and interactive mode (REPL with `/command` syntax, persistent session). Both share the same command definitions and routing.

**Routine loop**: A tick-based execution loop (default 2s) with pluggable triggers that produce work items. Works with or without an agent. Triggers can be event-based, timer-based, or condition-based. Runs in REPL or in command mode with `--wait`.

**Two optional integrations** (independent, togglable):
- **Powerhouse** — Document reactor for loading/subscribing/editing Powerhouse documents. Provides event triggers for document changes and standard agent skills for document work.
- **Mastra** — AI agent framework. Provides agent definitions, conversation memory (thread-based, LibSQL), workspace/sandbox isolation, and MCP client for dynamic tool discovery.

**Workspace vs Context**: The workspace is the user/agent working directory (defaults to `cwd`, configurable via `--workdir` or implementation override). The context folder (`{workspace}/.ph/`) is ph-clint's managed state area. Config lives at `{workspace}/.ph/{cliName}.config.local.json` and `~/.ph/{cliName}.config.user.json`. Mastra operates directly on the workspace; its database lives at `{workspace}/.ph/{cliName}/.mastra/db/mastra.db`. 6-layer config resolution: --config flag > env vars > local config > user config > implementation defaults > hardcoded defaults. Config schemas are Zod with auto-derived env var names and typed `CommandContext.config`.

## Tech Stack

- TypeScript ^6.0, Node.js >=22.13, ES2022, ESM (Node16)
- Zod ^4.3 for all schemas (commands, config, document operations)
- Ink ^6.8 + React ^19.2 for terminal REPL
- Commander ^12.1 for CLI argument parsing
- Mastra ^1.22 (optional) for agents, memory, MCP, workspaces
- Powerhouse Reactor ^6.0.2 (optional) for document operations and subscriptions
- Handlebars for agent skill templates (compiled at build time)

## Package Manager

pnpm is the default (`packageManager` field in root `package.json`). Each project is independent — run `pnpm install` inside each project directory separately.

- Examples reference `ph-clint` via `file:` protocol (pnpm creates a symlink to the library).
- After changing library source, run `pnpm build` in `packages/ph-clint/` — the symlink means examples pick up the new `dist/` without reinstalling.
- Use `corepack enable` to auto-select the pinned pnpm version.

## Development Approach

Development is **example-driven TDD**. The example projects (01 through 08) define the target behavior; the library is built to satisfy their tests.

Every feature follows this workflow: **assess → research → identify → specify → refactor (separate commit) → write example tests (red) → implement library (green) → commit**. See AGENTS.md "Development process" for the full description of each step.

Key rules:
- Examples are implemented in order (01 → 08). Don't skip ahead.
- Refactors that prepare for a feature get their own commit before the feature.
- Example tests are written first and must fail for the right reasons before implementation begins.
- Regressions are fixed before new functionality — the existing test suite always passes.
- 95% coverage is maintained continuously, not retrofitted.

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
