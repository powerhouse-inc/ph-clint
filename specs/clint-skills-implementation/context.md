# ph-clint-cli Agent: Skills Implementation Plan

## What This Is

This spec defines the agent profile and skills for **ph-clint-cli** — an AI agent that helps implementation developers build CLI tools using the ph-clint framework. The agent lives inside a ph-clint CLI itself (dogfooding), and its skills guide it through every feature the framework offers.

## Who The Agent Serves

Implementation developers who are using ph-clint to build their own CLIs. These devs:
- Know TypeScript and Node.js well
- May be new to ph-clint's specific patterns and conventions
- Want to go from "I need feature X" to working code fast
- Need guidance on ph-clint's opinionated patterns (defineX, RunOptions injection, etc.)

## Agent Profile

### Identity: `PhClintDevAgent`

Two composable instruction sections loaded via `agent-profiles/`:

| Section | Purpose |
|---------|---------|
| **AgentBase.md** | Identity, tone, development principles. Example-driven TDD workflow (assess, research, identify, specify, refactor, test, implement). Project structure awareness. Conventions: defineX pattern, ESM, Zod 4, pnpm. |
| **PhClintFrameworkExpert.md** | Architecture mental model. One definition to four interfaces. Command anatomy (inputSchema, execute, return). CLI lifecycle (defineCli, run, Commander/REPL routing). 6-layer config. Workspace/context split. Routine loop tick model. Service lifecycle (preflight, spawn, readiness, ready). Streaming protocol (StreamChunk union). Integration boundaries (Mastra/Powerhouse are optional and lazy-loaded). |

## Skills Overview

10 skills, each a `skills-tpl/` folder compiled at build time.

| # | Skill ID | One-liner |
|---|----------|-----------|
| 1 | `command-definition` | Define commands with Zod schemas, execute functions, return values, and parameter prompting |
| 2 | `cli-setup` | Scaffold or extend a defineCli configuration with config, secrets, interactive mode, and registrations |
| 3 | `service-definition` | Define managed background services with readiness detection, preflight checks, and lifecycle management |
| 4 | `trigger-routine` | Define triggers and configure the routine loop for automated, tick-based task execution |
| 5 | `agent-integration` | Set up an AI agent with Mastra, including demo fallback, MCP tool discovery, memory, and streaming |
| 6 | `config-and-workspace` | Design typed configuration and workspace persistence patterns |
| 7 | `testing` | Write unit, integration, and E2E tests for ph-clint CLIs without mocks |
| 8 | `ph-integration` | Configure Powerhouse reactor, registry, drives, subscriptions, and document operations |
| 9 | `ph-app-development` | Build Powerhouse applications: Switchboard endpoints, Connect SPA, and Fusion platforms |
| 10 | `skill-authoring` | Create agent skill templates, agent profiles, and configure the build pipeline |

## Skill File Structure

Every skill folder follows this structure:

```
skills-tpl/{skill-id}/
  .cli-docs.md              # API reference context injected into SKILL.md
  .preamble.md               # 80-150 lines. Domain knowledge, design principles, do/don't rules
  .result.md                 # Expected outcome when the skill completes
  00.{first-phase}.md        # Phase 0: prerequisite checks or assessment
  01.{second-phase}.md       # Phase 1: first implementation step
  ...                        # Additional phases as needed
```

### File roles

- **.preamble.md** (80-150 lines): Always loaded. Contains the "why" and design principles the agent needs before starting any phase. No code examples longer than 5 lines — those go in section files.
- **.cli-docs.md**: API reference extracted from the HTML docs. Relevant function signatures, type definitions, option tables. Rendered through Handlebars so it can reference `{{commands.*}}` and `{{services.*}}`.
- **.result.md**: 2-5 lines stating the expected deliverable. Anchors the agent's definition of done.
- **NN.phase-name.md**: Step-by-step task instructions for one phase. Can be long (up to ~200 lines for complex phases). Goes into `references/` in the compiled output — loaded on demand, not always in context.

## Relationship to Existing Skills

The existing ph-rupert skills (document-modeling, document-editor-creation, etc.) target Powerhouse domain work. The ph-clint-cli skills target framework usage. They are complementary — a developer might use `command-definition` to create a command, then use `document-modeling` to create the Powerhouse document that command operates on.

## Implementation Order

Skills should be written in dependency order:

