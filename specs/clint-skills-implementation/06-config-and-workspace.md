# Skill: config-and-workspace

## Why This Skill Exists

Configuration and workspace persistence are the two mechanisms that give a CLI memory across invocations. Config handles user preferences and environment-specific settings. Workspace handles application state (task lists, cached data, session info).

Developers frequently confuse the two, or worse, hardcode values that should be configurable. They also miss the 6-layer resolution model — putting values in the schema default layer when they should be in configDefaults, or not realizing env vars are auto-derived. This skill teaches the right mental model: schema defines shape and schema-level defaults, configDefaults provides implementation-level overrides, config files let users customize, and env vars let deployment environments inject values.

The `createTypes()` factory is a productivity multiplier that most developers don't discover on their own. Once you have a configSchema (and optionally a registry), you get pre-typed versions of defineCommand, defineTrigger, and defineService — no more repeating generic type parameters.

## What The Skill Covers

- Config schema design with Zod (types, defaults, descriptions)
- Secrets schema for sensitive values
- 6-layer config resolution and precedence
- Environment variable naming convention
- WorkdirStore: loadJsonObject, storeJsonObject, getStoreFolder
- createMemoryWorkdirStore for testing
- createTypes for pre-typed factories
- Config command auto-injection
- InferConfig type helper

## What The Skill Does NOT Cover

- defineCli composition (see `cli-setup`)
- Testing with workspace mocks (see `testing`)
- Powerhouse reactor config (see `ph-integration`)

## File Plan

### .preamble.md (~120 lines)

Config design philosophy:
- The 6-layer merge has clear semantics — each layer has a purpose:
  1. `--config` flag — one-off override for a specific run
  2. Env vars — deployment/CI environment injection, 12-factor style
  3. Local config — project-specific settings, committed or gitignored
  4. User config — personal preferences across projects
  5. configDefaults — implementation-level defaults the dev sets in code
  6. Schema defaults — structural defaults from `.default()` in Zod
- Env vars are auto-derived: `{CLI_NAME}_{UPPER_SNAKE_FIELD}`. CLI name is uppercased, field is camelCase→UPPER_SNAKE. Example: cli name `my-app`, field `apiKey` → `MY_APP_API_KEY`.
- Secrets vs config: use `secretsSchema` for API keys, tokens, passwords. They merge into the same config object but are censored in `config` command output and marked `sensitive: true` in metadata.
- Config files are JSON at known paths:
  - Local: `{workdir}/.ph/{cliName}.config.local.json`
  - User: `~/.ph/{cliName}.config.user.json`

Workspace persistence:
- WorkdirStore is rooted at `{workdir}/.ph/{cliName}/`
- `loadJsonObject<T>(filename, fallback)` — reads JSON, returns fallback if missing
- `storeJsonObject(filename, value)` — writes JSON atomically
- `getStoreFolder(subpath?)` — get path for custom storage directories
- For testing: `createMemoryWorkdirStore()` — same API, no filesystem I/O
- Don't store large binary data in workspace — it's JSON-oriented

createTypes ergonomics:
- Pass `configSchema` and optionally `registry` to `createTypes()`
- Get back `{ defineCommand, defineTrigger, defineService, createDocumentChangeTrigger }`
- All returned factories have config type pre-bound — `ctx.config.myField` is typed
- Use `as const` on registry array for full type inference

### .cli-docs.md

Extract from HTML docs:
- 6-layer resolution table
- Config file path functions: `localConfigPath()`, `userConfigPath()`, `userStoreFolder()`
- `configKeyToEnvVar()`, `toUpperSnake()`
- `resolveConfig()` function signature
- `WorkdirStore` interface (all methods)
- `createWorkdirStore()` and `createMemoryWorkdirStore()`
- `InferConfig<TSchema>` type
- `createTypes()` and `TypedFactory` type
- `getMissingRequiredFields()` utility
- Config command: `createConfigCommand()`, `generateConfigCommandHelp()`

### .result.md

> Config schema and optional secrets schema are defined with proper types, descriptions, and defaults. Workspace persistence uses loadJsonObject/storeJsonObject. Config resolves correctly across all 6 layers. If using createTypes, all define factories are pre-typed.

### 00.design-config.md

Phase: Map requirements to config fields.

Steps:
- List all configurable values the CLI needs
- For each value, determine:
  - Type: string, number, boolean, enum
  - Is it sensitive? → secretsSchema
  - Has a sensible default? → `.default(value)`
  - Is it truly optional (no default, can be absent)? → `.optional()`
  - What env var name will it get? → verify it's sensible
- Add `.describe('...')` to every field — it's the help text in `config` command
- Consider: will the config command display be useful? Are field names self-explanatory?

### 01.add-secrets.md

Phase: Separate sensitive fields into secretsSchema.

Steps:
- Define `secretsSchema` with Zod — same syntax as configSchema
- Typical secret fields: apiKey, token, password, clientSecret
- Pass to defineCli alongside configSchema
- Verify: `mycli config` shows secret values as `***`
- Verify: `mycli --meta` shows secret fields with `sensitive: true`
- Secrets get the same env var naming: `{CLI_NAME}_{UPPER_SNAKE_FIELD}`

### 02.use-workspace.md

Phase: Implement persistence patterns with WorkdirStore.

Steps:
- Load with fallback: `const data = await workspace.loadJsonObject<T>('file.json', defaultValue)`
- Modify in memory
- Store: `await workspace.storeJsonObject('file.json', data)`
- For structured data directories: `workspace.getStoreFolder('cache')` gives you a path to create subdirectories
- Pattern: create a data access module that wraps workspace calls for a specific data shape
- Don't store derived data — recompute from source on load

### 03.use-create-types.md

Phase: Set up pre-typed factories with createTypes.

Steps:
- In codegen projects: `framework.ts` already has `createTypes()` set up with `configSchema` and `registry`. It exports pre-typed `defineCommand`, `defineTrigger`, `defineService`, and `createDocumentChangeTrigger`. Edit `framework.ts` directly — it's user-owned and never overwritten by codegen.
- In manual projects: import `createTypes` from ph-clint, call with configSchema (and optionally registry)
- Use the returned factories instead of the base imports from `@powerhousedao/ph-clint`
- `ctx.config` is now typed — no need for `as Config` casts or generic parameters
- Export the typed factories from a shared module for use across command files

## Research Before Writing

| What | Where |
|------|-------|
| Config resolution | `packages/ph-clint/src/core/config.ts` — `resolveConfig()` |
| Env var derivation | `packages/ph-clint/src/core/config.ts` — `configKeyToEnvVar()`, `toUpperSnake()` |
| Config file paths | `packages/ph-clint/src/core/config.ts` — `localConfigPath()`, `userConfigPath()` |
| WorkdirStore implementation | `packages/ph-clint/src/core/store.ts` |
| createMemoryWorkdirStore | `packages/ph-clint/src/core/store.ts` (search `createMemoryWorkdirStore`) |
| createTypes implementation | `packages/ph-clint/src/core/types-binding.ts` |
| Config command | `packages/ph-clint/src/core/config-command.ts` |
| Secrets handling in cli.ts | `packages/ph-clint/src/core/cli.ts` — search for `secretsSchema`, `sensitiveKeys` |
| Config tests | `packages/ph-clint/tests/config.test.ts` |
| Store tests | `packages/ph-clint/tests/store.test.ts` |
| Example 02 (config + workspace) | `examples/02-task-tracker/src/cli.ts` and `src/commands/add.ts` |
| Example 05 (secrets + createTypes) | `examples/05-ph-rupert/src/config.ts` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Configuration" and "Workspace Persistence" sections |
