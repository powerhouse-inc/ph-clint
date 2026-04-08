# 05b — Vetra Mastra

Reactor development CLI with Mastra AI agent and pre-packaged skills.

This example demonstrates:

- **Mastra agent integration** with ph-clint — shared agent definition used by both the CLI and Mastra Dev Studio
- **Pre-packaged skills** — Handlebars-compiled SKILL.md files copied into the store at `init`
- **Service management** — Vetra dev server with multi-pattern readiness detection
- **MCP client** — dynamic tool discovery via Model Context Protocol
- **Demo mode** — fallback agent when no API key is configured

## Setup

```bash
pnpm install
pnpm build          # compiles skills + TypeScript, copies skills to dist/
```

Copy `.env.example` to `.env` and set `VETRA_MASTRA_API_KEY` for real LLM responses.

## Usage

```bash
# Initialize workspace (creates .ph/vetra-mastra/, installs skills)
pnpm dev init

# Start interactive REPL
pnpm dev -i

# Mastra Dev Studio
pnpm mastra:dev
```

## Project structure

```
src/
  main.ts                  Entry point — calls cli.run()
  cli.ts                   CLI definition (commands, services, events, skillSources)
  config.ts                Zod config schema (6 fields, env var mapping)
  commands/
    init-project.ts        Initialize a Reactor project via `ph init`
  agents/
    agent-rupert.ts        Full Mastra agent with workspace, memory, skills
    demo-agent.ts          Fallback agent for demo mode (no API key)
    instructions.ts        Re-exports generated agent instructions
  mcp/
    client.ts              MCP connection utilities
  mastra/
    index.ts               Mastra Dev Studio entry point (independent lifecycle)
    generated/             Auto-generated agent instructions (from build:skills)
skills-src/                Skill source templates (Handlebars + markdown scenarios)
skills/                    Built SKILL.md files (output of build:skills)
scripts/
  build-skills.ts          Compiles agent profiles + skill scenarios
tests/
  vetra-mastra.test.ts     Unit + integration tests
  fixtures/test-server.js  Mock Vetra server for service tests
```

## Skills

Seven pre-packaged skills are compiled from `skills-src/` during `pnpm build:skills`:

| Skill | Purpose |
|-------|---------|
| `document-modeling` | Define state schemas and operations for Powerhouse documents |
| `document-editor-creation` | Build React editors for document models |
| `fusion-development` | Implement Fusion UI pages |
| `fusion-project-management` | Initialize and manage Fusion projects |
| `handle-stakeholder-message` | Triage stakeholder messages and update WBS docs |
| `reactor-package-project-management` | Initialize and manage Reactor packages |

Skills are installed into `.ph/vetra-mastra/.mastra/skills/` by the built-in `init` command (auto-injected by ph-clint when `skillSources` is set).

## Testing

```bash
pnpm test
```
