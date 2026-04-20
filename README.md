# ph-clint — Powerhouse Command Line Intelligence

ph-clint is a TypeScript framework for building CLI tools that double as agent harnesses. A single set of Zod-based command definitions produces a CLI that works in command mode (`mycli cmd --arg val`), interactive REPL mode (`/cmd --arg val`), and as an MCP server — all from the same code. The framework supports optional integrations with [Mastra](https://mastra.ai/) for AI agents and [Powerhouse](https://www.powerhouse.inc/) for document operations.

## Prerequisites

- **Node.js** >= 22.13
- **pnpm** (pinned via `packageManager` field — run `corepack enable` to auto-select the right version)

## Repository Layout

This repository contains independent projects (not a pnpm workspace). Each project has its own `node_modules` and `pnpm-lock.yaml`.

| Path | Status | Description |
|------|--------|-------------|
| [`packages/ph-clint/`](packages/ph-clint/) | | The framework library |
| [`packages/ph-clint-dev/`](packages/ph-clint-dev/) | | Build-time tools: skill template compilation, agent profile generation |
| [`examples/01-hello-world/`](examples/01-hello-world/) | Done | Minimal: one command, no integrations |
| [`examples/02-task-tracker/`](examples/02-task-tracker/) | Done | REPL, workspace, parameter prompting |
| [`examples/03-file-watcher/`](examples/03-file-watcher/) | Done | Routine loop, triggers, background processes |
| [`examples/04-chat-assistant/`](examples/04-chat-assistant/) | Done | Mastra agent, streaming, memory |
| [`examples/05-ph-rupert/`](examples/05-ph-rupert/) | Done | ServiceManager, Mastra agent, skills, MCP client |
| [`examples/06-doc-browser/`](examples/06-doc-browser/) | Planned | Powerhouse reactor, drives, document operations |
| [`examples/07-doc-agent/`](examples/07-doc-agent/) | Planned | Mastra + Powerhouse, routine loop, document triggers |
| [`examples/08-reactor-dev/`](examples/08-reactor-dev/) | Planned | Full reference: multi-agent, services, skills, MCP |
| [`specs/`](specs/) | | Architecture docs, feature specs, skill definitions |

## Install, Build, and Test

### Library

```sh
cd packages/ph-clint
pnpm install
pnpm build        # compiles TypeScript to dist/
pnpm test         # runs unit + integration tests with coverage
```

### Examples

Each example is an independent project. Install and build them separately:

```sh
cd examples/01-hello-world
pnpm install
pnpm build
pnpm test
```

Repeat for any example you want to work with (`02-task-tracker`, `03-file-watcher`, etc.).

### Running Examples

Most examples provide `start` and `dev` scripts:

```sh
pnpm start             # run the compiled CLI (build first)
pnpm dev               # run from source via tsx (no build needed)
```

To launch interactive (REPL) mode, pass `-i`:

```sh
pnpm start -i
pnpm dev -i
```

## Development Workflow

After changing library source in `packages/ph-clint/`:

1. **Rebuild the library**: `pnpm build` in `packages/ph-clint/`
2. **If the build produced new files** in `dist/` (not just changes to existing ones), run `pnpm install` in the example directory to pick them up. Symptoms of a stale install: "Cannot find module" errors for files that exist in the library's `dist/`.

## Publishing

Packages are published via `ph-publish` (provided by ph-clint-dev). Each project with publish scripts exposes them as pnpm scripts:

```sh
# From any project with publish scripts (e.g. examples/05-ph-rupert/)
pnpm publish:dev          # dev prerelease
pnpm publish:staging      # staging prerelease
pnpm publish:production   # production release

# Extra flags go directly (no -- needed with pnpm)
pnpm publish:dev --dry-run
pnpm publish:dev --verbose
```

Config: `packages/publish.config.ts` (multi-group) or per-project `publish.config.ts`.

## Documentation

The ph-clint library includes HTML documentation with API reference, guides, and annotated examples:

```sh
npx serve packages/ph-clint/docs
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

Additional resources:

- [`CLAUDE.md`](CLAUDE.md) — project conventions, key concepts, and development process
- [`specs/features.md`](specs/features.md) — the 20 framework features
- [`specs/implementation.md`](specs/implementation.md) — tech stack, patterns, runtime details

Each example has its own README with setup and usage instructions — see the links in the [repository layout](#repository-layout) above.
