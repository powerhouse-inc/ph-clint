# ph-clint Repository — Agent Instructions

## Overview

This is the ph-clint packages repo: a TypeScript framework for building AI-powered CLIs that integrate with the Powerhouse document ecosystem.

Read [docs/architecture.md](./docs/architecture.md) for a high-level overview of the system and its four packages. Read [docs/principles.md](./docs/principles.md) for the design principles that guide all implementation decisions.

## Repository Structure

```
packages/
  ph-clint/          # Core framework library (@powerhousedao/ph-clint)
  clint-common/      # Shared reactor package (@powerhousedao/clint-common)
  ph-clint-dev/      # Build-time tooling (@powerhousedao/ph-clint-dev)
  ph-clint-cli/      # The ph-clint CLI itself (@powerhousedao/ph-clint-cli + ph-clint-app)
docs/                # Architecture and contributor documentation
specs/               # Design specs and working notes
```

No pnpm workspace — each package installs independently. Cross-package references use `file:` protocol dependencies.

## Key Conventions

- **Package manager**: Always use `pnpm`, never `npm` or `yarn`
- **Running tests**: Always use `pnpm test` (configures `--experimental-vm-modules`), never `npx jest` directly
- **Module system**: ESM only (`"type": "module"`)
- **TypeScript**: Strict mode, Node16 module resolution

**IMPORTANT**
pnpm passes args to scripts directly — NEVER use `--` separator

## Detailed Documentation

Per-package architecture references (read these before making changes to a package):

- [docs/ph-clint.md](./docs/ph-clint.md) — core framework: config, commands, services, triggers, reactor, agents, proxy, REPL
- [docs/ph-clint-dev.md](./docs/ph-clint-dev.md) — build tools: skill compilation, publishing pipeline, layout detection
- [docs/ph-clint-cli.md](./docs/ph-clint-cli.md) — scaffolding CLI: project spec, code generation, triggers, post-gen actions
