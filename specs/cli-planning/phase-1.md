# Phase 1 — Build the template package `packages/ph-clint-tpl`

**Goal:** A template folder tree that is a superset of examples 05 and 06, with every optional feature present but togglable, ready to be consumed both (a) as the immediate starting point for Clint itself and (b) as the emission target of Clint's code generator.

The template has two sibling sub-folders from the start: `cli/` (the ph-clint CLI side) and `app/` (the optional Powerhouse reactor-package side). This mirrors the final split layout, so Clint never has to rename folders — only fill in `app/` when Powerhouse gets enabled.

## 1.1 Directory layout — `packages/ph-clint-tpl/cli/` (flat, pre-Powerhouse-split)

```
packages/ph-clint-tpl/cli/
├── package.json                       # name: "ph-clint-tpl-cli", private: true (not published)
├── README.md
├── tsconfig.json
├── jest.config.js
├── eslint.config.js
├── .gitignore
├── src/
│   ├── main.ts                        # #!/usr/bin/env node → cli.run(process.argv)
│   ├── cli.ts                         # defineCli({ ...feature blocks guarded by codegen markers... })
│   ├── config.ts                      # configSchema + secretsSchema (Zod)
│   ├── mastra/
│   │   └── index.ts                   # Mastra index re-exports for `mastra dev/build` (see example 05)
│   ├── agents/                        # (empty placeholder, populated when Mastra is on)
│   │   └── .gitkeep
│   ├── commands/                      # (empty placeholder)
│   │   └── .gitkeep
│   ├── services/                      # (empty placeholder)
│   │   └── .gitkeep
│   └── triggers/                      # (empty placeholder)
│       └── .gitkeep
├── prompts/                           # authoring source for skills (like example 05)
│   ├── agent-profiles/
│   │   └── AgentBase.md               # minimal base profile (placeholder content)
│   ├── skills-tpl/                    # empty; user adds their own
│   └── skills-ext/                    # empty; user drops pre-built skills here
├── scripts/
│   └── build-skills.ts                # tsx script invoking ph-clint-dev's buildSkills
├── gen/                               # codegen-managed; built at build:skills time (gitignored)
├── tests/                             # empty placeholder for user's tests
└── dist/                              # tsc output (gitignored)
```

**`cli/package.json` scripts (flat mode):**
```json
{
  "build:skills": "tsx scripts/build-skills.ts",
  "build": "pnpm build:skills && tsc",
  "dev": "tsx src/main.ts",
  "start": "node dist/main.js",
  "test": "NODE_OPTIONS='--experimental-vm-modules' jest --detectOpenHandles",
  "lint": "eslint src",
  "mastra:dev": "mastra dev",
  "mastra:build": "mastra build",
  "mastra:start": "mastra start",
  "publish:npm": "pnpm build && pnpm publish --no-git-checks"
}
```
`mastra:*` scripts mirror example 05 so the Mastra Studio/dev-server is reachable without extra setup whenever Mastra is on.

## 1.2 Directory layout (after Powerhouse is enabled — split)

When Clint's generator detects that the user enabled Powerhouse, it performs a one-time migration:
1. Move every file from `{root}/` to `{root}/{name}-cli/` (except `.git`, `.ph`, `README.md`). `node_modules` moves with the rest — this is a multi-project repo, not a monorepo, so the CLI's node_modules belongs alongside its package.json.
2. Scaffold `{root}/{name}-app/` by running `ph init` there (see 1.3).
3. Write a new **root** `package.json` with **passthrough scripts** (no workspaces).
4. Update `{name}-cli/package.json` to depend on `{name}-app` via `"file:../{name}-app"`.
5. Update `{name}-cli/src/cli.ts` to add `configureReactor(...)` with `connect.workdir` pointing to the sibling app.

**New root `package.json` after split (no workspaces):**
```json
{
  "name": "{name}",
  "private": true,
  "scripts": {
    "install": "cd {name}-app && pnpm install && cd ../{name}-cli && pnpm install",
    "build": "cd {name}-app && pnpm build && cd ../{name}-cli && pnpm build",
    "dev": "cd {name}-cli && pnpm dev",
    "start": "cd {name}-cli && pnpm start",
    "test": "cd {name}-app && pnpm test && cd ../{name}-cli && pnpm test",
    "lint": "cd {name}-cli && pnpm lint",
    "app:dev": "cd {name}-app && pnpm dev",
    "cli:dev": "cd {name}-cli && pnpm dev"
  }
}
```
No `pnpm-workspace.yaml` (deliberately — avoids pnpm monorepo mode interfering with `{name}-app`'s own `pnpm build`). Root script names are uniformly verb-only (`install`, `build`, `test`, …) for consistency.

## 1.3 Second template sub-tree: `packages/ph-clint-tpl/app/`

**Important:** the `app/` template is intentionally near-empty. The standard Powerhouse reactor-package layout (document-models/, editors/, powerhouse.config.json, manifest, exports, vite config, etc.) must be materialized at runtime by running **`ph init`** — Powerhouse's own scaffolder, which is the source of truth and tracks every `@powerhousedao/*` release. `ph-cli` is a hard prerequisite of ph-clint usage. We do not want to hand-maintain a parallel copy of the reactor-package layout in our template — it would drift.

```
packages/ph-clint-tpl/app/
├── .gitkeep                   # placeholder so the folder exists in git
└── patches/                   # (future) small ph-clint-specific overrides applied after `ph init`
    └── .gitkeep
```

The folder exists now so that as soon as we discover ph-clint-specific needs (an extra export in `index.ts`, a custom processor stub, a `.ph-clint.json` config, …) we have a stable place to put them. But for Phase 1 the folder is empty.

At project-generation time, Clint's generator:
1. Ensures `ph` is on `PATH` (`checkCommand('ph')`).
2. Creates `{root}/{name}-app/` and runs `ph init` inside it (non-interactive flags where possible), pinning the Powerhouse version from the spec.
3. Applies any files from `packages/ph-clint-tpl/app/patches/` on top of the `ph init` output.

This keeps Powerhouse's scaffolder authoritative while letting us layer ph-clint-specific additions on top.

## 1.4 Template markers (for idempotent regeneration)

In files Clint will regenerate incrementally, use comment markers so `ts-morph` can find regions:
```ts
// src/cli.ts
export const cli = defineCli({
  // @clint:begin commands
  commands: [/* list injected by codegen */],
  // @clint:end commands
  // @clint:begin services
  services: [/* list injected by codegen */],
  // @clint:end services
  // ...
});
```
`ts-morph` locates these anchors and replaces only the bracketed content, leaving everything else user-editable.

## 1.5 Deliverables of Phase 1

- `packages/ph-clint-tpl/` complete and typechecked with `tsc` (as a regular package, not published)
- `pnpm test` in the template passes (empty test suite is fine initially)
- README.md documenting the three feature toggles (Powerhouse, Mastra, routine) and the split trigger
