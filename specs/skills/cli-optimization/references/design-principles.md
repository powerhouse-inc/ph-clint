# ph-clint — CLI Design Quality Principles

A methodology for grading and improving the design quality of a CLI built with ph-clint. These principles focus on decisions made by the **implementation project** — the choices in `defineCli()`, `defineCommand()`, `defineService()`, config schemas, agent setup, and skills. They do not cover framework internals (the framework handles flag syntax, help rendering, completion plumbing, etc.).

The audience is dual: **human users** typing commands in a terminal or REPL, and **AI agents** selecting and invoking tools. Good CLI design serves both equally.

---

## 1. Project Basics: Build, Test, Lint

**What to evaluate:**

- Does `pnpm install` succeed without errors or unresolved peer dependencies?
- Does `pnpm build` produce clean output — no TypeScript errors, no warnings?
- Does `pnpm test` exist and pass? Is there meaningful test coverage (not just a single smoke test)?
- Does `pnpm lint` exist? Are there no blanket suppressions hiding real issues?
- Is `package.json` well-formed? Does it have a correct `name`, `version`, `scripts`, and dependency declarations?

**Quality test:** Clone the repo, run `pnpm install && pnpm build && pnpm test`. Does everything pass on the first try with no manual intervention?

**Common pitfalls:**
- Missing or broken `build` script — the project only works from source with `ts-node` or `tsx`
- Tests that pass locally but rely on implicit global state (environment variables, running services, specific file paths)
- `lint` script that exists but is never run in CI, accumulating hundreds of suppressed warnings
- `package.json` missing `type: "module"` or `engines` field, causing silent ESM/CJS issues

---

## 2. README and Setup Documentation

**What to evaluate:**

- Does a README exist at the project root?
- Does it explain: what this CLI does, how to install/set up, and how to run it?
- Does it show the project structure (at least the key directories and entry points)?
- Is it minimal and accurate — not a wall of aspirational text or auto-generated boilerplate?
- Are prerequisites listed (Node version, required services, environment variables)?

**Quality test:** Give the README to a developer unfamiliar with the project. Can they get the CLI running within 5 minutes, without asking questions?

**Common pitfalls:**
- No README at all — the project is undiscoverable
- README describes the vision but not how to actually run the thing
- Setup instructions that are out of date (reference removed scripts, old config formats, deprecated flags)
- Excessive length — a README that tries to be a full user manual instead of a quick-start guide

---

## 3. Self-Documentation

**What to evaluate:**

- Beyond the README, the CLI itself should be the documentation. `--help` at every level (root, command, subcommand) should be sufficient for a user to understand and use the tool.
- Are Zod `.describe()` strings present and useful for every command, option, and config field? These are the source of truth for all user-facing text — help output, interactive prompts, agent tool descriptions, and MCP schemas all derive from them.
- Can a user accomplish any supported task without reading source code?
- Does the welcome message in interactive mode orient the user to available commands and current state?

**Quality test:** Delete the README and try to use the CLI from `--help` alone. Is anything unclear, missing, or misleading?

**Common pitfalls:**
- Commands or options with no `.describe()` — they appear as bare names in help output with no context
- Help text that describes implementation details ("Calls the Mastra agent with thread context") instead of user intent ("Ask the AI assistant a question")
- Welcome message that's empty or just prints a version number — no guidance on what to do next
- Inconsistent vocabulary between help text, error messages, and the README

---

## 4. CLI Identity: Tagline, Name, and Purpose

**What to evaluate:**

- Does the CLI name clearly identify the tool and its domain?
- Does the `description` (tagline) communicate what the CLI does in one sentence — not what it *is*, but what it *does for you*?
- Does the overall command list give a complete picture of the CLI's capabilities? Could a new user scan the help output and understand what this tool is for?
- Is the domain vocabulary consistent throughout (commands, options, descriptions, config fields)?

**Quality test:** Show the `--help` output to someone unfamiliar with the project. Can they tell (a) what domain this tool operates in, (b) what actions are available, and (c) when they would reach for this tool vs. a general-purpose one?

