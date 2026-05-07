# Development Methodology

> Back to [architecture overview](./architecture.md)

## Development Process

Development follows a strict TDD-style workflow. Every feature goes through these steps, in order:

### 1. Assess

Familiarize yourself with the current state of the codebase. Read relevant source, tests, and specs. Understand what exists, what's tested, and what the coverage looks like before changing anything.

### 2. Research

Before writing code that uses a dependency, research its intended public API and best practices. Read type definitions, documentation, and changelogs. Never rely on internal/undocumented APIs without explicit justification. Implementations must follow the documented, stable API surface of dependencies — not internal structures that may break between releases. When in doubt, consult the library's type definitions, documentation, or changelog to confirm a pattern is part of the public contract. Exceptions must be few and always documented.

### 3. Identify

Determine the next feature to implement. Don't skip ahead — features build on each other.

### 4. Specify

Carefully specify the new feature before coding. Consider:
- What types, interfaces, and functions are needed?
- How does this affect the existing public API surface?
- Does this introduce new dependencies?
- Will this create coupling that limits future features?
- Does the design preserve testability (injectable I/O, no global state)?

Raise concerns with the user if the feature would compromise long-term quality.

### 5. Refactor First

If the current code needs restructuring to cleanly support the new feature, do that first. Refactoring is a separate step with its own commit:
- Make the structural change.
- Fix all existing tests — no regressions allowed.
- Verify coverage is maintained.
- Commit the refactor separately before proceeding.

### 6. Write Tests First (Red)

Write tests before implementing the feature:
- Unit tests for the new command/feature behavior.
- Integration tests exercising the full CLI pipeline via `RunOptions`.
- E2E tests spawning real subprocesses where appropriate.

Run the tests and confirm they fail for the right reasons (missing library exports, unimplemented behavior — not syntax errors or broken imports). Always use `pnpm test` (unit/integration) and `pnpm test:e2e` (end-to-end) — never invoke jest directly.

### 7. Implement (Green)

Implement the feature to make the failing tests pass:
- **Fix regressions first.** If any existing tests broke, fix those before attending to new tests. The existing test suite is the safety net — it must always pass.
- Then make the new tests pass.
- Maintain 95% coverage throughout.

### 8. Verify End-to-End

After tests pass, verify the project works as a real CLI — not just in test harnesses:
- `pnpm build` completes without errors (TypeScript compiles cleanly).
- `pnpm start` runs the built CLI. Every project must have a `start` script.
- `pnpm dev` (or equivalent) starts without errors.
- Manual smoke test: run a representative command and confirm the output matches expected behavior.

**For codegen changes**, run the actual codegen command (e.g. `clint-project-regen`) against a sandbox project and inspect the generated files. Do not mentally trace the code path to predict what would be generated — run it and check.

Do not consider a feature complete until it builds, starts, and runs correctly outside of the test suite.

### 9. Commit

Commit the implementation. The commit history should tell a clear story: refactor (if any) → tests → implementation.

---

## Code Quality Standards

The `ph-clint` library (`packages/ph-clint/`) is production-grade code — treat it accordingly.

**Coverage**: Maintain a minimum of 95% test coverage (statements, branches, functions, lines) across unit and integration tests combined.

**Fix the implementation, don't test around it**: When coverage drops below threshold, triage each uncovered branch before writing tests. Classify it as one of:
1. **Wrong nullability** — type allows null but the value is always initialized. Fix: tighten the type to eliminate the unreachable fallback.
2. **Missing validation** — a silent fallback hides invalid input. Fix: add validation that throws a specific error, making the branch both reachable and meaningful.
3. **Wrong operator** — `||` where `??` is needed (or vice versa), creating a bug not a coverage gap. Fix: correct the operator and add a test for the falsy-but-valid case.
4. **Legitimate optionality** — both branches are reachable through valid inputs. Fix: add a test.

Only category 4 warrants a new test. The others warrant implementation fixes that eliminate the untestable branch entirely. When a branch is untestable, the problem is almost never a missing test — it's a type that's too loose, a validation that's missing, or an operator that's wrong.

**Real execution over mocks**: Prefer real execution over mocks. Unit tests should exercise logic directly, integration tests should spawn real processes and verify actual stdout/stderr/exit codes. Do not mock `process.exit`, `process.stdout`, child processes, filesystem, or other runtime internals — if you believe a mock is genuinely necessary, ask the user before introducing it.

**Continuous cleanup**: Continuously review the library for code smells, duplication, and structural issues; clean these up as you encounter them rather than letting them accumulate. When you notice that implementation choices are leading to technical debt — unclear module boundaries, leaky abstractions, growing coupling between components — proactively raise the issue with the user and propose an architecture change before proceeding.

### Coverage Technique: Defaults Wrapper

When a function accepts optional parameters that get filled with defaults, every `??` / `||` fallback creates a branch that tests may never exercise — the test always passes the explicit value, so the default path stays uncovered. Fix this by splitting the function into a thin public wrapper that resolves all defaults and an internal implementation that receives a fully-resolved options object with no optionals:

