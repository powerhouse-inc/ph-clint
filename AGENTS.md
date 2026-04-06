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