**Common pitfalls:**
- Tagline describes the technology stack instead of the user value ("Mastra-based Powerhouse CLI" vs. "Reactor package development with AI assistance")
- Name collides with well-known tools or is too generic to search for
- Description uses internal jargon that means nothing outside the team

---

## 5. Command Naming and Descriptions

**What to evaluate:**

- Is every command named after what it *does*, using a consistent `noun-verb` or `verb-noun` pattern? (Choose one pattern and stick with it across all commands.)
- Are descriptions accurate, concise, and complete? Each should answer: "What does this command do, and when would I use it?"
- Are related commands discoverable as a group? (e.g., `reactor-package-init` and `reactor-packages-list` share a prefix that signals relatedness)
- Is there a command missing that a user would expect? Is there a command present that nobody would use?
- Do command names work well as agent tool names? An agent sees the name and description as its primary signal for tool selection — ambiguity causes wrong tool calls.

**Quality test:** For each command, ask: "If an agent had only the name and description, would it select this tool for the right task and avoid it for the wrong one?"

**Common pitfalls:**
- Mixing naming patterns (`list-packages` vs. `package-init` vs. `packages`)
- Descriptions that duplicate the name ("init — initializes a package") instead of adding value ("init — scaffold a new reactor package with document models and build config")
- Commands named for implementation details rather than user intent (`run-script` vs. `build`)

---

## 6. Command Options: Naming, Types, and Semantics

**What to evaluate:**

- Is every option named consistently and logically? Does the name immediately convey what it controls?
- Are Zod `.describe()` strings present and useful for every option? These drive help text, interactive prompts, and agent tool parameter descriptions.
- Is the type (string, number, boolean, enum) the most natural representation? Would a user guess the type correctly?
- Is there semantic overlap between options? Two options that partially control the same thing create confusion for users and unpredictable behavior for agents.
- Are defaults sensible? Does `.optional()` vs `.default()` vs required reflect actual usage — is the user asked for things they shouldn't have to provide, or silently defaulted on things they should control?
- Are boolean flags positive (`--watch`) rather than negative (`--no-watch`, `--disable-watch`)? Negated booleans are harder to reason about, especially for agents.

**Quality test:** For each option, ask: "Could a user or agent provide the correct value with only the name, type, and description — without reading source code?"

**Common pitfalls:**
- Options that accept `string` when they should be an `enum` (e.g., `--format` accepting freeform text instead of `z.enum(['json', 'table', 'markdown'])`)
- Missing `.describe()` — the option becomes a bare name with no context in help output, interactive prompts, or agent tool schemas
- Two options that interact in non-obvious ways without documentation (e.g., `--port` and `--url` where setting one should invalidate the other)

---

## 7. Services vs. Commands

**What to evaluate:**

- Is every long-running process defined as a `defineService()`, not a command?
- Is every run-to-completion action defined as a `defineCommand()`, not a service?
- Does each service have appropriate readiness patterns? Can the framework (and agents) reliably know when the service is usable?
- Are service lifecycle commands (start/stop/status/logs) generated consistently? Do their names follow the same pattern as domain commands?
- Does the service have sensible shutdown, restart, and timeout configuration?

**Decision rule:** If it starts, does work, and exits — it's a command. If it starts, stays alive, and provides ongoing value — it's a service. If a "command" has a `--watch` flag that makes it run forever, the watch mode should be a service and the one-shot mode a command.

**Common pitfalls:**
- A command that spawns a child process and waits for it — this is a service in disguise
- A service without readiness patterns — the framework and agents cannot know when it's safe to interact with
- Missing restart configuration for services that are prone to crashes

---

## 8. Config Schema Design

**What to evaluate:**

- Is the config schema minimal? Does every field represent a value that genuinely varies across environments, workspaces, or users?
- Are field names clear and consistent? Remember they auto-map to env vars (`{CLINAME}_{UPPER_SNAKE}`) — are the resulting env var names intuitive?
- Are defaults appropriate? A field with `.default()` means "works out of the box." A required field without default means "the user must provide this before anything works." Is that distinction correct for each field?
- Are `.describe()` strings present and useful? Config field descriptions appear in first-run prompts and documentation.
- Is there overlap between config fields and command options? The rule: config is for *environment-level* values (API keys, ports, paths); options are for *invocation-level* values (output format, verbosity, target).

