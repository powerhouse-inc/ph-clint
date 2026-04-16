# ph-clint-cli — Project Info

## Context

We need a self-hosting CLI called **ph-clint-cli** (bin: `ph-clint`) that is itself built with ph-clint and that scaffolds, maintains, and publishes *other* ph-clint implementation projects. "Maintains" is the interesting word: Clint does not just generate files once; a running Clint instance serves a Connect UI where the user edits a **ClintProjectSpecification** document, and Clint's routine regenerates the implementation project in response to spec changes.

Two services run inside Clint:

- **Service A (always on)** — Clint's own Switchboard + Connect. Hosts the specification documents for the implementation project that Clint is currently pointed at.
- **Service B (conditional)** — runs the implementation project's own CLI (`pnpm dev`) as a long-running process. Available only if the impl project has at least one of: Mastra agent, agent routine, or Powerhouse **switchboard/connect** (plain reactor without Switchboard/Connect is headless and has nothing to serve).

The project is delivered in five sequenced phases, reflecting the user-stated order. The first phase (template) is reused in the second phase (Clint itself) — Clint is built *from* its own template.

---

## Design anchors (confirmed with user)

| Decision | Choice |
|---|---|
| Spec document location | `{impl-project}/.ph/ph-clint-cli/` — Clint's workdir *is* the impl project dir |
| Project layout | Flat by default; split into `{name}-cli/` + `{name}-app/` **only** when Powerhouse gets enabled. At that moment the current root contents move into `{name}-cli/`, `{name}-app/` is created, and a new root `package.json` with passthrough scripts is written |
| Root monorepo | **No** pnpm workspace (breaks nested `-app` pnpm builds). Plain root `package.json` with scripts that `cd` into subfolders and sequence: `build` = build-app → build-cli, `dev` = run cli, etc. |
| Codegen library | `@tmpl/core` (JSR `@jsr/tmpl__core`) + `ts-morph` + `prettier` — same stack as `@powerhousedao/codegen` |
| Template v1 scope | Example 05 (prompts/services/agents/skills) + Example 06 (cli/app split) merged into one template, with features toggleable |
| Spec document model | Decide during implementation — start with a single `ClintProjectSpec`, split only if forced |
| Bootstrap UX | `ph-clint init` wizard in an empty dir (interactive prompt), then Connect/routine takes over |
| Naming | Bare package name + bare bin (e.g. `myproj`). If the user's name contains `@scope/name`, split it; if not, ask whether to add a scope |
| Hand-edit policy | `gen/` = codegen-owned; `src/` = human-owned. `ts-morph` only touches well-defined registration points in `src/` (adding an import, appending to an array) |
| Service B | `ServiceExecutor` running `pnpm dev` in the impl project folder, with readiness detection via regex |
| Service B enablement | Mastra agent **or** routine **or** Powerhouse Switchboard/Connect |
| Skills scope | Clint ships skills for Clint itself. Impl projects start with an empty `prompts/` scaffold and author their own |

---

## Further Considerations

Open questions and unknowns to resolve during implementation. These are not blockers for starting, but each will need a concrete answer before the relevant phase ships.

### Codegen stack

1. **`@tmpl/core` via JSR in our ESM/TS setup.** `@powerhousedao/codegen` pulls `@jsr/tmpl__core` via a devDependency — does it just work with `pnpm` + `tsconfig moduleResolution: Node16`, or does it need a custom JSR import mapping? Verify before committing to it in Phase 3.
2. **Relationship to `@powerhousedao/codegen`.** Should Clint depend on `@powerhousedao/codegen` directly for emitting anything on the `ph-clint-app` side (document-model boilerplate etc.), or should we parallel it? Current plan parallels it to keep the dependency surface minimal; reconsider once `ph-clint-app` takes shape.
3. **`@clint:begin`/`@clint:end` markers vs existing codegen region conventions.** `@powerhousedao/codegen` already uses `ts-morph` on generated files; we should check whether it already has a marker/region convention we can adopt verbatim instead of inventing a new one.

