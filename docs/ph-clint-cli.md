# ph-clint-cli — Detailed Architecture

> Back to [architecture overview](./architecture.md)

## Introduction
- What ph-clint-cli is: the CLI tool that scaffolds, maintains, and publishes ph-clint implementation projects
- Split-layout monorepo: `ph-clint-cli` (the CLI side, built with ph-clint) + `ph-clint-app` (the Powerhouse reactor package)
- Itself a ph-clint implementation — uses `defineCli`, `defineCommand`, `defineTrigger`, `defineService`, `createDocumentChangeTrigger`, `buildDefaultReactor`, `createMastraHelpers`
- Who this is for (framework users who want to create new ph-clint CLIs from a specification)

## Package Identity
- Root: `@powerhousedao/ph-clint-cli-root` (private, orchestrates install/build/dev across sub-projects)
- CLI: `@powerhousedao/ph-clint-cli` — binary `ph-clint`, entry point `src/main.ts`
- App: `@powerhousedao/ph-clint-app` — reactor package with document model `powerhouse/ph-clint-project`, editor, processors
- Dependencies: `@powerhousedao/ph-clint` (framework), `@powerhousedao/ph-clint-dev` (build & publish), `@mastra/core`, Powerhouse reactor stack

## Features

### Part 1 — CLI Definition

#### Framework Binding
- `config.ts` — derives `CLI_ROOT`, `CLI_NAME`, `CLI_VERSION` from `readPackageInfo()`
- `framework.ts` — user-owned config/secrets schemas:
  - `configSchema`: `model` (LLM model ID), `devServicePort`, `phVersion` (pinned Powerhouse version)
  - `secretsSchema`: `apiKey` (Anthropic)
- `createTypes()` — binds config and registry to produce typed `defineCommand`, `defineTrigger`, `defineService`, `createDocumentChangeTrigger`
- `framework.gen.ts` — machine-generated: `defineRegistry([PhClintProject])`, regenerated on spec changes

#### CLI Entry Point (`cli.ts`)
- `defineCli()` with name, version, description, config/secrets schemas
- Marker regions (`@clint:begin`/`@clint:end`) — codegen-managed sections within user-owned file
- Registered commands: `clint-project-init`, `clint-project-regen`, `clint-project-build`, `clint-project-publish`, `clint-skills-sync`
- Registered services: `clint-project`
- Registered triggers: `spec-change`, `publish-trigger` (via routine)
- Prompts configuration:
  - Artifact paths: `gen/skills/` and `dist/gen/skills/`
  - Agent: `ph-clint-dev-agent` (PhClintDevAgent) with `AgentBase.md` section
  - Skills: `cli-setup`, `command-definition`, `service-definition` — each with `mode` input (expert/discovery/one-shot)
- Interactive welcome message with model/mode display
- Reactor: `buildDefaultReactor` with `ph-clint-app` document models, personal drive "Clint Folders", subscriptions to `powerhouse/ph-clint-project`
- Agent: `configureAgent(createAgent)` — lazy Mastra agent setup

### Part 2 — Project Specification

#### ClintProjectSpec
- Zod-validated schema persisted at `{project}/.ph/ph-clint-cli/project-spec.json`
- Core fields: `name` (must end with `-cli`), `scope` (optional `@org`), `version`, `description`
- Feature toggles:
  - `powerhouse`: ordered level enum `Disabled → Reactor → Switchboard → Connect` — determines flat vs split layout
  - `mastra`: `enabled`, `agentId`, `agentName`, `agentDescription`, `agentImage`, `models[]`, `profiles[]`, `common.enableChat`
  - `routine`: `enabled` (forced on when Mastra is enabled)
- `packages[]` — reactor packages with `id`, `packageName`, `documentTypes[]`, `version`
- `externalSkills[]` — GitHub-sourced skills with `id`, `name`, `githubUrl`
- `deployment` — `proxyEnabled`, `supportedResources[]`
- `documentId` / `documentType` — link back to source Powerhouse document
- Utility functions: `getPackageName()`, `getBinName()`, `getCliFolderName()`, `getAppFolderName()`, `getAppPackageName()`, `getAllDocumentTypes()`, `getDocumentTypeSlug()`, `getDocumentTypeModuleName()`, `isDocTypeGlob()`, `docTypeGlobToRegex()`

#### Spec Persistence
- `readProjectSpec()` / `writeProjectSpec()` — JSON read/write at `.ph/ph-clint-cli/project-spec.json`
- `specFromDocumentState()` — converts `PhClintProjectGlobalState` to `ClintProjectSpec` (returns null if no name set)
- `specToImportInput()` — maps spec to the `IMPORT_SPEC` action input for the document model

