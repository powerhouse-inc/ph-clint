# 05 — Powerhouse Rupert

Reactor development CLI with Mastra AI agent and pre-packaged skills.

This example demonstrates:

- **Mastra agent integration** with ph-clint — shared agent definition used by both the CLI and Mastra Dev Studio
- **Pre-packaged skills** — Handlebars-compiled SKILL.md files copied into the store at `init`
- **Service management** — Reactor Projects service (Vetra Studio + Switchboard) with multi-pattern readiness detection
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
# Initialize workspace (creates .ph/ph-rupert/, installs skills)
pnpm dev init

# Start interactive REPL
pnpm dev -i

# Mastra Dev Studio
pnpm mastra:dev
```

## Commands

| Command                   | Source                 | Description                                                                |
| ------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `login`                   | manual                 | Authenticate with Renown — opens browser, polls for session, saves keypair |
| `logout`                  | manual                 | Clear local credentials and revoke the active Renown session               |
| `access-token`            | manual                 | Generate a short-lived access token from the stored keypair                |
| `reactor-project-init`    | manual                 | Initialize a new Reactor package project via `ph init`                     |
| `reactor-project-build`   | manual                 | Build a Reactor package (`ph build`) — streams output                      |
| `reactor-project-publish` | manual                 | Build and publish a Reactor package to the npm registry                    |
| `reactor-project-ls`      | auto (service scanner) | List Reactor package projects in the working directory                     |
| `reactor-project-start`   | auto (service)         | Start the Vetra Studio server for a Reactor project                        |
| `reactor-project-stop`    | auto (service)         | Stop the Reactor Projects service                                          |
| `reactor-project-restart` | auto (service)         | Restart the Reactor Projects service                                       |
| `reactor-project-ps`      | auto (service)         | Show Reactor Projects service status and endpoints                         |
| `reactor-project-logs`    | auto (service)         | Tail Reactor Projects service logs                                         |
| `reactor-project-manage`  | auto (service)         | Open interactive management panel (REPL only)                              |
| `fusion-project-init`     | manual                 | Initialize a new Fusion project via git clone                              |
| `fusion-project-ls`       | auto (service scanner) | List Fusion projects in the working directory                              |
| `fusion-project-start`    | auto (service)         | Start the Fusion Dev Server                                                |
| `fusion-project-stop`     | auto (service)         | Stop the Fusion Dev Server                                                 |
| `fusion-project-restart`  | auto (service)         | Restart the Fusion Dev Server                                              |
| `fusion-project-ps`       | auto (service)         | Show Fusion Dev Server status                                              |
| `fusion-project-logs`     | auto (service)         | Tail Fusion Dev Server logs                                                |
| `fusion-project-manage`   | auto (service)         | Open interactive management panel (REPL only)                              |

## Project structure

```
src/
  main.ts                  Entry point — calls cli.run()
  cli.ts                   CLI definition (commands, services, events, prompt artifacts)
  config.ts                Zod config schema (6 fields, env var mapping)
  commands/
    reactor-package-init.ts  Initialize a Reactor project via `ph init`
    fusion-project-init.ts   Initialize a Fusion project via git clone
  services/
    vetra.ts               Reactor Projects service (Vetra Studio + Switchboard)
    fusion-project.ts      Fusion Dev Server service
  agents/
    agent-rupert.ts        Full Mastra agent with workspace, memory, skills
    demo-agent.ts          Fallback agent for demo mode (no API key)
    instructions.ts        Re-exports generated agent instructions
  mcp/
    client.ts              MCP connection utilities
  mastra/
    index.ts               Mastra Dev Studio entry point (independent lifecycle)
    generated/             Auto-generated agent instructions (from build:skills)
prompts/                   Skill source templates (Handlebars + markdown scenarios)
scripts/
  build-skills.ts          Compiles agent profiles + skill scenarios
tests/
  vetra-mastra.test.ts     Unit + integration tests
  fixtures/test-server.js  Mock Reactor Projects server for service tests
```

## Skills

Six pre-packaged skills are compiled from `prompts/skills-tpl/` during `pnpm build:skills`:

| Skill | Purpose |
|-------|---------|
| `document-modeling` | Define state schemas and operations for Powerhouse documents |
| `document-editor-creation` | Build React editors for document models |
| `fusion-development` | Implement Fusion UI pages |
| `fusion-project-management` | Initialize and manage Fusion projects |
| `handle-stakeholder-message` | Triage stakeholder messages and update WBS docs |
| `reactor-project-management` | Initialize and manage Reactor packages |

Skills are installed into `.ph/ph-rupert/.mastra/skills/` by the built-in `init` command (auto-injected by ph-clint when `prompts.artifacts` is set).

## Testing

```bash
pnpm test
```
