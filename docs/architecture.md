# Architecture Overview

## What is ph-clint?

ph-clint is a TypeScript framework for building AI-powered CLIs that integrate with the [Powerhouse](https://powerhouse.io) document ecosystem. A single `defineCli()` call produces a tool that works as a headless CLI, an interactive REPL with streaming agent responses, and an API server — all from the same codebase.

The framework handles the operational surface (config management, service lifecycle, event routing, agent orchestration) so that implementation projects can focus on domain logic: commands, triggers, document models, and agent skills.

## The Four Packages

The repository contains four published packages arranged in a dependency chain:

```
@powerhousedao/ph-clint          ← core framework library
@powerhousedao/clint-common      ← shared Powerhouse reactor package (document models for chat, etc.)
@powerhousedao/ph-clint-dev      ← build-time tooling (skill compilation, multi-package publishing)
@powerhousedao/ph-clint-cli      ← the ph-clint CLI itself (scaffolds new implementation projects)
```

### ph-clint — The Framework

The runtime library that implementation projects depend on. It provides:

- **CLI definition** — `defineCli()` binds config schemas, commands, services, triggers, and prompts into a single runnable CLI
- **Config system** — 6-layer resolution with auto-generated management commands
- **Commands** — `defineCommand()` with Zod input/output schemas that simultaneously serve as CLI subcommands, agent tools, and MCP operations
- **Services** — managed background processes with readiness detection, preflight checks, and restart policies
- **Triggers & Routines** — tick-based event loop for watching documents and dispatching work
- **Event bus** — typed pub/sub decoupling services, triggers, and integrations
- **Proxy** — embedded reverse proxy that unifies service endpoints under one port
- **Reactor integration** — PGlite-backed Powerhouse reactor with typed document operations
- **Agent integration** — Mastra agent with merged CLI tools + MCP tools, streaming output, memory
- **Three interfaces** — headless one-shot, interactive REPL with tab completion and markdown rendering, and GraphQL/MCP APIs

### clint-common — Shared Reactor Package

A Powerhouse reactor package providing document models shared across ph-clint implementations. Currently contains the `powerhouse/chat-session` document model used by the web UI chat integration.

### ph-clint-dev — Build Tools

Compile-time companion for framework users:

- **Skill compilation** — Handlebars templates compiled to SKILL.md files with frontmatter and scenario references
- **Agent profile building** — composable template sections rendered into per-agent instruction files
- **Multi-package publishing** — lockstep versioning, `file:` dep rewriting, partial-failure recovery, registry verification
- **Project layout detection** — identifies flat vs split project structures
- **Manifest building** — processes `powerhouse.manifest.json` with remote image download

### ph-clint-cli — The Scaffolding CLI

A ph-clint implementation that creates other ph-clint implementations. It demonstrates the framework's full capability while providing practical tooling:

- **Project scaffolding** — `clint-project-init` generates 25+ files from a `ClintProjectSpec`
- **Live regeneration** — `spec-change` trigger watches the spec document and auto-regenerates on edit
- **Incremental updates** — marker-based region splicing + hash-protected overwrites preserve user edits
- **Layout migration** — automatic flat-to-split conversion when Powerhouse is enabled
- **Automated publishing** — `publish-trigger` watches for pending publish records and runs the pipeline
- **Spec-as-document** — the project specification is both JSON on disk and a Powerhouse document in the personal drive, kept in sync bidirectionally

## How They Compose

A typical implementation project (`my-tool-cli`) depends on `@powerhousedao/ph-clint` at runtime and `@powerhousedao/ph-clint-dev` at build time. The ph-clint-cli scaffolds the project structure:

```
my-tool/
  my-tool-cli/          # CLI package (depends on ph-clint)
    src/cli.ts          # defineCli() — commands, services, triggers
    src/framework.ts    # config/secrets schemas, createTypes() binding
    prompts/            # skill templates and agent profiles
  my-tool-app/          # Reactor package (document models, editors)
  publish.config.js     # Lockstep version groups for ph-clint-dev
```

The CLI watches the reactor for document changes, the reactor package provides domain-specific document models, and the agent can use both CLI commands and reactor MCP tools.

## Detailed Documentation

- [ph-clint framework](./ph-clint.md) — config, commands, services, triggers, reactor, agents, proxy, REPL
- [ph-clint-dev build tools](./ph-clint-dev.md) — skill compilation, publishing pipeline, layout detection
- [ph-clint-cli scaffolding CLI](./ph-clint-cli.md) — project spec, code generation, triggers, post-gen actions