**Quality test:** Could a new user run the CLI for the first time and either (a) have everything work with defaults, or (b) be prompted for exactly the values they need to provide — no more, no less?

**Common pitfalls:**
- Hardcoding values that should be config (a port number buried in command logic instead of the config schema)
- Making fields required that have sensible defaults (forcing first-run prompting for things the user doesn't care about)
- Config fields that are only used by one command — these should be command options instead
- Field names that produce awkward env vars (`apiEndpointUrl` → `MYCLI_API_ENDPOINT_URL` — redundant; prefer `endpoint` → `MYCLI_ENDPOINT`)

---

## 9. Config vs. Options vs. Hardcoded

**What to evaluate:**

- For every parameterized value in the project, is it at the right level?
  - **Hardcoded**: Universal truths that never change (protocol prefixes, internal paths, framework constants)
  - **Config**: Environment-level, changes per workspace/user/deployment, shared across commands (API keys, ports, endpoints, model names)
  - **Option**: Invocation-level, changes per call, specific to one command (output format, target name, dry-run flag)
- When a command option *overrides* a config value (e.g., `--port` overriding `config.port`), is this explicit and documented?

**Common pitfalls:**
- The same value is a config field *and* a command option with no clear precedence
- Values that change per environment are hardcoded (file paths, URLs, port numbers)
- Values that never change are in config (cluttering the config with "configuration" that nobody configures)

---

## 10. Agent Tool Surface

**What to evaluate:**

- Do commands work well as agent tools? An agent sees: tool name, description, and a flat list of typed parameters. Is this surface sufficient to use the command correctly?
- Are Zod `inputSchema` descriptions written for *both* humans and agents? An agent relies on the description to understand what value to pass — vague descriptions cause hallucinated parameters.
- Are commands at the right granularity for agent use? Too coarse (one command does everything via flags) prevents precise tool selection. Too fine (dozens of micro-commands) overwhelms the tool list and increases the chance of selecting the wrong one.
- Is the output schema informative? Agents use structured output to chain tool results into subsequent actions. A command that returns only `{ success: true }` is less useful than one returning `{ id: "pkg-123", path: "/workspace/packages/pkg-123" }`.
- Are command side effects clear from the description? An agent needs to know if a command is read-only (safe to call speculatively) or mutating (requires confidence before calling).

**Quality test:** Give an agent the tool list and a natural-language task. Does it select the right tool, provide correct parameters, and interpret the output — without needing additional instructions in the system prompt?

**Common pitfalls:**
- A "list" command returns human-formatted text instead of structured data — agents can't parse it reliably
- A command description says "manage packages" (too vague) instead of "create a new reactor package in the workspace" (actionable)
- Destructive commands that lack confirmation or dry-run options — agents invoke them without realizing they're irreversible

---

## 11. Agent Instructions and Skills

**What to evaluate:**

- Does the agent system prompt clearly define the agent's role, domain expertise, and boundaries?
- Are skills well-scoped? Each skill should cover one coherent workflow, not be a dump of everything the agent might need to know.
- Do skills reference the actual commands and services available to the agent? A skill that describes a workflow but doesn't mention which tools to use leaves the agent guessing.
- Are skills kept up to date with command changes? A skill referencing a renamed or removed command is worse than no skill at all.
- Is the agent instructed about *when not* to use certain tools? Guardrails (e.g., "do not call `init` if the package already exists") prevent common failure modes.

**Quality test:** Give the agent a complex, multi-step task within its domain. Does it follow the skill's guidance to produce a correct result, or does it ignore the skill and improvise?

**Common pitfalls:**
- System prompt that duplicates the skill content (wasted context window)
- Skills written as documentation (explains concepts) rather than as operational guides (step-by-step with tool references)
- Missing boundary instructions — the agent tries to do things outside its capabilities instead of telling the user it can't

---

## 12. Interactive Mode Experience

**What to evaluate:**

- Does the welcome message orient the user? It should show: what this CLI is, what the key commands are, and what the current state is (workspace, agent mode, running services).
- Is the interactive prompt character/prefix distinctive and consistent with the CLI's identity?
- Does parameter prompting behave correctly? Are `promptForDefaults` and `promptOptional` set appropriately for each command — prompting for things the user cares about, auto-filling things they don't?
- Does bare text (no `/` prefix) route to a sensible default? If an agent is configured, does it respond helpfully? If no agent, does the user get a clear error rather than silence?
- Is the command set discoverable via auto-completion? Are command names short enough to type but unique enough to complete unambiguously?

**Common pitfalls:**
- Welcome message that's either empty (no guidance) or a wall of text (overwhelming)
- Prompting for every optional parameter on every invocation (friction)
- Auto-completion that returns too many matches for short prefixes

---

## 13. Output Design

**What to evaluate:**

- Do commands produce output appropriate to their context? A list command should return structured data (renderable as a table). A mutation command should confirm what changed. An error should explain what went wrong and what to do about it.
- Is streaming output used where appropriate? Long-running operations and agent responses should stream — not buffer and dump.
- Is the output useful for both terminal display and programmatic consumption? Commands should return typed result objects, not `console.log()` strings.
- Are error messages actionable? "Failed to connect" is useless; "Failed to connect to Switchboard at localhost:4001 — is the vetra service running? Try: /vetra-start" tells the user what to do next.

**Common pitfalls:**
- Commands that `console.log()` instead of returning structured results — breaks transport-agnostic rendering and makes testing harder
- Error messages that expose stack traces to end users instead of human-readable explanations
- Success output that doesn't confirm what actually happened ("Done" vs. "Created reactor package 'my-pkg' at ./packages/my-pkg")

---

## 14. Trigger and Routine Design

**What to evaluate:**

- Are triggers well-scoped? Each trigger should detect one clear condition and produce a specific work item type.
- Is the trigger-to-action mapping obvious? When a trigger fires, is the resulting work item the natural response?
- Are trigger conditions resilient to noise? A file-change trigger that fires on every `.tmp` file is noisy. One that filters to relevant extensions is precise.
- Is the tick interval appropriate for the use case? A 2-second tick is fine for development workflows; a monitoring CLI might need sub-second response.
- Do triggers degrade gracefully? If the event source is unavailable (e.g., reactor not running), does the trigger skip silently or crash the loop?

**Common pitfalls:**
- Triggers that produce work items faster than the loop can consume them (unbounded queue growth)
- Missing filters — every event becomes a work item, overwhelming the agent or command execution
- Triggers coupled to specific service state without checking if the service is running

---

## 15. Separation of Concerns: Framework vs. Implementation

**What to evaluate:**

- Does the implementation rely on framework features rather than reimplementing them? (e.g., using the config system rather than reading env vars directly, using `defineService()` rather than spawning processes manually)
- Is the implementation free of assumptions about the terminal? Commands should not emit ANSI codes directly — the framework's output system handles rendering per transport.
- Does the implementation avoid global mutable state? All state should flow through `CommandContext`, config, or the event bus.

**Common pitfalls:**
- Direct `process.exit()` calls instead of returning error results — breaks testability and interactive mode
- Direct `console.log()` instead of structured output — breaks transport-agnostic rendering
- Importing heavy dependencies at the top level instead of lazily — slows startup for every command

---

## Scoring Rubric

For each principle, grade on a three-level scale:

| Grade | Meaning |
|-------|---------|
| **Good** | Meets the principle consistently across all commands, services, and config. No issues found. |
| **Needs work** | Mostly correct but with specific issues that should be addressed. List them. |
| **Poor** | Systemic problems — the principle is violated across multiple commands or the design misses the point entirely. |

A CLI is **production-ready** when all 15 principles score Good or Needs Work with only minor issues. A **Poor** score on any principle indicates a design problem that should be resolved before shipping.
