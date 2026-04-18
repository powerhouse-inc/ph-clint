# Phase 3 — Base implementation: `ClintProjectSpec` → code generator

**Goal:** Give Clint enough code to (a) collect a project specification interactively via the init wizard and (b) emit a full template-derived project from that specification. No document model yet — the spec lives as an in-memory TypeScript object + a JSON file at `{impl-project}/.ph/ph-clint-cli/project-spec.json`.

## 3.1 The `ClintProjectSpec` type (plain TypeScript, Zod-validated)

Location: `packages/ph-clint-cli/ph-clint-cli/src/spec/types.ts`

Initial shape is deliberately minimal — just identity + the three feature toggles. Richer structure (services, skills, agents, triggers, document-models) gets added in later phases as each generator step actually needs it. We avoid pre-committing schema surface.

```ts
export const clintProjectSpecSchema = z.object({
  name: z.string(),                        // bare name, no scope
  scope: z.string().optional(),            // @org if present, without '@'
  version: z.string().default('0.1.0'),
  description: z.string().default(''),
  bin: z.string().optional(),              // defaults to name
  features: z.object({
    powerhouse: z.object({
      enabled: z.boolean().default(false),
      switchboard: z.boolean().default(true),
      connect: z.boolean().default(true),
    }).default({}),
    mastra: z.object({
      enabled: z.boolean().default(false),
    }).default({}),
    routine: z.object({
      enabled: z.boolean().default(false),
    }).default({}),
  }).default({}),
});

export type ClintProjectSpec = z.infer<typeof clintProjectSpecSchema>;
```

