# ph-clint-dev — Detailed Architecture

> Back to [architecture overview](./architecture.md)

## Introduction
- What ph-clint-dev is: build-time tooling companion to ph-clint
- Handles asset compilation (skills, agent profiles) and multi-package publishing
- Who this is for (framework developers building and releasing ph-clint-based CLIs)

## Package Identity
- npm: `@powerhousedao/ph-clint-dev`
- Three entry points: `.` (build-skills), `./publish`, `./manifest`
- Three CLI binaries: `build-skills`, `ph-publish`, `build-manifest`
- Dependency on `@powerhousedao/ph-clint` (uses `renderSkillTemplate`, `slugToTitle`)
- Dependency on `handlebars` for template rendering

## Features

### Part 1 — Build Skills Pipeline

#### Orchestration
- `buildSkills(config)` — top-level orchestrator, resolves config then runs three build phases
- `BuildConfig` interface — `cli`, `context`, `include`, `output`, `customHelpers`, `subdirs`, `clean`, `logger`
- Config resolution — extracts `agentProfiles` and `skillDescriptions` from CLI metadata (`prompts.agents`, `prompts.skills`)
- `ResolvedBuildConfig` — internal form with merged context (CLI metadata + user context)
- Multi-output directory support — all artifacts written to every path in `output[]`
- Optional clean step — removes output directories before building
- `BuildResult` — `skillsBuilt`, `skillsCopied`, `agentProfilesBuilt`, `warnings`

#### CLI Binary (`build-skills`)
- Loads `build-skills.config.ts` from cwd via dynamic import
- Accepts `default`, `config`, or bare module export
- Exits cleanly on warnings (exit 0), fatally on config load failure (exit 1)

### Part 2 — Agent Profiles

#### Build Agent Profiles
- `buildAgentProfiles(config)` — renders composable template sections into single instruction files
- `AgentProfile` — `name` + ordered `sections[]` (filenames within profiles directory)
- Multi-include directory search — `findInIncludes()` resolves first existing file across include paths
- Configurable subdirectory name (`subdirs.profiles`, default: `agent-profiles`)
- Handlebars rendering via `renderSkillTemplate()` with `agentName` injected into context
- Custom helpers support — passed through to render options
- Section concatenation — all sections trimmed, joined with double newline
- Output: `{output}/agent-profiles/{ProfileName}.md`
- Warning collection per section (missing template variables)
- Graceful skip on missing section files (logged, not fatal)

### Part 3 — Skill Templates

#### Build Skill Templates
- `buildSkillTemplates(config)` — compiles structured skill directories into SKILL.md + references
- Configurable subdirectory name (`subdirs.skillsTpl`, default: `skills-tpl`)
- Skill directory structure:
  - `.preamble.md` — optional introductory content (rendered through Handlebars)
  - `NN.name.md` — numbered scenario files (sorted, rendered, written to `references/`)
  - `.result.md` — optional expected outcome (rendered, written as `references/expected-outcome.md`)
  - `.cli-docs.md` — optional CLI documentation (rendered, copied alongside SKILL.md)
- SKILL.md generation:
  - YAML frontmatter: `name`, `description` (from CLI skill config or slug-derived title), `metadata.author`, `metadata.version`
  - Body: rendered preamble + reference links section ("Specific tasks")
  - Reference links formatted as `* **Label** [path](path)`
- Label derivation: `slugToTitle()` on filename without numeric prefix and extension
- Description fallback: `config.skillDescriptions[skillName]` → `slugToTitle(skillName) + " tasks"`

#### Copy External Skills
- `copyExternalSkills(config)` — copies pre-built skill directories without processing
- Configurable subdirectory name (`subdirs.skillsExt`, default: `skills-ext`)
- Searches all include directories for `skills-ext/` subdirectories
- Recursive copy via `fs.cpSync()` to `{output}/skills/{skillName}`
- No Handlebars rendering — pass-through only

### Part 4 — Publish Pipeline

#### Configuration
- `definePublishConfig(config)` — identity function for type safety
- `PublishConfig` — top-level: `groups: Record<string, PublishGroup>`
- `PublishGroup` — `version` (base semver), `packages[]` (in dependency order), optional `registry`
- `PackageEntry` — `path` (relative to config file), `category` (`cli` | `app` | `lib` | `fusion`)
- Config discovery — `discoverConfigPath()` walks up directories looking for `publish.config.js`
- Config validation — structure checks, at least one group, valid categories, non-empty packages
- Group resolution — auto-selects if single group, requires `--group` flag for multiple

#### Version Management
- `computeVersion(baseVersion, tag, latestPrerelease)` — derives published version string
- Tag strategies: `production` → bare version, `dev`/`staging` → `{base}-{tag}.{N}`
- `queryLatestPrerelease()` — HTTP fetch against registry API for highest existing prerelease number
- Auto-increment — N = latest + 1, or 0 if no existing prereleases
- `validateBump(current, new)` — ensures new version is strictly greater (semver comparison)
- `isValidSemver()` / `isValidSemverWithPre()` — regex-based validation (M.m.p format)

