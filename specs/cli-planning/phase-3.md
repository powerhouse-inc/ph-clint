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
