# ph-clint — Agent Guidelines

Guidelines for AI agents working on the ph-clint codebase.

## Project Context

ph-clint (Powerhouse Command Line Intelligence) is a framework for building CLI tools that are also agent harnesses. It sits at the intersection of three ecosystems:

1. **CLI tooling** — Terminal REPL (Ink/React), command parsing (Commander), shell completion
2. **Powerhouse** — Document reactor with reactive documents, drives, operations, and subscriptions
3. **Mastra** — AI agent framework with tools, memory, workspaces, and MCP

The framework's job is to unify these so that a single command definition works as a CLI subcommand, an interactive REPL command, an MCP tool, and an agent tool.

## Architecture at a Glance

```
                    ┌─────────────┐
                    │  Transport   │  terminal / MCP / chat / programmatic
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  CLI Core   │  command registry, config, workspace
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼───┐ ┌──────▼──────┐
       │  Routine     │ │Events│ │  Processes   │
       │  Loop        │ │ Bus  │ │  Manager     │
       │  (triggers,  │ │      │ │  (CLI/Svc    │
       │   work items)│ │      │ │   executors) │
       └──────┬──────┘ └──┬───┘ └──────┬──────┘
              │            │            │
       ┌──────▼────────────▼────────────▼──────┐
       │           Integrations (optional)      │
       │  ┌─────────────┐  ┌─────────────────┐ │
       │  │ Powerhouse   │  │ Mastra           │ │
       │  │ reactor,     │  │ agents, memory,  │ │
       │  │ drives, docs │  │ tools, skills    │ │
       │  └─────────────┘  └─────────────────┘ │
       └────────────────────────────────────────┘
```

## How to Work on This Project

### Read order

1. `specs/features.md` — The 20 features. This is the spec of record.
2. `specs/implementation.md` — Tech choices, design patterns, runtime model, module structure.
3. `examples/01-hello-world/README.md` through `examples/08-reactor-dev/README.md` — Progressive examples showing the target API and acceptance criteria.

### Implementation strategy

Build the library (`packages/ph-clint/`) to make the examples work, in order:

| Example | What it exercises |
|---------|-------------------|
| 01 | `defineCommand`, `defineCli`, Zod→CLI arg parsing, `--help` |
| 02 | REPL, workspace, 5-layer config, parameter prompting |
| 03 | Routine loop, condition trigger, background processes, `--wait` |
| 04 | Mastra agent, streaming, conversation memory, `--resume` |
| 05 | ServiceExecutor, readiness detection, endpoint capture, events |
| 06 | Powerhouse reactor, drives, document CRUD, subscriptions |
| 07 | Mastra + Powerhouse, routine triggers on document changes |
| 08 | Everything combined: multi-agent, services, skills, MCP transport |

Each README has acceptance criteria that should become tests.

### Key design decisions to preserve

- **Commands are the universal unit.** Everything flows from the Zod schema: CLI args, help, prompts, MCP tools, agent tools, auto-completion. Don't introduce parallel definition formats.
- **Integrations are optional and independent.** Powerhouse and Mastra can each be enabled/disabled independently. The core must not import from either. Use the integration registry pattern.
- **The routine loop is agent-optional.** It must work for pure automation (example 03) as well as agentic autonomy (examples 07-08). Don't couple the loop to Mastra.
- **Streaming via AsyncGenerator.** Commands yield typed chunks. Don't switch to callbacks or observables — AsyncGenerator composes well and is what both prototypes converged on.
- **5-layer config with Zod schemas.** Config fields auto-map to env var names. Don't hand-maintain env var lists.
- **Escape for interrupt, not Ctrl+C.** Escape cancels the foreground operation; the REPL stays alive.

### Development process

The examples drive the library. Development follows a strict TDD-style workflow where example projects define the target behavior and the library is built to satisfy it. Every feature goes through these steps, in order:

#### 1. Assess

Familiarize yourself with the current state of the codebase. Read relevant source, tests, and specs. Understand what exists, what's tested, and what the coverage looks like before changing anything.

#### 2. Research

Before writing code that uses a dependency, research its intended public API and best practices. Read type definitions, documentation, and changelogs. Never rely on internal/undocumented APIs without explicit justification.

#### 3. Identify

