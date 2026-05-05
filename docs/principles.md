# ph-clint Design Principles

## 1. Spec-Driven

> Correctness, Consistency, Scalability, Maintainability, Reusability, Self-descriptiveness

The specification is authoritative. Everything — types, behavior, help, tools, config — is derived from declarations. Fix the spec, not the symptoms.

### Schema as Source of Truth

Zod schemas are the single source for validation, CLI help, agent tool metadata, interactive prompting, config introspection, environment variable naming, and error formatting. No parallel schema languages, no manual metadata objects. The framework introspects Zod at runtime (`getSchemaFields()`) to derive everything else. If a new consumer needs field information, it reads the schema — it doesn't introduce a second description format.

### Type Once, Use Everywhere

The `createTypes()` pattern binds `TConfig` and `Registry` generics once at the project root. All returned factories are pre-typed, eliminating repetitive generic parameters across dozens of commands and triggers. `defineRegistry()` infers a mapped type from a readonly tuple — full narrowing for CRUD, events, and triggers. Generics flow end-to-end: config schema to command context to event payloads to reactor operations. `TypedReactorClient<R>` narrows methods per registry key using pure TypeScript — no runtime wrapping.

### Commands as the Universal Unit of Work

Commands follow the Mastra `createTool()` shape (Zod input schema, optional output schema, execute handler). A single definition works as a CLI subcommand, agent tool, routine work item, REPL action, and MCP tool. No adapter code — the spec is the implementation across all dispatch paths.

### Fix the Source, Not the Symptom

When something is awkward, redesign the upstream cause rather than working around it. If argument processing has edge cases, let Commander handle scoping natively instead of patching argv. If a branch is untestable, the type is too loose — tighten the schema, don't write tests for unreachable code. If stdout needs to be captured in tests, make it injectable in production — don't mock `console.log`. Workarounds are technical debt, not pragmatism.

### Round-Trip Integrity

When the same truth has two representations (spec document and on-disk JSON, document state and generated code), both directions must be lossless. The spec-roundtrip test enforces this with an exhaustive shape guard — a static set of every leaf path that fails on unexpected or missing paths, catching silent regressions where a field is added to one representation but not wired through to the other.

### Single Source for Identity

Package identity (name, version, root) is read from `package.json` at runtime via `readPackageInfo()`. No hardcoded version strings, no duplicated names. The `-cli` suffix strip is explicit in the implementation, not hidden in a helper. The `package.json` is the single source of truth for identity.

---

## 2. Verifiable Surface Area

> Testability, Observability, Traceability, Reliability

Every layer can be observed and validated independently. Injectable I/O, traceable config, actionable errors, and multi-level testing ensure intention matches reality.

### Testability as Architecture

All process-boundary concerns (stdout, stderr, exit) are injectable via `RunOptions`, not hardcoded. No global mutable state, no implicit singletons. The framework's production API is its test API — there is no separate "test mode." `createMemoryWorkdirStore` replaces filesystem mocking. `createReplSession` replaces terminal mocking. The design makes mocking unnecessary for internal code; injection replaces it everywhere.

### Three Testing Levels

Unit tests call `command.execute()` directly — pure functions, no framework overhead. Integration tests call `cli.run()` with injected I/O — the full Commander pipeline exercised in-process. E2E tests spawn real subprocesses. Most tests should be integration-level: they exercise the full pipeline (argument parsing, validation, routing, execution, output) without subprocess overhead. The framework's injectable design makes integration tests as reliable as E2E tests but much faster.

### Don't Test Around Bad Types

When a branch is untestable, the problem is the type, not a missing test. Categorize uncovered branches: wrong nullability (tighten the schema), missing validation (add explicit rejection), wrong operator (fix `||` to `??`), or legitimate optionality (add test cases). Fix the implementation so every branch is either reachable and meaningful, or eliminated entirely. Coverage follows naturally from correct types, proper validation, and realistic scenario tests.

### Three-Mode Output Architecture

All output flows through injectable callbacks (`stdout`, `stderr`, `writeRaw`) resolved once at startup. `StreamChunk` is the atomic unit of agent output (text-delta, tool-call, tool-result, error). Three rendering paths with consistent formatting: headless (immediate write, no buffering), headless interactive-streaming (segment accumulation with markdown rendering), and Ink REPL (live segments during streaming, markdown on completion). Rolling window for tool output. The same `formatStreamChunk()` formatter is used across all three modes.

