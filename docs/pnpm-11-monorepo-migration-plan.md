# pnpm 11 Monorepo Migration Plan

## Execution Status

### Completed

- [x] **Step 1**: Update `packageManager` to `pnpm@11.0.8`
- [x] **Step 2**: Create `packages/pnpm-workspace.yaml` (workspace root = `packages/`)
  - Workspace members: 5 packages (relative to `packages/`)
  - Consolidated `overrides` from per-package `package.json#pnpm` fields
  - Consolidated `allowBuilds` from per-package `pnpm-workspace.yaml` files
  - pnpm auto-discovered additional build deps: `@datadog/pprof`, `@parcel/watcher`, `@prisma/*`, `sqlite3`
- [x] **Step 3**: Create root `.npmrc` with `@jsr:registry=https://npm.jsr.io`, delete per-package copies
- [x] **Step 4**: Delete per-package `pnpm-workspace.yaml` files (ph-clint-dev, ph-clint-cli)
- [x] **Step 5**: Remove `pnpm.overrides` from `ph-clint-cli/package.json` and `clint-common/package.json`
- [x] **Step 6**: Convert `file:` → `workspace:*` in all intra-workspace deps
  - ph-clint-dev: `ph-clint`
  - ph-clint-cli: `ph-clint`, `ph-clint-dev`, `ph-clint-app`
  - clint-common: `ph-clint` (devDependencies + peerDependencies)
- [x] **Step 7**: Delete all per-package `pnpm-lock.yaml` files + old root lockfile
- [x] **Step 8**: Update `packages/package.json` scripts: `--prefix` chains → `pnpm -r` workspace commands
- [x] **Step 9**: `pnpm install` — unified lockfile generated (2590 packages, 6 workspace projects)
- [x] **Step 10**: Bottom-up build verification
  - Level 0: `ph-clint` (tsc) — OK
  - Level 0: `ph-clint-app` (ph-cli build) — OK
  - Level 1: `ph-clint-dev` (tsc) — OK
  - Level 1: `clint-common` (ph-cli build + tsc) — OK
  - Level 2: `ph-clint-cli` (build:skills + tsc) — OK
  - Full `pnpm -r run build` — OK, correct topological order
- [x] **Step 11**: Bottom-up test verification
  - `ph-clint`: 52/52 suites, 1133/1136 tests pass (coverage thresholds slightly under — pre-existing)
  - `ph-clint-app`: 10/10 suites, 147/147 tests pass
  - `ph-clint-dev`: 25/25 suites, 258/258 tests pass
  - `clint-common`: 6/7 suites, 29/29 tests pass (1 suite fails on missing fixture file — pre-existing)
  - `ph-clint-cli`: 6/6 suites, 36/36 tests pass
- [x] **Step 12**: Update `ph-publish` to handle `workspace:` protocol
  - `types.ts`: Added `'peerDependencies'` to `FileDep.field` union
  - `deps.ts`: Extended `analyzeFileDeps` to detect `workspace:` specifiers and scan `peerDependencies`
  - Tests: Added 4 new tests (workspace:*, workspace:^, peerDependencies, rewrite+restore round-trip)
  - 25/25 suites, 262/262 tests pass
- [x] **Step 13**: Verify `publish:dev --dry-run` — all 5 packages validated, workspace: deps rewritten to ^version, restored after dry-run
- [x] **Step 14**: Publish `0.1.0-dev.62` — all 5 packages published successfully
- [x] **Step 15**: Update `AGENTS.md` to reflect new workspace structure
- [x] **Step 16**: Document pnpm 11 global install `allowBuilds` prompt issue (`specs/issues/pnpm-11-global-install-allowBuilds-prompt.md`)
- [x] **Committed**: `e28de34` — all migration changes + version bump to 0.1.0-dev.62

