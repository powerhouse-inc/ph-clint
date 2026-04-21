# ph-clint packages

Four framework packages published as a single lockstep group under `@powerhousedao/`.

| Package | Description |
|---------|-------------|
| [`ph-clint/`](ph-clint/) | The framework library |
| [`ph-clint-dev/`](ph-clint-dev/) | Build-time tools: skill compilation, agent profiles, publish pipeline, project layout detection |
| [`ph-clint-cli/ph-clint-app/`](ph-clint-cli/ph-clint-app/) | Powerhouse reactor package for ph-clint-cli (document models) |
| [`ph-clint-cli/ph-clint-cli/`](ph-clint-cli/ph-clint-cli/) | Project scaffolding CLI (`clint-project-init`, `clint-project-regen`, `clint-project-build`, `clint-project-publish`) |

## Install, Build, and Test

From this directory (`packages/`):

```sh
pnpm install      # install all packages in dependency order
pnpm build        # build all packages in dependency order
pnpm test         # test all packages
```

Or work with individual packages:

```sh
cd ph-clint
pnpm install
pnpm build
pnpm test
```

## Development Workflow

After changing library source in `ph-clint/`:

1. **Rebuild the library**: `pnpm build` in `ph-clint/`
2. **If the build produced new files** in `dist/` (not just changes to existing ones), run `pnpm install` in consumer packages to pick them up. Symptoms of a stale install: "Cannot find module" errors for files that exist in the library's `dist/`.

## Publishing

All four packages are published in a single lockstep group via `ph-publish`:

```sh
pnpm publish:dev          # dev prerelease (e.g. 0.1.0-dev.5)
pnpm publish:staging      # staging prerelease
pnpm publish:production   # production release

# Extra flags go directly (no -- needed with pnpm)
pnpm publish:dev --dry-run
pnpm publish:dev --verbose
pnpm publish:dev --no-verify   # skip post-publish registry verification
```

Config: [`publish.config.ts`](publish.config.ts).