Later phases will extend this schema in place with fields they actually consume (e.g. Phase 5's skills management may add an agents/skills list; Phase 4 may add document-model declarations). Do not add them preemptively.

## 3.2 The code generator

Location: `packages/ph-clint-cli/ph-clint-cli/src/codegen/`

Uses `@tmpl/core` + `ts-morph` + `prettier`. Mirrors the structure of `@powerhousedao/codegen`:

```
src/codegen/
├── index.ts                 # main entry: generateProject(spec, targetDir, mode)
├── templates/
│   ├── package.json.ts      # json`{...}`.raw — flat or split variant
│   ├── cli.ts.ts            # ts`...`.raw — defineCli call with @clint:begin markers
│   ├── config.ts.ts
│   ├── main.ts.ts
│   ├── tsconfig.json.ts
│   ├── jest.config.js.ts
│   ├── agent-base.md.ts
│   ├── readme.md.ts
│   ├── gitignore.ts
│   └── app/                 # powerhouse-app templates (parallel to @powerhousedao/codegen boilerplate)
│       ├── package.json.ts
│       ├── powerhouse.config.json.ts
│       ├── powerhouse.manifest.json.ts
│       ├── index.ts.ts
│       ├── main.tsx.ts
│       └── ...
├── file-builders/
│   ├── package-json.ts      # buildCliPackageJson(spec) composing name, scope, bin, deps
│   ├── cli-ts.ts            # buildCliTs(spec) — renders cli.ts with enabled features
│   ├── root-package-json.ts # buildRootPackageJson(spec) — split-mode root scripts
│   └── index.ts
├── patch/
│   ├── index.ts             # patchFile(path, mutators) — loads via ts-morph, applies, formats
│   ├── add-command.ts       # adds import + appends to commands array in cli.ts (within markers)
│   ├── add-service.ts
│   └── add-trigger.ts
├── migrate/
│   └── enable-powerhouse.ts # one-shot: flat → split migration
└── write.ts                 # writeFileEnsuringDir + prettier + prettierDiff detection
```

## 3.3 The init wizard

Command: `ph-clint init` (a new `defineCommand`) registered in `ph-clint-cli/src/cli.ts`.

Location: `packages/ph-clint-cli/ph-clint-cli/src/commands/init.ts`

Behavior:
1. Resolve the target dir. Default is `.` (current directory). Users can also pass a positional `--dir <path>`. When the target is `.` we still require it to be empty (or `--force`) so existing work is never overwritten.
2. Assert the target dir is empty (or `--force`).
3. Interactive prompts via the existing ph-clint parameter-prompting system (Feature 7):
   - `name` — package name. If it contains `@scope/name`, parse; else ask follow-up `scope` question.
   - `description` — short project description.
   - `enablePowerhouse` — boolean.
   - `enableMastra` — boolean.
   - `enableRoutine` — boolean (forced true if Mastra is on and user confirms).
4. Assemble a `ClintProjectSpec`; validate with Zod.
5. Write `{dir}/.ph/ph-clint-cli/project-spec.json`.
6. Invoke the code generator in **create** mode to emit the full project tree.
7. Run `pnpm install` in the generated project(s).
8. Print next steps (`cd {name} && pnpm dev`, or `ph-clint` to open Connect for spec editing).

## 3.4 Delta mode — re-running the generator

When the generator is invoked on an existing project (spec exists):
- `gen/` folders are **wiped and rewritten**.
- `src/cli.ts` is patched via `ts-morph` between `@clint:begin/@clint:end` markers.
- Non-`gen/` files that already exist are **not overwritten** unless they match the previous template exactly (detected by hashing; a diffed hash stops the write and warns the user).
- When the spec flips `features.powerhouse.enabled` from false to true, the `enable-powerhouse` migration runs first (move root contents into `{name}-cli/`, scaffold `{name}-app/`, rewrite root `package.json`).

## 3.5 Deliverables of Phase 3

- `ph-clint init` in an empty dir produces a working project for each of the 8 toggle combinations (2³ features).
- Running `pnpm dev` in the generated project launches a working CLI.
- Re-running the generator with an unchanged spec is a no-op.
- Flipping a feature flag on a second pass correctly migrates (split happens, Mastra agent wiring appears, routine trigger file appears).
- Unit tests cover each file-builder and each ts-morph patch function.

## 3.6 Progress (2026-04-16) — foundation landed

Scope delivered in this pass: **3.1 + 3.2 + 3.3 in create-mode only**, deliberately deferring 3.4 and the flat→split migration. Two design decisions diverged from the original plan and are documented here.

### Shipped

- **3.1 `ClintProjectSpec` + Zod schema** — `packages/ph-clint-cli/ph-clint-cli/src/spec/types.ts` with identity fields, the three feature toggles, and helpers `getPackageName`, `getBinName`, `getCliFolderName`, `getAppFolderName`. Persistence at `src/spec/file.ts` (`readProjectSpec` / `writeProjectSpec` / `getSpecPath`).
- **3.2 Code generator (create mode)** — `src/codegen/` with `generateProject(spec, targetDir)`, `write.ts` helpers, and one builder per emitted file under `src/codegen/builders/`. Covers `package.json` (CLI side + split-layout root), `cli.ts`, `config.ts`, `main.ts`, `tsconfig.json`, `jest.config.js`, `eslint.config.js`, `.gitignore`, `README.md`, `src/mastra/index.ts`, `scripts/build-skills.ts`, `prompts/agent-profiles/AgentBase.md`, `src/agents/agent.ts`, plus `.gitkeep` placeholders and an `app/README.md`. All `@clint:begin/@clint:end` markers present so 3.4 can patch them later.
- **3.3 Init wizard** — `src/commands/init.ts`, registered in `src/cli.ts`. Parses `@scope/name`, forces `routine` on when `mastra` is on, validates via Zod, writes the spec, invokes the generator, prints next-steps. Emptiness guard (`.git`, `.DS_Store`, `.ph` are ignorable) with `--force` escape hatch.
- **Tests** — 51 passing (spec schema, each builder in isolation, all 8 feature-toggle combinations end-to-end on tmpdirs, `buildSpec` logic in init). Generated flat-layout and Mastra-enabled projects both pass `tsc --noEmit` when linked against the parent `node_modules`.

### Decisions deviating from the spec

- **Templating: plain TS template literals, not `@tmpl/core`** (resolves Further Consideration #1). The JSR dependency was flagged as "verify before committing" and the ergonomic win is marginal at this scale — each builder is a short `lines.push(...)` or `JSON.stringify(...)` call. `@tmpl/core` can be adopted later if a builder grows complex enough to need it.
- **Mastra Studio re-export is a placeholder even when `mastra.enabled`** — the generator emits a demo `AgentProvider` shim rather than a real `@mastra/core` `Agent`, so `src/mastra/index.ts` is `export {};` with a comment pointing to where a real Mastra instance belongs. Re-exporting from the shim would not typecheck. A later phase that emits a real `Agent` will flip this.
- **Zod 4 default cascading** — `.default({})` on a parent object does not re-trigger nested `.default(...)` leaves in Zod 4. `clintProjectSpecSchema` spells out the full feature-tree default explicitly (`DEFAULT_POWERHOUSE`, `DEFAULT_MASTRA`, `DEFAULT_ROUTINE`).

### Deferred to later phases

- **Prettier pass** — no formatter is run over emitted files. Output is hand-formatted in the builders.
- **`pnpm dev` smoke test on generated projects** — blocked on `ph-clint` not being published; generated `package.json`s depend on `ph-clint@^0.1.0` from npm. Typechecking the output with a linked `node_modules` is the closest substitute available today.
- **Surgical `ts-morph` mutators** (`add-command`, `add-service`, `add-trigger` from §3.2) — not needed for the spec→codegen loop; deferred until a command-driven feature explicitly wants to mutate cli.ts without re-running the full builder.

## 3.7 Progress (2026-04-16) — delta mode, migration, and post-generation scaffolding

Scope delivered in this pass: **3.4 delta mode + flat→split migration + `ph init`/`pnpm install` automation**. Phase 3 is now functionally complete except for the two deferred items above.

### Shipped

- **Delta / update mode** — `generateProject` now auto-detects create vs update from the persisted spec, with explicit `mode: 'create' | 'update' | 'auto'` override. Update mode:
  - Splices fresh marker-region content into `src/cli.ts` via plain-text region replacement (`src/codegen/markers.ts`). User code outside markers is preserved verbatim.
  - For non-marker files, uses a hash-protected overwrite: `.ph/ph-clint-cli/.hashes.json` records the sha256 of every written file; on re-run, a matching on-disk hash proves the file is pristine (safe to overwrite) and a mismatch skips with a warning (or overwrites under `--force`).
  - Removes files the new spec no longer emits when their stored hash still matches; warns and keeps user-modified abandoned files.
  - No `ts-morph` dependency — the marker regions are comment-delimited, so regex splicing handles them cleanly. `ts-morph` remains available for future surgical mutators.
- **Flat → split migration** — `src/codegen/migrate/flat-to-split.ts` fires automatically when `features.powerhouse.enabled` flips `false` → `true` during update. Moves all top-level entries (except `.git`, `.ph`, `README.md`, `node_modules`, and the target `-cli`/`-app` folders) into `{name}-cli/`, then rekeys the stored hashes so the subsequent update writes land on the correct paths. `node_modules` is deliberately left at the root per Further Consideration #9 — pnpm `file:` symlinks do not survive cross-dir rename; callers re-run `pnpm install` after. Uncommitted git changes in the target dir abort the migration unless `--force` (Consideration #10).
- **`ph init` + `pnpm install` automation** — `src/codegen/scaffold.ts` wraps `node:child_process.spawn` with stdio-inherited subprocesses so users can handle any prompts. Both steps are opt-out (`--skip-ph-init`, `--skip-install`), degrade gracefully when the binary isn't on PATH (warn + continue), and are wired into the init command. Split layouts run install in both `{name}-app/` and `{name}-cli/`; flat layouts run it at the project root.
- **`regen` command** — `ph-clint regen` (in `src/commands/regen.ts`, registered in `src/cli.ts`) explicitly runs update mode against the current workdir, surfaces skipped files via stdout/log, and includes migration status in its structured `data` payload.
- **Tests** — 92 passing (was 51). New suites:
  - `tests/codegen/hashes.test.ts` — hash record round-trips.
  - `tests/codegen/markers.test.ts` — region parsing/splicing, mismatched/unterminated markers.
  - `tests/codegen/update-mode.test.ts` — no-op re-run, marker patching preserves user code outside markers, hash-protected skip, `--force` override, file removal on feature-flip, user-edited abandoned files kept.
  - `tests/codegen/migrate.test.ts` — flat→split end-to-end, hash rekeying, git-dirty guard, `node_modules` preservation.
  - `tests/codegen/scaffold.test.ts` — graceful degradation when `ph`/`pnpm` missing.
  - `tests/commands/init.test.ts` — execute path with skip flags.
  - `tests/commands/regen.test.ts` — no-spec error, no-op, user-edited file surfaces a warning.