### `ph init` integration

4. **How to invoke `ph init`.** Via `execa`? Spawn? Programmatic import from `@powerhousedao/ph-cli`? What flags support non-interactive mode (name, version pinning, skip prompts)? Need a dry run on a throwaway dir early in Phase 2 to document the exact incantation.
5. **Version pinning.** `ph init` generates against the currently-installed `@powerhousedao/*` versions. Clint's spec stores a `phVersion` field — do we install the matching `@powerhousedao/ph-cli` per-project (expensive) or accept that Clint re-generates against whatever `ph` is currently global (simpler, but drifts)?
6. **`ph init` output signalling.** Does it exit cleanly on success, and is there structured output we can parse (generated file list) or must we walk the directory after the fact?

### Routine and triggers

7. **Existing `defineTrigger` variants.** Phase 4 assumes a `condition` trigger subscribing to `powerhouse:document:changed` (example 06 pattern). Confirm whether there's already a `document-change` trigger shape in ph-clint, or whether Phase 4 needs to define one.
8. **Debouncing spec changes.** A burst of edits in the Connect editor shouldn't trigger N regenerations. Does the existing routine loop coalesce work items by id, or do we need an explicit debounce window in the trigger?

### Flat → split migration

9. **Moving `node_modules` during the split.** Plan says `node_modules` moves with the rest into `{name}-cli/`. Is this safe on Linux/macOS/Windows with pnpm symlinks (the `file:` protocol used by examples creates symlinks that may break on move)? Safer fallback: skip `node_modules` in the move and re-run `pnpm install` after. Needs a call.
10. **Preserving user work during migration.** If the user has uncommitted changes at migration time, we should refuse to migrate (or require `--force`) rather than silently move files. Design the safeguard explicitly.

### Bootstrap and repo layout

11. **Git init in empty target dir.** If the target is not already a git repo, should `ph-clint init` run `git init` + write `.gitignore`? Probably yes — confirm.
12. **Nesting convention `packages/ph-clint-cli/{ph-clint-cli,ph-clint-app}`.** The double-name nesting mirrors example 06 (`examples/06-connect-agent/{agent-cli,agent-app}`), but at the `packages/` level it reads oddly. Consider flattening to `packages/ph-clint-cli/` (cli) + `packages/ph-clint-app/` (app) as siblings, matching how the library itself lives at `packages/ph-clint/`.
13. **Published template vs bundled template.** Should `init` let the user pick between the bundled `packages/ph-clint-tpl` and a published `@powerhousedao/ph-clint-tpl` on npm (for remote bootstrapping)? Not needed for v1 but affects the generator's resolution logic.

### Agent integration

14. **Skill discovery across projects.** Clint's agent needs to know which skills exist in the impl project it's managing (for `add-feature` etc.). Does it inspect the impl project's `prompts/` dir directly, or does it read the spec doc? If the former, it needs filesystem access; if the latter, the spec doc must enumerate skills — reintroducing a field we deliberately deferred in Phase 3.
15. **Surfacing the impl Connect URL.** When Service B is running, there are now two Connect URLs in play (Clint's own + impl's). Where does the user see both — REPL welcome banner? A `/status` command? This affects Phase 4's Service B polish.

### Document model design (Phase 4)

16. **One document or multiple?** `ClintProjectSpec` is planned as a single document. But fields like "commands," "services," "skills" may grow into nested collections that feel more natural as separate documents referenced by PHID. Decide at model-design time based on editor ergonomics.
17. **Versioning the spec model.** If we publish `ph-clint-cli`, the `powerhouse/ph-clint-project` model version becomes a compatibility concern. Plan a migration policy before Phase 4 ships.

### Testing

18. **Integration test for the full regen loop.** Phase 5 verification mentions "an integration test that drives the full flow (spec change → regen → file assertion)." This likely needs a real Reactor + a real filesystem scratch dir — how do we keep it fast? Precedent from `examples/07-doc-agent` integration tests should inform this.
