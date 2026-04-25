# Skill: command-definition

## Why This Skill Exists

Commands are the atomic unit of ph-clint. Every other feature (REPL, MCP, agent tools, triggers) builds on top of commands. A developer's first interaction with the framework is always "define a command." Getting this right — correct schema design, proper context usage, idiomatic return values — sets the foundation for everything else.

Without this skill, the agent would produce commands that work but miss ph-clint's conventions: forgetting `.describe()` on fields (so help text is empty), returning raw strings when `{ text, data }` is needed for agent tool use, or ignoring parameter prompting for REPL ergonomics.

## What The Skill Covers

- Designing Zod inputSchema with proper types, descriptions, defaults, and enums
- Writing execute functions that use CommandContext correctly
- Choosing return value shape (string vs `{ text, data }`)
- Configuring parameter prompting for interactive mode
- Using typed generics with defineCommand
- Registering commands in defineCli

## What The Skill Does NOT Cover

- CLI-level configuration (see `cli-setup`)
- Config schema design (see `config-and-workspace`)
- Testing commands (see `testing`)
- Agent tool conversion (see `agent-integration`)

## File Plan

### .preamble.md (~100 lines)

Includes a "Working in a Codegen-Managed Project" section covering:
- Import `defineCommand` from `../framework.js` (typed factory), not from `@powerhousedao/ph-clint`
- Never hand-edit `cli.ts` marker regions — update `project-spec.json` and run `{{commands.clint-project-regen.id}}`

Design principles for commands:
- One command = one user intent (not CRUD bundles)
- inputSchema is the single source of truth for flags, help, validation, and prompting
- `.describe()` on every field — it drives help text, agent tool descriptions, and prompting labels
- `.default()` for sensible defaults — they become optional CLI flags
- Return `{ text, data }` when the command will be used as an agent tool (text for humans, data for machines)
- Execute receives input (already validated by Zod) and context (injected, never constructed)
- Commands should be pure of side effects beyond their stated purpose — don't console.log, don't process.exit
- Destructure only what you need from context — don't grab the whole object

Common pitfalls:
- Forgetting `.describe()` — help shows empty descriptions
- Using `z.string().optional()` when you mean `z.string().default('value')` — optional means the flag can be omitted entirely
- Returning void — the CLI has nothing to display
- Accessing `context.services` without null check — it's undefined when no services configured

### .cli-docs.md

Extract from HTML docs:
- `defineCommand()` function signature and generic type parameters
- `Command` interface (id, description, inputSchema, outputSchema, prompt, execute)
- `CommandContext` interface with all fields and their types
- `PromptConfig` interface (promptForDefaults, promptOptional)
- Return value handling: string vs `{ text, data }`

### .result.md

> Command is defined with typed inputSchema, exported, registered in defineCli, and handles all input combinations. Help text is complete. If intended as an agent tool, returns `{ text, data }`.

### 00.assess-requirements.md

Phase: Understand what the command should do before writing any code.

Steps:
- Clarify the command's purpose and name (kebab-case, verb-noun style: `add-task`, `list-images`)
- Identify all inputs: required vs optional, types, valid ranges/enums
- Determine if it needs context resources: workspace? config? processes? services?
- Determine if it will be used as an agent tool (needs `{ text, data }` return)
- Determine if interactive prompting is needed (which optional fields to prompt for)
- Check for existing commands that overlap or that this command depends on

### 01.define-schema.md

Phase: Design and write the Zod inputSchema.

Steps:
- Choose field types: `z.string()`, `z.number()`, `z.boolean()`, `z.enum([...])`, `z.array()`
- Add `.describe('...')` to every field — this is the help text
- Add `.default(value)` for fields with sensible defaults
- Mark truly optional fields with `.optional()`
- Add validation: `.regex()`, `.min()`, `.max()`, `.url()`, `.email()`
- Consider enum types for constrained choices (they get auto-completion in the REPL)
- Verify: every required field without a default will be a mandatory CLI flag

### 02.implement-execute.md

Phase: Write the execute function body.

Steps:
- Destructure input as first arg: `({ name, loud })` — these are validated by Zod
- Destructure context as second arg: `{ workspace, config }` — only what's needed
- Implement the command logic
- Choose return shape:
  - Simple display: return a string
  - Agent-compatible: return `{ text: 'human-readable', data: structuredResult }`
- Handle errors: throw (the framework catches and formats), don't return error strings
- If using workspace: load with fallback, modify, store
- If using processes: `await processes!.run(cmd, { label, timeout })`
- Export and register: in codegen projects, update `project-spec.json` and run `{{commands.clint-project-regen.id}}`; import `defineCommand` from `../framework.js`

### 03.add-prompting.md

Phase: Configure interactive parameter prompting (optional).

Steps:
- Add `prompt` config to defineCommand:
  - `promptForDefaults: false` — don't prompt for fields that have `.default()` values
  - `promptOptional: ['field1', 'field2']` — prompt for these optional fields in REPL
- Prompting only applies in interactive mode — CLI mode requires all non-default fields as flags
- Enum fields get selection prompts automatically
- Test in REPL: `/command` with missing fields should trigger prompts

## Research Before Writing

Read these files to understand the actual API:

| What | Where |
|------|-------|
| `defineCommand` function | `packages/ph-clint/src/core/command.ts` |
| `Command` and `CommandContext` types | `packages/ph-clint/src/core/types.ts` (lines ~100-190) |
| `PromptConfig` type | `packages/ph-clint/src/core/types.ts` (lines ~142-145) |
| Schema field extraction | `packages/ph-clint/src/core/schema.ts` — `getSchemaFields()` |
| Return value handling | `packages/ph-clint/src/core/cli.ts` — search for `text` and `data` in command execution |
| Command tests | `packages/ph-clint/tests/command.test.ts` |
| CLI integration tests | `packages/ph-clint/tests/cli.test.ts` — search for execute/return patterns |
| Example 01 (simplest) | `examples/01-hello-world/src/commands/greet.ts` |
| Example 02 (workspace + prompting) | `examples/02-task-tracker/src/commands/add.ts` |
| Example 04 (agent tools) | `examples/04-chat-assistant/src/commands/` |
| HTML docs section | `packages/ph-clint/docs/index.html` — "Defining Commands" section |
