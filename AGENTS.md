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

## Critical Rules

**Read [docs/methodology.md](./docs/methodology.md) for the full rationale behind each of these.**

**Type strictness is non-negotiable.** No `any` casts, no `as unknown as T`, no type assertions to work around compiler errors. The entire framework — config schemas, command contexts, event payloads, reactor operations, registry types — is designed for end-to-end type safety. An `as any` anywhere in the chain silently defeats the type registry, the spec-driven design, and the verifiable surface area. If TypeScript complains, fix the type upstream. If you can't, ask the user.

**No backward-compatibility shims.** There are no legacy consumers. When an API changes, change it and update all call sites in the same commit. No optional parameters to avoid a breaking change, no re-exports, no deprecated wrappers, no compatibility overloads.

**Diagnostics first, changes second.** Do not make speculative fixes. ph-clint has complex interactions between codegen, config resolution, service lifecycle, event routing, reactor subscriptions, and agent orchestration. When something behaves unexpectedly, add diagnostic log output, run the code, confirm the actual behavior, then make a targeted fix. Unconfirmed hypotheses lead to side-effect bugs that are worse than the original problem. No trial and error!!

**Validate in the sandbox.** Use `sandbox/` to test the full user journey: build the dev ph-clint-cli and run it with --help, scaffold a project, wire it to the dev build with `file:` dependencies, configure in the sandbox the spec for the feature under test, run the generated CLI, and confirm end-to-end behavior. See [methodology.md — Sandbox Validation](./docs/methodology.md#sandbox-validation) for the full workflow.

**Known Issue: Vetra codegen overwrites** When working on reactor packages, codegen may auto-trigger and overwrite test files. Commit reducer implementations and tests immediately so you can `git checkout` to restore them.

## Development Methodology

Read [docs/methodology.md](./docs/methodology.md) for the full development process. Key points:

- **TDD workflow**: assess → research → specify → refactor first → tests (red) → implement (green) → verify E2E → commit
- **95% coverage minimum** across statements, branches, functions, lines
- **Real execution over mocks** — no mocking process globals, child processes, or filesystem
- **Defaults wrapper pattern** — split optional-parameter resolution into an `istanbul ignore` wrapper so the implementation body has no untestable fallback branches
- **Refactors are separate commits** — restructure first, then build on the clean foundation
- **No integration imports in core modules** — `core/`, `routine/`, `execution/`, `output/`, `interactive/`, `cli/` stay integration-free
- **Consistent definition patterns** — always use `defineCommand`, `defineCli`, `defineTrigger`, `defineService`
- **Research dependencies first** — use documented public APIs only, never internal/undocumented structures

## Detailed Documentation

Per-package architecture references (read these before making changes to a package):

- [docs/ph-clint.md](./docs/ph-clint.md) — core framework: config, commands, services, triggers, reactor, agents, proxy, REPL
- [docs/ph-clint-dev.md](./docs/ph-clint-dev.md) — build tools: skill compilation, publishing pipeline, layout detection
- [docs/ph-clint-cli.md](./docs/ph-clint-cli.md) — scaffolding CLI: project spec, code generation, triggers, post-gen actions
