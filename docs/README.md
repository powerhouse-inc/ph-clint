# ph-clint Contributor Guide

## Getting Started

### Prerequisites

- Node.js >= 22.13.0
- pnpm 10.x (`corepack enable` to activate the bundled version)

### Repository Structure

```
packages/
  ph-clint/          # Core framework library (@powerhousedao/ph-clint)
  clint-common/      # Shared reactor package (@powerhousedao/clint-common)
  ph-clint-dev/      # Build-time tooling (@powerhousedao/ph-clint-dev)
  ph-clint-cli/      # The ph-clint CLI itself (@powerhousedao/ph-clint-cli)
    ph-clint-cli/    #   CLI side (built with ph-clint)
    ph-clint-app/    #   Reactor package side (document models, editors)
```

There is no pnpm workspace — each package installs independently. Cross-package references use `file:` protocol dependencies that the publish pipeline rewrites to npm versions.

### Install & Build

```sh
# Install all packages
cd packages/ph-clint && pnpm install
cd packages/clint-common && pnpm install
cd packages/ph-clint-dev && pnpm install
cd packages/ph-clint-cli && pnpm install   # installs both sub-projects

# Build (order matters — deps before dependents)
cd packages/ph-clint && pnpm build
cd packages/clint-common && pnpm build
cd packages/ph-clint-dev && pnpm build
cd packages/ph-clint-cli && pnpm build     # builds app then cli
```

### Running in Development

```sh
# Run the ph-clint CLI in dev mode (tsx, no build needed)
cd packages/ph-clint-cli/ph-clint-cli && pnpm dev
```

## Running the Tests

Always use `pnpm test` — never `npx jest` directly (the `--experimental-vm-modules` flag is required and configured in package scripts).

```sh
# Per-package tests
cd packages/ph-clint && pnpm test
cd packages/ph-clint-dev && pnpm test
cd packages/ph-clint-cli/ph-clint-cli && pnpm test

# E2E tests (ph-clint-cli only)
cd packages/ph-clint-cli/ph-clint-cli && pnpm test:e2e
```

Testing conventions:
- No mocks — use fixtures and real implementations
- Integration/E2E tests preferred over unit tests
- `createStreamingClient()` and `createTerminalClient()` for CLI testing
- `MemoryWorkdirStore` for store testing without filesystem

## Design Principles

The project follows five core principles: Spec-Driven, Verifiable Surface Area, Progressive Complexity, Explicit Ownership, and End-to-End.

See [principles.md](./principles.md) for the full reference.

## Architecture

The system is split into four packages that form a layered dependency chain:

```
ph-clint (framework) ← ph-clint-dev (build tools) ← ph-clint-cli (the CLI)
                     ← clint-common (shared reactor package)
```

See [architecture.md](./architecture.md) for the high-level overview and links to detailed per-package documentation.

## Conventions

- **Package manager**: Always `pnpm`, never `npm` or `yarn`
- **Module system**: ESM only (`"type": "module"`)
- **TypeScript**: Strict mode, Node16 module resolution
- **Arguments**: pnpm passes args directly to scripts — never use `--` separator
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