```ts
interface ResolvedOpts {
  exit: (code: number) => void;
  stdout: (msg: string) => void;
}

async function run(argv: string[], opts?: RunOptions): Promise<void> {
  /* istanbul ignore next -- process defaults only used as a real CLI */
  const resolved: ResolvedOpts = {
    exit: opts?.exit ?? ((code) => process.exit(code)),
    stdout: opts?.stdout ?? ((msg) => { console.log(msg); }),
  };
  return runImpl(argv, resolved);
}

async function runImpl(argv: string[], opts: ResolvedOpts): Promise<void> {
  // All branches here are fully testable — no fallback paths
}
```

The wrapper concentrates all default-resolution into a single `istanbul ignore` block. The implementation body has no optional checks left, so every branch is reachable from tests.

---

## Type Strictness

ph-clint is designed around end-to-end type safety as a core architectural property — not just a linting preference. The Spec-Driven and Verifiable Surface Area [design principles](./principles.md) depend on types being precise and trustworthy throughout the entire pipeline.

**No `any` casts, anywhere.** If a type is `any`, it breaks the chain. The `createTypes()` pattern binds `TConfig` and `Registry` generics once at the project root and flows them through every command context, event payload, and reactor operation. `defineRegistry()` infers a mapped type from a readonly tuple so that document CRUD, events, and triggers are all narrowed per registry key. `TypedReactorClient<R>` narrows methods using pure TypeScript — no runtime wrapping needed. An `as any` anywhere in this chain silently defeats the entire system.

If TypeScript complains, the fix is almost always to tighten the type upstream — not to cast. If you genuinely cannot express a type, ask the user before reaching for `any`.

**No backward-compatibility shims.** There is no legacy consumer base. When a type, interface, or API shape needs to change, change it directly. Don't add re-exports, compatibility overloads, deprecated wrappers, or `// removed` comments. Update all call sites in the same commit.

---

## Diagnostics-First Debugging

ph-clint is a complex system with subtle interactions between codegen, config resolution, service lifecycle, event routing, reactor subscriptions, and agent orchestration. Almost nothing is obvious. Do not jump to conclusions.

**Confirm every hypothesis before changing code.** When something behaves unexpectedly:

1. **Add diagnostic log output** at the relevant points to observe actual values, execution order, and control flow.
2. **Run the code** and read the output. Confirm what is actually happening versus what you assume.
3. **Only then** make a targeted fix based on confirmed evidence.

Do not make speculative "yolo" changes. Changing code based on unconfirmed hypotheses is erosive — it has a real potential to fix one problem and create two larger ones. Side-effect bugs in a framework with this many interacting subsystems are difficult to trace after the fact.

When a fix is non-trivial, **commit the working diagnostics first** so you can revert cleanly if the fix introduces regressions.

---

## Sandbox Validation

The `sandbox/` directory at the repository root is the workspace for manual end-to-end validation. Use it to test the full user journey with the dev build of ph-clint-cli.

### Workflow

1. **Build the dev version** of ph-clint-cli (or use `pnpm dev` in `packages/ph-clint-cli/ph-clint-cli/`).
2. **Run the CLI** from `sandbox/` with --help — read the help text FIRST, scaffold a new project with `clint-project-init`
3. **Wire the generated project** to the dev build by setting `file:` dependencies in the generated `package.json` pointing to the local `packages/ph-clint/` and `packages/ph-clint-dev/` directories. Run `pnpm install` in the generated project.
4. **Configure the spec** according to the feature you're testing — enable Powerhouse, Mastra, routines, etc. as needed.
5. **Run the generated CLI** (`pnpm dev` or `pnpm start`) and exercise it: run commands, confirm the REPL works, verify agent responses, check service lifecycle.
6. **Use the framework's testability** — pass `RunOptions` with injected I/O to test programmatically where possible, rather than relying solely on manual observation.

The sandbox is not checked in (only `.gitkeep`). Treat it as ephemeral — create and destroy test projects freely.

---

## Known Issues

### Codegen Overwrites Tests

When working on Powerhouse reactor packages (e.g. via the Vetra MCP), the codegen pipeline may auto-trigger and overwrite test files. This is a known issue with the current codegen behavior.

**Mitigation:** Commit your reducer implementation and tests immediately after completing them — before any codegen trigger can run. If codegen does overwrite your tests, use `git checkout` or `git reset` to restore them from the last commit.

---

## What NOT to Do

- Don't add Powerhouse or Mastra imports to `core/`, `routine/`, `execution/`, `output/`, `interactive/`, or `cli/`. Those must stay integration-free.
- Don't create new definition patterns — use `defineCommand`, `defineCli`, `defineTrigger`, `defineService`, `define{Name}Integration` consistently.
- Don't over-abstract. If something isn't needed for a current feature, it probably isn't needed yet.
- Don't generate documentation files unless asked.
- Don't use `as any` or `as unknown as T` — fix the type upstream instead.
- Don't add backward-compatibility shims, re-exports, or deprecated wrappers — change call sites directly.
- Don't make speculative code changes — add diagnostics and confirm the hypothesis first.