#### Spec Document Linkage
- `ensureSpecDocument()` — creates or finds `powerhouse/ph-clint-project` document in personal drive
- Used by: `clint-project-init`, `clint-project-regen`, `spec-change` trigger
- Checks drive folder tree for existing document, reuses reactor doc if present, creates new if missing
- Adds to drive at `specs/{name}`, dispatches `IMPORT_SPEC` action
- Persists `documentId`/`documentType` back to on-disk spec JSON

### Part 3 — Code Generation

#### Generator Engine (`codegen/index.ts`)
- `generateProject(options)` — reconcile on-disk project tree with a `ClintProjectSpec`
- Two modes:
  - `create` — empty directory, write everything fresh, refuse non-empty unless `allowNonEmpty`
  - `update` — existing project, reconcile against persisted spec with hash-protected overwrites
- Auto-detection: presence of persisted spec → update, absence → create
- `GenerateProjectResult`: `files[]`, `skipped[]`, `deleted[]`, `migrated`, `cliDir`, `appDir`, `pendingActions[]`

#### File Planning
- `planFiles(spec, targetDir)` — builds list of files the spec would emit with content
- CLI file builders: `CLI_FILE_BUILDERS` array + dynamic profile builders from `getProfileFileBuilders()`
- Project-root files: `README.md`, `publish.config.js`
- Split-layout only: root `package.json`, app `.gitkeep`, app `README.md`, app `index.ts` barrel

#### File Builders Registry
- 20+ builders, each a `{ relativePath, build(spec) → string | null }` record
- Key generated files: `package.json`, `tsconfig.json`, `jest.config.js`, `eslint.config.js`, `.gitignore`, `src/main.ts`, `src/cli.ts`, `src/config.ts`, `src/framework.ts`, `src/framework.gen.ts`, `src/mastra/index.ts`, `scripts/build-skills.ts`, `prompts/agent-profiles/AgentBase.md`, `src/agents/agent.ts`, `src/agents/demo-agent.ts`, `powerhouse.manifest.json`, `tests/smoke.test.ts`
- Conditional emission: builders return `null` to skip (e.g. agent files when Mastra disabled)
- `initOnly` flag: `framework.ts` and `smoke.test.ts` only emitted on create, never overwritten

#### Update Reconciliation
- Three strategies per file:
  - **Marker-based splicing**: files with `@clint:begin`/`@clint:end` regions (e.g. `cli.ts`) — splices generated regions into user-edited file, preserving everything outside markers
  - **Hash-protected overwrite**: compares on-disk hash against stored hash — skips user-edited files (warns), overwrites pristine files
  - **initOnly skip**: user-owned files (config schemas) never touched in update mode (created if missing)
- Deletion: files no longer emitted by new spec are removed if hash matches stored value
- `--force` overrides hash protection and git-dirty guards

#### Marker Regions
- `@clint:begin {name}` / `@clint:end {name}` comment syntax — own-line `//` comments
- `parseMarkerRegions()` — extracts named regions with body lines, indentation, line indices
- `spliceMarkerRegions(target, source)` — replaces matching regions in target with source bodies (last-to-first for stable indices)
- Regions in `cli.ts`: `imports`, `commands`, `services`, `triggers`, `prompts`, `events`, `interactive`, `reactor`, `mastra`

#### Hash Tracking
- Content hashes stored at `.ph/ph-clint-cli/.file-hashes.json`
- `hashContent()` / `hashFile()` — SHA-256 content hashing
- Used to detect user edits (pristine vs modified) for non-marker files
- Rekeyed on folder renames and flat → split migration

#### Generated State
- `.ph/ph-clint-cli/generated.json` — tracks `name`, `scope`, `cliFolderName`, `appFolderName`, `appInitialized`
- Used to detect folder renames (name/scope changes) and layout flips
- `generatedStateFromSpec()` derives state from spec + filesystem check

#### Folder Rename Handling
- Detects when `name` or `scope` changes by comparing `GeneratedState` with new spec
- Renames `{old-name}-cli/` → `{new-name}-cli/` and `{old-name}-app/` → `{new-name}-app/` on disk
- Rewrites hash-record keys from old → new folder prefixes
- Patches app `package.json` name if app is initialized

