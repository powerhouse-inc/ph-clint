# ph-clint — Powerhouse Command Line Intelligence

ph-clint is a TypeScript framework for building CLI tools that double as agent harnesses. A single set of Zod-based command definitions produces a CLI that works in command mode (`mycli cmd --arg val`), interactive REPL mode (`/cmd --arg val`), and as an MCP server — all from the same code. The framework supports optional integrations with [Mastra](https://mastra.ai/) for AI agents and [Powerhouse](https://www.powerhouse.inc/) for document operations.

## Prerequisites

- **Node.js** >= 22.13
- **pnpm** (pinned via `packageManager` field — run `corepack enable` to auto-select the right version)

## Repository Layout

This repository contains independent projects (not a pnpm workspace). Each project has its own `node_modules` and `pnpm-lock.yaml`.

| Path | Description |
|------|-------------|
| [`packages/`](packages/) | Framework packages — install, build, test, and publish instructions in [`packages/README.md`](packages/README.md) |
| [`examples/01-hello-world/`](examples/01-hello-world/) | Minimal: one command, no integrations |
| [`examples/02-task-tracker/`](examples/02-task-tracker/) | REPL, workspace, parameter prompting |
| [`examples/03-file-watcher/`](examples/03-file-watcher/) | Routine loop, triggers, background processes |
| [`examples/04-chat-assistant/`](examples/04-chat-assistant/) | Mastra agent, streaming, memory |
| [`examples/05-ph-rupert/`](examples/05-ph-rupert/) | ServiceManager, Mastra agent, skills, MCP client |
| [`examples/06-connect-agent/`](examples/06-connect-agent/) | AI chat agent backed by Powerhouse documents, CLI REPL + Connect web UI |
| [`examples/07-doc-agent/`](examples/07-doc-agent/) | Mastra + Powerhouse, routine loop, document triggers |
| [`examples/08-reactor-dev/`](examples/08-reactor-dev/) | Full reference: multi-agent, services, skills, MCP |
| [`specs/`](specs/) | Architecture docs, feature specs, skill definitions |

## Examples

Each example is an independent project. Install and run them separately:

```sh
cd examples/01-hello-world
pnpm install
pnpm build
pnpm test
```

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
