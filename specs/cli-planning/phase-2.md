# Phase 2 — Scaffold `packages/ph-clint-cli` from the template

**Goal:** Bring up ph-clint-cli itself by copying `ph-clint-tpl` and enabling Mastra + routine + Powerhouse (all three). Clint is a ph-clint project that uses ph-clint.

## 2.1 Steps

1. **Copy** `packages/ph-clint-tpl/cli/` → `packages/ph-clint-cli/ph-clint-cli/` and `packages/ph-clint-tpl/app/` → `packages/ph-clint-cli/ph-clint-app/` (one-time bootstrap; not via the yet-unwritten generator). This gives us the same split layout Clint will later automate for user projects.
2. **Run `ph init` inside `packages/ph-clint-cli/ph-clint-app/`** to generate the standard Powerhouse reactor-package layout (document-models/, editors/, powerhouse.config.json, powerhouse.manifest.json, index.ts, main.tsx, tsconfig, vite config, …) against the latest Powerhouse version we want to pin on. Commit the output. Then apply any files from `ph-clint-tpl/app/patches/` on top.
3. **Rename** package to `ph-clint-cli` (no scope — can be scoped later if we publish to `@powerhousedao/ph-clint-cli`), bin to `ph-clint`.
4. **Enable** Mastra, routine, Powerhouse in `ph-clint-cli/src/cli.ts` — `configureReactor` + `configureAgent`.
5. **Wire** `ph-clint-app` to point at `ph-clint-cli/`'s Connect at default port 3001 (to avoid collision with user projects' port 3000). Set Switchboard port 4802.
6. **Add** first-pass config schema with fields for:
   - `switchboardPort` (default 4802)
   - `connectPort` (default 3001)
   - `devServicePort` (for Service B — the impl project's `pnpm dev`)
   - `apiKey` / `model` (Mastra)
   - `phVersion` (pinned Powerhouse version for codegen output)

## 2.2 Deliverables of Phase 2

- `pnpm dev` in `packages/ph-clint-cli/ph-clint-cli/` boots Clint, starts Switchboard on 4802 + Connect on 3001
- Connect UI opens and shows an empty drive (no document models registered yet — that comes in Phase 4)
- Running `ph-clint --help` shows the ph-clint default commands (help, config, services, etc.) but no custom commands yet
- Passes the existing ph-clint test conventions (Jest, `pnpm test`)
