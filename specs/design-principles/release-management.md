# Release Management

How ph-clint packages are versioned, built, and published.

## Lockstep Versioning

All four framework packages share a single version number, managed by one publish group in `packages/publish.config.ts`:

- `@powerhousedao/ph-clint` — the framework library
- `@powerhousedao/ph-clint-dev` — build tools, publish pipeline, project layout detection
- `@powerhousedao/ph-clint-app` — Powerhouse reactor package (document models)
- `@powerhousedao/ph-clint-cli` — project scaffolding CLI

The lockstep version is the single source of truth. Individual package versions are never set independently — the publish pipeline stamps all four packages with the same version on every release.

### Why lockstep

These packages have tight interdependencies (`ph-clint-cli` depends on all three others). Independent versioning would create a fragile publish ordering problem: the CLI group would depend on the library group as an external dependency, requiring sequential publishes with registry propagation in between. Lockstep eliminates this: all packages are built, validated, and published together.

## Release Channels

Three channels, ordered by semver precedence:

| Channel | Version shape | npm dist-tag | Audience |
|---------|--------------|--------------|----------|
| `dev` | `0.1.0-dev.5` | `dev` | Framework developers |
| `staging` | `0.1.0-staging.2` | `staging` | Integration testing |
| `production` | `0.1.0` | `latest` | Implementation projects |

Semver naturally orders these: `dev.N` < `staging.N` < release. This means a caret range starting at `dev.0` will accept staging and production upgrades — the expected promotion path.

## Scaffolded Project Dependencies

When `ph-clint-cli` scaffolds a new implementation project, the generated `package.json` must reference the correct version range for `@powerhousedao/ph-clint` and `@powerhousedao/ph-clint-dev`. The range is derived at scaffold time from the running CLI's own version:

| CLI version | Generated range | Resolves to |
|-------------|----------------|-------------|
| `0.1.0` | `^0.1.0` | Stable only — prereleases excluded |
| `0.1.0-staging.2` | `^0.1.0-staging.0` | Staging + stable |
| `0.1.0-dev.4` | `^0.1.0-dev.0` | Dev + staging + stable |

This ensures scaffolded projects stay on the same channel as the CLI that created them, while naturally upgrading through the promotion path.

### Implementation

`readPackageInfo(import.meta.url)` (exported from `@powerhousedao/ph-clint`) reads the project's `package.json` and returns `{ root, name, version }`. The codegen builder calls `phClintRange(CLI_VERSION)` to derive the semver range from the running CLI version. No hardcoded version strings anywhere.

## Package Identity Convention

Implementation projects derive their CLI identity from `package.json` at runtime via `readPackageInfo()`:

```ts
import { readPackageInfo } from '@powerhousedao/ph-clint';

const pkg = readPackageInfo(import.meta.url);

export const CLI_ROOT = pkg.root;
export const CLI_NAME = pkg.name.replace(/-cli$/, '');
export const CLI_VERSION = pkg.version;
```

- `pkg.root` — project root directory, derived from the calling file's location
- `pkg.name` — package name with `@scope/` stripped (scope is never part of a CLI name)
- The `-cli` suffix strip is explicit in the implementation, not hidden in the helper — the convention is visible and overridable
- If the project uses a custom bin name (`spec.bin`), the codegen hardcodes `CLI_NAME` instead

This eliminates hardcoded versions and names. The `package.json` is the single source of truth for identity.

## Build and Publish Entry Point

All orchestration runs from `packages/`:

```sh
cd packages
pnpm install    # all packages in dependency order
pnpm build      # all packages in dependency order
pnpm test       # all packages
pnpm publish:dev
```

The build order follows the `file:` dependency DAG:

1. `ph-clint` (no deps)
2. `ph-clint-dev` (depends on ph-clint)
3. `ph-clint-app` (independent of siblings)
4. `ph-clint-cli` (depends on all three)

Publishing is not exposed from individual packages. The `packages/package.json` is the only place with publish scripts — this prevents accidentally publishing a single package out of lockstep.

## Publish Pipeline Decomposition

The publish pipeline (`ph-clint-dev/src/publish/`) is decomposed into three composable phases:

1. **`resolvePublishPlan()`** — loads config, validates, computes version. Returns a `PublishPlan` describing what will be published, without side effects.
2. **`buildPackages(plan)`** — builds all packages in the plan.
3. **`publishPackages(plan)`** — prepares, validates, publishes, and optionally verifies.

`publish()` is a thin wrapper composing all three. The decomposition lets higher-level tools (like `clint-project-publish`) show previews, skip builds, or add interactive confirmation between phases.

## Post-Publish Verification

After each package is published, the pipeline verifies it appeared on the registry using exponential backoff (1s, 2s, 4s, 8s, 16s). This accounts for npm's eventual consistency — the registry is reliable pre-publish (for duplicate detection) but not immediately consistent post-publish.

The `--no-verify` flag skips verification for CI environments where propagation delay is acceptable.

### Pre-publish version check

`verifyVersionOnRegistry()` checks whether a specific version exists by running `npm view pkg@version version` and comparing stdout to the expected version string. It does **not** rely on exit codes — `npm view` returns exit 0 if the *package* exists even when the specific *version* doesn't. The stdout check is the only reliable signal.

## `file:` Dependency Handling

Intra-group dependencies use `file:` protocol during development (pnpm creates symlinks). The publish pipeline automatically rewrites these:

- Intra-group deps → `^{lockstep version}`
- External `file:` deps → `^{version from target's package.json}`

After publish, `file:` paths are restored. The rewritten versions persist in the published tarballs only.

**Important**: When `pnpm build` produces new files in `dist/` (not just changes to existing ones), consumers must run `pnpm install` to pick them up. pnpm's `file:` protocol hardlinks existing files but doesn't discover new ones without a reinstall. The `packages/` root `pnpm install` script handles this for all packages in dependency order.