1. `command-definition` — foundation, no dependencies
2. `cli-setup` — depends on understanding commands
3. `config-and-workspace` — extends CLI setup
4. `testing` — can test what's built so far
5. `service-definition` — independent feature
6. `trigger-routine` — independent feature
7. `agent-integration` — depends on commands (tools) and optionally services (MCP)
8. `ph-integration` — Powerhouse-specific, independent
9. `ph-app-development` — depends on ph-integration
10. `skill-authoring` — meta-skill, write last

## Codegen-Managed Project Workflow

ph-clint-cli projects are **codegen-managed**. The agent must understand this workflow because it determines how new commands, services, triggers, and integrations are registered.

### The Spec-Driven Model

The source of truth is the `ClintProjectSpec` at `{project}/.ph/ph-clint-cli/project-spec.json`. This spec describes the project's structure — commands, services, triggers, document types, integrations. **The agent never manually edits codegen-managed regions in `cli.ts`.** Instead:

1. The agent creates user-owned source files (commands in `src/commands/`, services in `src/services/`, triggers in `src/triggers/`)
2. The agent updates `project-spec.json` to declare the new artifact
3. The agent runs `clint-project-regen` to regenerate `cli.ts` marker regions (imports, registrations)

This is the **only** way to change codegen-controlled structure. The codegen reads the spec and emits the correct imports, arrays, and configuration blocks.

### The Marker System

`cli.ts` uses `@clint:begin {name}` / `@clint:end {name}` comment markers to delimit codegen-managed regions. The following marker regions exist:

| Marker | What codegen generates there |
|--------|------------------------------|
| `@clint:begin imports` | Import statements for commands, services, triggers, agents |
| `@clint:begin commands` | The `commands: [...]` array in `defineCli()` |
| `@clint:begin services` | The `services: [...]` array in `defineCli()` |
| `@clint:begin triggers` | The `triggers: [...]` array in `defineCli()` |
| `@clint:begin prompts` | The `prompts: { ... }` config in `defineCli()` |
| `@clint:begin events` | The `events: { ... }` handlers in `defineCli()` |
| `@clint:begin interactive` | The `interactive: { ... }` config in `defineCli()` |
| `@clint:begin reactor` | `cli.configureReactor(...)` call after `defineCli()` |
| `@clint:begin mastra` | `cli.configureAgent(...)` call after `defineCli()` |

**Content inside markers is owned by codegen** — it is rewritten by `clint-project-regen` and must not be hand-edited. Content outside markers (e.g., `configSchema`, `secretsSchema` imports, `CLI_NAME` / `CLI_VERSION` / `CLI_ROOT`) is user-editable and preserved across regens.

### User-Owned vs Codegen-Owned Files

| File | Ownership | Notes |
|------|-----------|-------|
| `framework.ts` | User-owned | Emitted once at project creation, never overwritten. Contains `configSchema`, `secretsSchema`, and typed factories via `createTypes()`. |
| `framework.gen.ts` | Codegen-owned | Regenerated when the spec's `documentTypes` list changes. Exports `registry` and typed `Registry` type. |
| `cli.ts` | Mixed | User code outside markers is preserved; codegen rewrites content inside markers. |
| `src/commands/*.ts` | User-owned | Agent creates these files directly. |
| `src/services/*.ts` | User-owned | Agent creates these files directly. |
| `src/triggers/*.ts` | User-owned | Agent creates these files directly. |

### Import Pattern

Commands, services, and triggers import typed factories from `./framework.js` (or `../framework.js` from subdirectories), **not** directly from `@powerhousedao/ph-clint`. This gives automatic config typing via `createTypes()`:

```typescript
// In src/commands/my-command.ts
import { defineCommand } from '../framework.js';
```

### Registration Workflow

To register a new command/service/trigger:

1. **Write** the source file (e.g., `src/commands/my-cmd.ts`) importing from `../framework.js`
2. **Update** `project-spec.json` to declare the new artifact
3. **Run** `clint-project-regen` — codegen updates the marker regions in `cli.ts` with the correct imports and registrations
4. **Build** the project to verify TypeScript compiles

## Research Protocol

Before writing any skill, the author must:

1. **Read the source** — find the actual function signatures, types, and defaults in `packages/ph-clint/src/`
2. **Read the tests** — find the usage patterns and edge cases in `packages/ph-clint/tests/`
3. **Read the examples** — find the real-world usage in `examples/01-08`
4. **Read the HTML docs** — cross-reference `packages/ph-clint/docs/index.html` for the public API description
5. **Identify pitfalls** — common mistakes, non-obvious constraints, things the types don't catch

The per-skill specs below include specific research targets.