### Actionable Error Messages

Errors are formatted for humans. Zod issues are unpacked into readable per-field messages with `--flag` names, not internal path strings. Preflight failures include remediation hints ("Stop the process using port 4801, or set a different port in config"). Missing commands include install instructions. The user should never see an error without understanding what to do about it.

### Exhaustive Shape Guards

When a system maintains two representations of the same truth, tests define the expected shape as a static set of every leaf path. Unexpected paths mean a field was added but not covered. Missing paths mean a field disappeared. This catches silent regressions that value-level assertions miss.

---

## 3. Progressive Complexity

> Simplicity, Composability, Configurability, Performance, Completeness

Simple when you need simple, complete when you need complete. Each capability activates independently, loads lazily, and composes without friction.

### Minimal Core, Optional Everything

A minimal CLI needs only `defineCli` + `defineCommand`. Reactor, Switchboard, Connect, Mastra, Routines, Skills, and Proxy each activate independently. Adding `configSchema` gives you 6-layer config resolution, auto-generated config command, and interactive prompting. Adding a registry gives you typed reactor operations. Adding triggers gives you a tick-based routine loop. Each layer adds capability without burdening simpler use cases.

### Lazy Loading and Optional Peer Dependencies

Heavy integrations (Powerhouse, Mastra) are optional peer dependencies. The `reactor()` and `agent()` accessors return `undefined` when not configured — no initialization cost, no type dependency when unused. Runtime coupling is deferred until the integration is actually called via dynamic import. One-shot commands start fast; the full runtime stack only initializes for interactive or keep-alive modes.

### Auto-Generated Commands

The framework auto-generates operational commands from declarations: `config` from the config schema, `cli-docs` from the command registry, service commands (`{id}-start`, `{id}-stop`, `{id}-ps`, `{id}-logs`, `{id}-ls`) from service definitions, skill commands from SKILL.md files. Implementations define domain logic; the framework handles operational boilerplate.

### Composable Services

Services are declared as self-contained definitions (command, readiness, preflight, restart, shutdown) and compose into a service manager without coordination code. The routine-service adapter wraps the trigger loop as a service. The composite service manager multiplexes process-based and routine-based services behind a unified interface. Adding a service means adding a definition — the framework handles lifecycle, commands, and endpoint discovery.

### Events for Decoupling

Commands, triggers, services, and integrations communicate through a typed event bus rather than direct calls. Event payloads are narrowed by registry (document change events carry the correct document type). Custom events via string key fall through to `unknown` — extensible without framework changes. The event bus enables features to compose without coupling: a trigger doesn't import the reactor, it subscribes to `powerhouse:document:changed`. A service doesn't call the routine, it emits `service:ready`. Each publisher and subscriber can be developed, tested, and activated independently.

### Suppression Flags

When the full stack is configured, individual layers can be suppressed at runtime (`--no-routine`, `--no-api`, `--no-studio`) without changing configuration. This supports development workflows (debug the REPL without triggers), operations (API-only mode without Connect), and testing (isolate subsystems).

---

## 4. Explicit Ownership

> Separation of Concerns, Transparency, Predictability, Extensibility

Every piece of state, code, and behavior has one declared owner. Boundaries are visible, defaults are traceable and overridable, ownership is transferable. Ambiguity is a bug class.

### Generated vs. User-Owned Code

Auto-generated code (config command, service commands, skill commands, `framework.gen.ts`) is freely regenerated. User-owned code (business logic commands, triggers, services, `framework.ts`) is never touched. In hybrid files, `@clint:begin`/`@clint:end` markers define machine-owned regions — the generator splices content between markers and preserves everything outside. Hash-based reconciliation protects unmarked files: overwrite only if the on-disk hash matches the stored hash, skip with a warning if the user has edited. Force flag available as escape hatch, never the default.

### Framework Flags vs. Subcommand Options

Framework flags (--workdir, --config, --resume) and subcommand options are independent namespaces. Commander's `enablePositionalOptions()` handles scoping natively. The framework extracts flag values from pre-subcommand args in a single pass but passes argv unmodified to Commander. Subcommand options are opaque to the framework. The "double-workdir" test case is the litmus test: `mycli --workdir workspace cmd --workdir project` must resolve both independently.