- [x] **Step 17**: Investigate version mismatch in codegen output
  - Symptom: globally installed `ph-clint@0.1.0-dev.62` generates deps pointing to `0.1.0-dev.61`
  - **Root cause**: NOT a codegen bug. The global install never actually updated.
    - pnpm 11 changed the global store layout: shims moved from `$PNPM_HOME/` to `$PNPM_HOME/bin/`
    - Old v10 shims at `$PNPM_HOME/ph-clint` were not cleaned up during migration
    - The stale shim still pointed to `global/5/.../0.1.0-dev.61`, shadowing the new install at `global/v11/.../0.1.0-dev.62`
    - `$PNPM_HOME` (without `/bin`) was still in PATH from the pre-v11 shell session
  - This is a known pnpm bug cluster: [#11464](https://github.com/pnpm/pnpm/issues/11464), [#10517](https://github.com/pnpm/pnpm/issues/10517), [#10883](https://github.com/pnpm/pnpm/issues/10883)
  - `readPackageInfo()` in `config.ts` reads the version from `package.json` at runtime (not compile time) — the mechanism is correct, it was just reading the wrong package
- [x] **Step 18**: Create install script (`scripts/install-cli.sh`)
  - Detects pnpm version, offers upgrade from v10 → v11 with `pnpm self-update` + `pnpm setup`
  - Detects and lists stale v10 shims, asks user confirmation before deleting
  - Installs via `npm install -g` (avoids `allowBuilds` prompt entirely)
  - Verifies binary location, version, and `--help` smoke test
  - Dry-run by default (`--run` flag to execute)
  - Platform-aware: macOS (`~/Library/pnpm`, `~/.zshrc`) vs Linux (`~/.local/share/pnpm`, `~/.bashrc`)
- [x] **Step 19**: Widen `@electric-sql/pglite` peer dep range in `ph-clint`
  - Was `^0.2.0`, actual dep is `0.3.15` — caused npm warnings on global install
  - Widened to `>=0.2.0` (only uses `new PGlite(path)`, stable across versions)
- [x] **Step 20**: Updated issue spec with stale shim migration findings

### Remaining

- [ ] **Step 21**: Sandbox smoke test (3 configurations: minimal, mastra, connect+chat)
- [ ] **Step 22**: Verify examples still work with `file:` deps pointing into workspace packages
- [ ] **Step 23**: Test Docker entrypoint with pnpm 11 (low risk — `pnpm add -g` works in v11)

### Pre-existing Issues (not caused by migration)

- `ph-clint` coverage thresholds slightly under target (branches 85.4% vs 85.5%)
- `clint-common` test `extract-attachments.test.js` fails (fixture `prometheus.png` not found in `dist/chat/`)

---

## Architecture After Migration

### Workspace Root: `packages/`

```
ph-clint-repo/                        # git root
├── package.json                       # minimal: packageManager, engines
├── .npmrc                             # @jsr:registry
├── packages/                          # WORKSPACE ROOT
│   ├── pnpm-workspace.yaml            # workspace config, overrides, allowBuilds
│   ├── package.json                   # workspace scripts (build, test, publish)
│   ├── pnpm-lock.yaml                 # SINGLE unified lockfile
│   ├── ph-clint/                      # @powerhousedao/ph-clint
│   ├── ph-clint-dev/                  # @powerhousedao/ph-clint-dev
│   ├── ph-clint-cli/
│   │   ├── ph-clint-app/              # @powerhousedao/ph-clint-app
│   │   └── ph-clint-cli/              # @powerhousedao/ph-clint-cli
│   └── clint-common/                  # @powerhousedao/clint-common
├── examples/                          # OUTSIDE workspace (file: deps)
├── prototypes/                        # OUTSIDE workspace
├── clis/                              # OUTSIDE workspace (published deps)
├── sandbox/                           # OUTSIDE workspace (generated projects)
└── docker/                            # Container runtime
```

### Key Commands (run from `packages/`)

| Command | Effect |
|---------|--------|
| `pnpm install` | Install all workspace packages (one lockfile) |
| `pnpm run build` | Build all packages in topological order |
| `pnpm run test` | Test all packages |
| `pnpm --filter '@powerhousedao/ph-clint' run test` | Test one package |
| `pnpm -r --parallel run dev` | Watch mode for all packages |
| `pnpm run publish:dev` | Publish all packages to dev channel |

### Inter-package Dependencies

```
workspace:* protocol (resolved as symlinks locally, ^version when published)

ph-clint ←── ph-clint-dev
         ←── ph-clint-cli
         ←── clint-common (peer + dev)

ph-clint-dev ←── ph-clint-cli

ph-clint-app ←── ph-clint-cli
```