Determine the next feature to implement by looking at the example projects in order (01 → 08). Each example README has acceptance criteria — the next unmet criterion is the next feature. Don't skip ahead.

#### 4. Specify

Carefully specify the new feature before coding. Consider:
- What types, interfaces, and functions are needed?
- How does this affect the existing public API surface?
- Does this introduce new dependencies?
- Will this create coupling that limits future features?
- Does the design preserve testability (injectable I/O, no global state)?

Raise concerns with the user if the feature would compromise long-term quality.

#### 5. Refactor first

If the current code needs restructuring to cleanly support the new feature, do that first. Refactoring is a separate step with its own commit:
- Make the structural change.
- Fix all existing tests — no regressions allowed.
- Verify coverage is maintained.
- Commit the refactor separately before proceeding.

#### 6. Write example tests first (red)

Write the example project code and its tests before implementing the library feature. This includes:
- Unit tests for the new command/feature behavior.
- Integration tests exercising the full CLI pipeline via `RunOptions`.
- E2E tests spawning real subprocesses where appropriate.

Run the tests and confirm they fail for the right reasons (missing library exports, unimplemented behavior — not syntax errors or broken imports).

#### 7. Implement (green)

Implement the feature in `packages/ph-clint/` to make the failing tests pass:
- **Fix regressions first.** If any existing tests broke, fix those before attending to new tests. The existing test suite is the safety net — it must always pass.
- Then make the new tests pass.
- Maintain 95% coverage throughout.

#### 8. Verify the example project works end-to-end

After tests pass, verify the example project works as a real CLI — not just in test harnesses:
- `pnpm build` completes without errors (TypeScript compiles cleanly).
- `pnpm dev` (or equivalent) starts without errors.
- Manual smoke test: run a representative command and confirm the output matches the README usage examples.

Do not consider an example complete until it builds, starts, and runs correctly outside of the test suite.

#### 9. Commit

Commit the implementation. The commit history should tell a clear story: refactor (if any) → example tests → library implementation.

### Code quality standards

The `ph-clint` library (`packages/ph-clint/`) is production-grade code — treat it accordingly. Maintain a minimum of 95% test coverage (statements, branches, functions, lines) across unit and integration tests combined. Prefer real execution over mocks: unit tests should exercise logic directly, integration tests should spawn real processes and verify actual stdout/stderr/exit codes. Do not mock `process.exit`, `process.stdout`, child processes, filesystem, or other runtime internals — if you believe a mock is genuinely necessary, ask the user before introducing it. Continuously review the library for code smells, duplication, and structural issues; clean these up as you encounter them rather than letting them accumulate. When you notice that implementation choices are leading to technical debt — unclear module boundaries, leaky abstractions, growing coupling between components — proactively raise the issue with the user and propose an architecture change before proceeding.

Before using any library's internal APIs, undocumented properties, or unconventional patterns, always research the library's intended public API and best practices first. Implementations must follow the documented, stable API surface of dependencies — not internal structures that may break between releases. When in doubt, consult the library's type definitions, documentation, or changelog to confirm a pattern is part of the public contract. Exceptions must be few and always documented.

### What NOT to do

- Don't add Powerhouse or Mastra imports to `core/`, `routine/`, `execution/`, `output/`, `interactive/`, or `cli/`. Those must stay integration-free.
- Don't create new definition patterns — use `defineCommand`, `defineCli`, `defineTrigger`, `defineService`, `define{Name}Integration` consistently.
- Don't over-abstract. The examples show the API surface. If something isn't needed for an example, it probably isn't needed yet.
- Don't generate documentation files unless asked. The specs and example READMEs are the documentation.

### Prototype reference

The parent workspace has two prototypes that informed this design:

- **`../agent/`** — Patterns to draw from: `AgentRoutine` (routine loop), task executors (CLIExecutor, ServiceExecutor), MCP server definitions, Handlebars skill templates, reactor document subscriptions, 37 document model operations.
- **`../agent-rupert-cli/`** — Patterns to draw from: Ink REPL components, Commander CLI setup, `createTool()` with Zod, `iterateFullStream()`, Mastra agent/memory/workspace config, 3-layer config resolution, lazy command loading.

When in doubt about implementation details, check these prototypes for working code. The implementation spec (`specs/implementation.md`) maps prototype patterns to ph-clint features.