### Workspace vs. Context Folder

The workspace is the user's working directory — where data lives. The context folder (`.ph/`) is ph-clint's managed state directory (config, databases, session data). The user owns the workspace; the framework owns `.ph/`. Agents operate on the workspace via the Mastra working directory, reading and writing the same files the user sees.

### Configuration Transparency

Six config layers with explicit precedence: config file flag, env vars, local `.ph/` config, user `~/.ph/` config, implementation defaults, schema defaults. The auto-generated `config` command shows which layer each value comes from. Environment variable names are derived by convention (`{CLINAME}_{FIELD_NAME}`) and documented automatically. Port defaults are derived deterministically from CLI name via hash — traceable, not magic. Every default is overridable at the appropriate layer.

### Architectural Classification

Switchboard is in-process (shares Reactor's process, must shut down before Reactor). Connect is a detached service (survives CLI exit, has readiness detection and PID tracking). Reactor is an in-process library (user-provided factory, lazy accessor). Each is classified differently because they have different lifecycles — and the framework makes these classifications visible through API design, shutdown ordering, and service management rules.

### Output Channel Separation

Two output channels with different audiences. `output()` is the public channel — concise status messages the user sees (URLs, drive IDs, "Routine running"). `log` is the diagnostic channel — level-filtered, for CI logs and debugging (storage paths, preflight steps, timing). stdout vs stderr. They never cross. Adding a new subsystem means deciding which channel owns its messages.

### Deterministic Identity

Drive IDs, reactor instance IDs, and default ports are derived deterministically (SHA-256 hash of CLI name + salt, DJB2 hash for ports). The same CLI name produces the same IDs on every machine, every run. Drives survive across restarts and state deletion. Ports don't collide between different CLIs. No UUIDs for infrastructure identity — only for user-created documents.

---

## 5. End-to-End

> Self-containedness, Releasability, Deployability, Operability

The framework covers the full lifecycle — scaffold, develop, build, publish — as one coherent system. Same spec, same types, same conventions throughout. No seams.

### Spec-Driven Code Generation

`clint-project-init` scaffolds a complete project from a `ClintProjectSpec`. The spec persists as both JSON on disk and a Powerhouse document in the personal drive. 25+ file builders produce the full project structure. Two generation modes: create (scaffold fresh) and update (reconcile against existing code with marker splicing and hash protection). The spec is the input; the project is the output.

### Live Spec Synchronization

The `spec-change` trigger watches the spec document for changes — any edit via the Connect UI, GraphQL, or programmatic operation triggers project regeneration. Changes are hash-compared to avoid unnecessary rebuilds. Deleted spec documents are automatically recreated from on-disk JSON. The spec document and the project stay synchronized without manual intervention.

### Layout-Aware Build

The build system detects project layout (split: `{name}-cli/` + `{name}-app/`, or flat: single package) and builds packages in dependency order. For split layouts, the app package builds first, then the CLI package. `file:` dependencies between packages trigger `pnpm install` when builds produce new files in `dist/`. Layout migration (flat to split) is detected and handled during regeneration.

### Lockstep Publishing

All framework packages share a single version, published as one lockstep group. Three channels: `dev` (prerelease), `staging` (prerelease), `production` (release). Version is computed from registry state (`{base}-{tag}.{N}`), not declared manually. `file:` dependencies are rewritten to npm versions during publish and restored after. The pipeline decomposes into three callable phases (resolve plan, build, publish) enabling preview, skip-build, and recovery from partial failures. Registry verification uses exponential backoff for eventual consistency.

### Skill Compilation Pipeline

Agent profiles and skill templates are authored as Handlebars markdown with build-time config injection. The `build-skills` CLI compiles three sources in parallel: agent profile sections (concatenated into per-agent Markdown files), skill templates (SKILL.md with frontmatter and scenario references), and external skills (copied unchanged). Template variables are validated at build time with warnings for undefined references. Multiple include directories support composition across packages.

### Scaffolded Project Dependencies

When the CLI scaffolds a new implementation project, dependency ranges are derived from the running CLI's own version. A `dev` CLI produces `^0.1.0-dev.0` ranges (accepting dev, staging, and stable). A `production` CLI produces `^0.1.0` ranges (stable only). Projects stay on the same channel as the CLI that created them while naturally upgrading through the promotion path.
