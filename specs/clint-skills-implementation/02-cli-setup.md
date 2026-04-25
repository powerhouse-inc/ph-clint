# Skill: cli-setup

## Why This Skill Exists

`defineCli()` is the composition root — it wires commands, config, services, triggers, and integrations into a single runtime. Getting the composition wrong leads to subtle bugs: missing built-in commands, unconfigured interactive mode, or config schemas that don't merge correctly with secrets.

Developers often start by copy-pasting an example and then struggle when they need to add features incrementally. This skill guides the agent through both greenfield scaffolding and incremental extension of existing CLIs.

## What The Skill Covers

- `defineCli()` options and what each one enables
- Config schema and secrets schema wiring
- Interactive mode configuration (welcome messages, Resolvable values)
- Built-in command injection (cli-docs, config, service commands)
- The `Cli` object and its methods (run, execute, parseArgs, bootstrap, etc.)
- Entry point setup (shebang, process.argv, package.json bin)
- RunOptions for testing and embedding

## What The Skill Does NOT Cover

- Defining individual commands (see `command-definition`)
- Designing config schemas in depth (see `config-and-workspace`)
- Service definitions (see `service-definition`)
- Agent loader setup (see `agent-integration`)

## File Plan

### .preamble.md (~120 lines)

Includes a "Codegen-Managed Projects" section covering:
- `{{commands.clint-project-init.id}}` generates the initial scaffold with marker regions
- `framework.gen.ts` is codegen-owned (registry); `framework.ts` is user-owned (config schemas, createTypes)
- Never hand-edit marker regions — update `project-spec.json` and run `{{commands.clint-project-regen.id}}`

CLI composition principles:
- defineCli is declarative — you describe what the CLI has, the framework wires it up
- Order of options doesn't matter, but understanding what triggers what does:
  - `configSchema` present → auto-injects `config` command
  - `services` present → auto-injects per-service management commands
  - `cli-docs` command is always injected
  - `interactive` present → enables `-i` flag for REPL mode
  - `triggers` present → enables routine loop
- Resolvable values: `description` and `interactive.welcome` can be static strings or functions of `({ config, workdir })` — use functions when the message depends on runtime state (e.g., showing "demo mode" vs "LLM mode")
- The Cli object returned by defineCli is the public API — it has methods for running, testing, introspection, and metadata
- `cli.run(process.argv)` is the standard entry point — it handles Commander setup, argument parsing, and REPL rendering
- `cli.bootstrap()` resolves workdir, config, and context without entering the run pipeline — useful for codegen scripts

Pitfalls:
- Forgetting `version` — Commander needs it for `--version` flag
- Putting secrets in `configSchema` instead of `secretsSchema` — they'll show up in config command output
- Not setting `interactive.welcome` — REPL starts with no context for the user
- Using `configDefaults` for values that should be `.default()` in the schema — configDefaults is for implementation-level overrides, not schema defaults

### .cli-docs.md

Extract from HTML docs:
- `defineCli()` full options table (CliOptions interface)
- `Cli` object methods (run, execute, parseArgs, getCommand, listCommands, generateHelp, generateCommandHelp, generateCompletion, configEnvVars, getMetadata, configureAgent, bootstrap)
- `RunOptions` interface
- `BootstrapOptions` and `BootstrapResult`
- Built-in commands table (cli-docs, config, service commands)
- `Resolvable<T, TConfig>` type

### .result.md

> CLI is defined with all required features wired in, entry point is set up with shebang and process.argv, package.json has bin field, and the CLI responds to `--help`, `--version`, `-i`, and all registered commands.

### 00.assess-cli-needs.md

Phase: Determine which features the CLI needs.

Steps:
- Name the CLI (kebab-case, will be used for config file names and env var prefixes)
- Determine version sourcing: hardcoded or `readPackageInfo(import.meta.url)`
- Checklist of features to enable:
  - [ ] Custom config? → needs `configSchema`
  - [ ] Sensitive config (API keys)? → needs `secretsSchema`
  - [ ] Interactive REPL? → needs `interactive`
  - [ ] Background services? → needs `services`
  - [ ] Automated triggers? → needs `triggers` + `routine`
  - [ ] AI agent? → needs `configureAgent()` after defineCli
  - [ ] Skill templates? → needs `prompts`
  - [ ] Powerhouse documents? → needs `configureReactor`
- List the commands to register

### 01.define-config-schema.md

Phase: Design and wire config and secrets schemas.

Steps:
- Define `configSchema` with Zod: fields the user can configure
- Define `secretsSchema` with Zod: sensitive fields (API keys, tokens)
- Set `configDefaults` for implementation-level overrides (not schema defaults)
- Verify env var names will be sensible: `{CLI_NAME}_{UPPER_SNAKE_FIELD}`
- Pass both schemas to defineCli

### 02.wire-cli.md

Phase: Compose the defineCli call.

Steps:
- Assemble all options: name, version, description, commands, configSchema, secretsSchema
- Configure `interactive.welcome` — static string or Resolvable function
- Add services, triggers, routine config if needed
- Add events handlers for service lifecycle events if needed
- Add prompts config if skills are needed
- Verify built-in commands will be injected correctly

### 03.add-entrypoint.md

Phase: Create the entry point and package.json configuration.

Steps:
- Create `src/cli.ts` with `#!/usr/bin/env node` shebang
- Import defineCli, commands, and schemas
- Call `cli.run(process.argv)`
- Add `"bin"` field to package.json
- Add `"type": "module"` to package.json
- Add build script that produces the dist entry point
- Test: `node dist/cli.js --help` should show all commands

## Research Before Writing

| What | Where |
|------|-------|
| `defineCli` function | `packages/ph-clint/src/core/cli.ts` |
| `CliOptions` type | `packages/ph-clint/src/core/types.ts` (search `CliOptions`) |
| `Cli` interface | `packages/ph-clint/src/core/types.ts` (search `interface Cli`) |
| `RunOptions` type | `packages/ph-clint/src/core/types.ts` (search `RunOptions`) |
| `Resolvable` type | `packages/ph-clint/src/core/types.ts` (search `Resolvable`) |
| Built-in command injection | `packages/ph-clint/src/core/cli.ts` — search for `createConfigCommand`, `createHelpCommand`, `createServiceCommands` |
| Bootstrap implementation | `packages/ph-clint/src/core/cli.ts` — search for `bootstrap` |
| CLI tests | `packages/ph-clint/tests/cli.test.ts` |
| Example 01 (minimal) | `examples/01-hello-world/src/cli.ts` |
| Example 02 (config) | `examples/02-task-tracker/src/cli.ts` |
| Example 05 (full-featured) | `examples/05-ph-rupert/` — `src/cli.ts` and `src/config.ts` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Defining a CLI" section |