#### Flat → Split Migration
- `migrateFlatToSplit()` — one-shot layout transformation when `features.powerhouse` flips from `Disabled` to enabled
- Detection: compares `GeneratedState.cliFolderName === ''` (flat) against new spec requesting Powerhouse
- Git-dirty guard: refuses if uncommitted changes (unless `--force`)
- Moves all entries except `.git`, `.ph`, `README.md`, `node_modules` into `{name}-cli/`
- Re-keys hash records with new CLI folder prefix
- Creates app directory placeholder
- `node_modules` deliberately NOT moved (pnpm symlinks don't survive cross-directory rename)

### Part 4 — Commands

#### `clint-project-init`
- Bootstrap wizard: resolve target dir → assert empty → collect identity + features → validate → generate → create spec document → run post-gen actions → print next steps
- Input: `dir`, `name` (scoped or bare), `description`, `enablePowerhouse`, `enableMastra`, `enableRoutine`, `force`, `skipInstall`
- `buildSpec()` — assembles `ClintProjectSpec` from input, auto-appends `-cli` suffix, forces routine when Mastra enabled
- Prompts for defaults and optional fields (`promptForDefaults: true`, `promptOptional: ['description']`)
- Creates spec document in personal drive when reactor available (non-fatal on failure)

#### `clint-project-regen`
- Reconcile existing project against persisted spec — runs generator in update mode
- Input: `dir`, `force`
- Reads spec from `.ph/ph-clint-cli/project-spec.json` (errors if missing)
- Reports: files written, skipped, deleted, migration status, warnings
- Ensures spec document exists in drive (recovery for deleted documents)
- Runs post-generation actions

#### `clint-project-build`
- Build all packages in the project
- Input: `dir`, `verbose`
- Uses `detectLayout()` from ph-clint-dev to determine flat vs split
- Split: builds app first, then CLI. Flat: builds project directory

#### `clint-project-publish`
- Publish project packages to npm using ph-clint-dev publish pipeline
- Input: `tag` (dev/staging/production), `dir`, `dryRun`, `skipBuild`, `skipGitCheck`, `verbose`
- Discovers `publish.config.js` from target directory
- Three-phase: `resolvePublishPlan()` → `buildPackages()` → `publishPackages()`
- Displays plan preview (group, version, tag, registry, packages)

#### `clint-skills-sync`
- Synchronise external skills from spec to disk
- Input: `dir`
- Delegates to `syncExternalSkills()` — diffs desired vs installed, clones/removes as needed

### Part 5 — Post-Generation Actions

#### Action Pipeline
- `collectPostGenActions()` — inspects `GenerateProjectResult` to determine needed side-effects
- Seven action kinds in fixed execution order: `ph-init` → `app-install` → `app-ph-install` → `app-build` → `cli-install` → `cli-build` → `skills-sync`
- Dependency chain: failure cascading — downstream actions skip if upstream failed
- `skills-sync` is independent (runs regardless of build chain status)

#### Action Triggers
- Earliest-triggered-action logic: inspects changed file paths to find the most upstream action needed
- `.gitkeep` written + no app `package.json` → `ph-init`
- Migration → `app-install`
- App `package.json` changed → `app-install`
- App `.ts` files regenerated → `app-build`
- CLI `package.json` changed → `cli-install`
- CLI `.ts`/`.md` files regenerated → `cli-build`
- External packages missing from `powerhouse.config.json` → `app-ph-install`
- All actions from earliest onward in the chain are included

#### `runPostGenActions()`
- Sequential execution with numbered progress output
- Failure cascading: checks dependency map before each action
- Skip set: explicitly skipped actions (e.g. `--skip-install` skips `cli-install`)
- Prints summary: succeeded/failed/skipped counts

#### Scaffolding Actions
- `runPhInit()` — invokes `ph init {name}` to create reactor package
  - Guards against re-initialization (checks for existing `package.json`)
  - Pins to detected `ph` CLI version (`--version` or `--dev`/`--staging`/`--latest`)
  - Clears placeholder directory, patches scoped package name after init
- `runPhInstallPackages()` — `ph install <packages> --local --pnpm` to register external packages
- `runPnpmInstall()` — sequential `pnpm install` in specified directories

### Part 6 — Services

#### Clint Project Service
- `defineService()` with id `clint-project`
- Command: `pnpm dev` in the working directory
- Readiness: regex pattern `/Interactive mode started|ready/i` with 30s timeout
- Preflight: checks workdir has `package.json` with `@powerhousedao/ph-clint` in deps or a `dev` script
- Project scanner:
  - `isProjectFolder()` — matches `.ph/ph-clint-cli/project-spec.json` or `package.json` with `ph-clint` dependency
  - `getDocumentLink()` — reads `documentId`/`documentType` from spec file for drive mapping
- Restart: disabled

### Part 7 — Triggers

#### Spec Change Trigger
- `createDocumentChangeTrigger()` watching ALL `powerhouse/ph-clint-project` documents (no documentId filter)
- `callOnEmpty: true` — bootstraps from disk when no documents exist
- Flow per poll:
  1. Scans projects on disk via `clintProject.projectScanner`
  2. Builds project mapping: merges on-disk scan with personal drive entries
  3. Auto-creates spec documents for unlinked projects (`ensureSpecDocument`)
  4. For each changed document: converts state to spec, hashes, compares against `.last-spec-hash`
  5. If hash differs: runs `generateProject()` in update mode (force), writes spec + hash, runs post-gen actions
- Hash comparison: SHA-256 of canonical JSON (sorted keys), excludes `documentId`/`documentType`
- `specToImportInput()` — maps spec fields to `IMPORT_SPEC` document action for round-tripping

#### Publish Trigger
- `createDocumentChangeTrigger()` watching ALL `powerhouse/ph-clint-project` documents
- `initialReconcile: false` — only reacts to new pending records, not on startup
- Scans `publishHistory` in document state for records with `status: "Pending"`
- Processes one pending record per tick (avoids races)
- Returns a `WorkItem` of type `function`:
  1. Marks record as `InProgress` via `SET_PUBLISH_STATUS` action
  2. Runs `pnpm install` in target directory
  3. Invokes `clint-project-publish` command with resolved tag
  4. Marks record as `Succeeded` or `Failed`
- Tag mapping: document model `Dev`/`Staging`/`Production` → CLI `dev`/`staging`/`production`

### Part 8 — Agent

#### Clint Agent
- Agent factory: `createAgent(ctx)` — returns `AgentProvider`
- Demo mode (no API key): echo-style agent that returns `[Clint demo mode]` + user prompt
- Full mode (with API key): Mastra `Agent` with:
  - `instructions`: concise helper persona
  - `model`: configurable via `config.model` (default: `anthropic/claude-haiku-4-5`)
  - `tools`: CLI commands + MCP tools via `createMastraHelpers().getTools()`
  - `memory`: LibSQL-backed via `createMastraHelpers().createMemory()`
  - `maxSteps: 40` via `wrapAgent()`
- Lazy initialization — agent constructed only when first called

### Part 9 — External Skills

#### Skills Sync
- Reconciles external skills on disk to match `spec.externalSkills`
- On-disk location: `prompts/skills-ext/{name}/`
- `.skills-manifest.json` — tracks installed skills (name + githubUrl)
- `diffSkills()` — pure diff: computes `toAdd`, `toRemove`, `unchanged` (URL change = remove + re-add)
- `syncExternalSkills()`:
  - Removes skills no longer in spec (`rm -rf`)
  - Clones missing skills via `git clone --depth 1` (shallow)
  - Strips `.git` directory after clone (no nested repo)
  - Updates manifest JSON

### Part 10 — Reactor Package (ph-clint-app)

#### Document Model
- `powerhouse/ph-clint-project` — document model describing a ph-clint implementation project
- State mirrors `ClintProjectSpec` fields: name, scope, version, features, packages, externalSkills, publishHistory, deployment
- Key operations: `IMPORT_SPEC` (bulk state update from codegen), `SET_PUBLISH_STATUS` (publish workflow), standard CRUD per section

#### Editor
- `ph-clint-project-editor` — Connect editor for the project document
- Visual project configuration UI in the Powerhouse web application

#### Processors
- Connect processor + Switchboard processor + factory
- Bridge document model operations to GraphQL API

#### Exports
- Conditional exports: `./document-models`, `./document-models/*`, `./editors`, `./editors/*`, `./subgraphs`, `./processors`
- Dual build: browser + node targets
- `./manifest` — `powerhouse.manifest.json`
- `./style.css` — Tailwind styles

### Part 11 — Prompt Assets

#### Agent Profiles
- `prompts/agent-profiles/AgentBase.md` — base instruction template for the dev agent
- Built at compile time via `build-skills` script using `ph-clint-dev`

#### Skills Templates
- `prompts/skills-tpl/` — three skill template directories:
  - `cli-setup/` — assess needs, define config schema, wire CLI, add entrypoint
  - `command-definition/` — assess requirements, define schema, implement execute, add prompting
  - `service-definition/` — assess service, define service, add preflight, add project scanner, wire events
- Each follows the `.preamble.md` + `NN.scenario.md` + `.result.md` + `.cli-docs.md` convention
- Rendered through Handlebars at build time by `ph-clint-dev`

#### External Skills
- `prompts/skills-ext/` — destination for GitHub-cloned skills
- Managed by `clint-skills-sync` command and `syncExternalSkills()`
