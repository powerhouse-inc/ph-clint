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

### Remaining
- [ ] **Step 14**: Verify examples still work with `file:` deps pointing into workspace packages
- [ ] **Step 15**: Update `AGENTS.md` to reflect new workspace structure
- [ ] **Step 16**: Test Docker entrypoint with pnpm 11 (`pnpm add -g` still works in v11)

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