#### Dependency Resolution
- `analyzeFileDeps()` — finds `file:` specifiers in `dependencies` and `devDependencies`
- `FileDep` — tracks `name`, `originalSpecifier`, `resolvedPath`, `intraGroup` flag, `publishVersion`, `field`
- Intra-group detection — compares resolved absolute paths against group package paths
- `resolveAllFileDeps()` — sets `publishVersion` (`^{computedVersion}` for intra-group, `^{pkg.version}` for external)
- External dep verification — confirms external file: deps exist on registry before proceeding

#### Package.json Rewriting
- `backupPackageJson()` — creates `.publish-backup` before modification
- `rewritePackageJson(pkg, version)` — sets version field, replaces `file:` specifiers with resolved versions
- `restorePackageJson()` — restores from backup on failure (atomic rollback)
- `restoreFileDepPaths()` — after successful publish: keeps new version, restores `file:` paths
- `removeBackup()` — cleanup after successful publish

#### Build Phase
- `buildAll(packages, verbose, log, options)` — builds in dependency order, aborts on first failure
- Category-based build strategy:
  - `cli`/`lib`/`app`: `pnpm build` (typically tsc)
  - `fusion`: `pnpm build` (next build)
- Smart reinstall — runs `pnpm install --frozen-lockfile=false` when intra-group file: deps were rebuilt
- Connect asset build — app packages with `ph-cli` binary and `connect` script get additional `pnpm connect build --outDir dist/connect`
- `--verify-connect` — asserts `dist/connect/index.html` exists after connect build

#### npm Operations
- `checkNpmAuth(registry)` — verifies `npm whoami` succeeds
- `packDryRun(packageDir)` — validates tarball via `npm pack --dry-run`
- `publishPackage(pkg, registry, tag)` — `npm publish` with dist-tag, `--access public` for scoped packages
- `publishAll()` — sequential publish with partial failure recovery
  - Skips already-published versions (checks registry before each publish)
  - Handles 403 "cannot publish over" as already-published
  - Stops on first failure, prints resume instructions
- Dist-tag management:
  - `shouldSetLatest()` — highest-stability-wins logic (production > staging > dev)
  - `setLatestTag()` — `npm dist-tag add` after successful publish
  - First-time packages always get `latest` so `npm install` works immediately
- Post-publish verification:
  - `verifyWithRetry()` — exponential backoff (2s, 4s, 8s... up to 60s, ~242s max)
  - `verifyAllPublished()` — verifies all packages, reports propagation delays
  - `fetchPackageMetadata()` — direct HTTP fetch (bypasses npm CLI's 404 caching)

#### Partial Failure Recovery
- Detects partially-published versions by checking if first package exists at computed version
- Reuses version instead of bumping when partial publish detected
- Already-published packages skipped automatically on re-run
- Backup/restore ensures package.json is never left in a corrupted state

#### Pre-flight Checks
- Clean git working tree (`git status --porcelain`), skippable with `--skip-git-check`
- npm registry authentication
- Package validation: requires `name`, `files` field, non-private (unless `--allow-private`)
- External file: dep existence verification on registry

#### CLI Binary (`ph-publish`)
- Usage: `ph-publish <tag> [options]` or `ph-publish bump <version> [options]`
- Tags: `dev`, `staging`, `production`
- `bump` subcommand — updates base version in config file without publishing
  - Text-based rewrite to preserve formatting (regex match on group block)
  - Fallback patterns for quoted and bare group names
- Options: `--group`, `--config`, `--registry`, `--base-version`, `--dry-run`, `--skip-build`, `--skip-git-check`, `--force`, `--allow-private`, `--verify`, `--verify-connect`, `--verbose`
- `--force` — downgrades validation errors to warnings
- `--dry-run` — builds and validates but skips actual npm publish

#### Pipeline Decomposition
- `resolvePublishPlan(options)` — phases 1+2: load config, validate, pre-flight, compute version
- `buildPackages(plan, options)` — phase 3: build all packages
- `publishPackages(plan, options)` — phases 4-7: prepare, validate, publish, post-publish cleanup
- `publish(options)` — thin orchestrator over all phases
- `PublishPlan` — resolved state: config, packages, version, tag, registry
- `PublishResult` — `success`, `version`, `published[]`, `failed[]`, `dryRun`

### Part 5 — Project Layout Detection

#### Layout Detection
- `detectLayout(startDir)` — identifies project structure for tooling integration
- Two layout types:
  - `flat` — single directory with ph-clint in dependencies (`{ type: 'flat', root, cli }`)
  - `split` — `{name}-cli/` + `{name}-app/` sibling directories (`{ type: 'split', root, cli, app }`)
- Detection hierarchy: split at cwd → split at parent → flat at cwd → split at grandparent
- ph-clint dependency check — scans both `dependencies` and `devDependencies`

### Part 6 — Manifest Builder

#### Build Manifest
- `buildManifest(options)` — processes `powerhouse.manifest.json` for distribution
- Copies manifest from source to output directory
- Agent image handling — downloads remote URLs, replaces with local relative path
- `downloadImage()` — fetches with content-type detection (png, jpg, svg, webp)
- Extension derivation: Content-Type header → URL path extension → `.png` fallback
- Image filename: `{agentId}{ext}`
- Graceful degradation — keeps original URL on download failure (warns, doesn't fail)
- CLI entrypoint — self-executing when invoked as script (`import.meta.filename` check with realpath for pnpm symlinks)
