---
name: cli-optimization
description: "Full QA and grading procedure for a ph-clint CLI project. Deeply investigates the subject matter, executes every command, tests error paths, and produces an evidence-backed report against 15 design quality principles."
metadata:
  author: Powerhouse
  version: "2.0.0"
compatibility: "Node.js >=22.13, pnpm, access to the CLI project source and a terminal to run commands"
---

# CLI Optimization Skill

A thorough QA procedure for ph-clint CLI projects. You will investigate the subject matter, build and run the CLI, execute every command, test error paths, and grade against 15 design principles — all backed by concrete evidence.

## Critical Rules

1. **Run everything.** Every command must be executed at least once with valid inputs and once with invalid/missing inputs. Do not grade a command you have not run.
2. **Take notes.** Maintain an Evidence Log (described below) throughout. Every grade must cite specific observations from the log.
3. **Understand the domain first.** Before grading anything, spend time understanding what the CLI is supposed to do, who it's for, and what workflows it supports.
4. **Capture actual output.** When you run a command, record the exact output (or a representative excerpt). "It works" is not evidence.
5. **Test as a naive user.** Pretend you have never seen this CLI. Can you figure out what to do from the help text alone? Where do you get stuck?

## Evidence Log Format

Throughout this procedure, maintain a running log. Each entry follows this format:

```
### [Phase.Step] Title
**Command**: `the exact command you ran`
**Output** (excerpt):
```
actual output here
```
**Observation**: What you noticed — what worked, what was confusing, what broke.
**Principle(s)**: Which principle(s) this observation is evidence for.
```

Write to the evidence log after every step. The final report will reference these entries as justification for each grade.

Save the evidence log to a file in the project directory: `cli-optimization-evidence.md`

---

## Phase 0: Domain Discovery

**Goal**: Understand what this CLI does, who uses it, and what workflows it enables — before you look at any quality criteria.

### Step 0.1: Read the source to understand the domain

Read these files (in order, skip any that don't exist):

1. `README.md` — get the high-level pitch
2. `package.json` — name, description, dependencies, scripts
3. The main entry point (usually `src/main.ts` or `src/index.ts`) — find the `defineCli()` call
4. Every file that contains `defineCommand()` or `defineService()` — read the full implementation of each
5. Config schema — usually passed to `defineCli()` or in a separate file
6. Agent setup — system prompt, skills, tool registration (if the CLI has an agent)

### Step 0.2: Build a mental model

After reading the source, write a brief summary in the evidence log answering:

1. **What domain does this CLI operate in?** (e.g., "blockchain document management", "reactor package development", "task tracking")
2. **Who is the primary user?** (developer, operator, end-user, AI agent, or multiple?)
3. **What are the key workflows?** List the 3-5 main things a user would do with this CLI.
4. **What external systems does it depend on?** (APIs, databases, services, file systems)
5. **What is the command inventory?** List every command and service with a one-line summary in your own words (not copied from the help text).

This summary is your reference for the rest of the procedure. If a command's name or description doesn't match what it actually does (based on reading the source), note that discrepancy now.

### Step 0.3: Identify test scenarios

For each command in the inventory, write down:

- **Happy path**: What inputs would a real user provide? What should happen?
- **Error path**: What happens with missing required args? Wrong types? Invalid values?
- **Edge cases**: Empty strings, very long inputs, special characters, conflicting options

For each service:
- **Start/stop cycle**: Can it be started, checked for status, and stopped?
- **Readiness**: How do you know it's ready?
- **Failure mode**: What happens if a dependency is unavailable?

---

## Phase 1: Build & Setup

### Step 1.1: Fresh install and build

Run from the project root:

```
pnpm install
pnpm build
```

**Log**: Record exact output. Note any warnings, peer dependency issues, or errors.

### Step 1.2: Run tests

```
pnpm test
```

**Log**: Record pass/fail counts, coverage percentage if reported, and any failures.

### Step 1.3: Run lint (if available)

```
pnpm lint
```

**Log**: Record output. Note suppressions or disabled rules.

### Step 1.4: Verify the CLI is executable

Find the built entry point and run it:

```
node dist/main.js --version   # or however the CLI is invoked
node dist/main.js --help
```

**Log**: Record the exact help output. This is your baseline for all subsequent testing.

If the CLI doesn't run at all, stop and note this as a blocking issue. Everything downstream depends on a working build.

---

## Phase 2: Command-by-Command Testing

**For every command** listed in the `--help` output, execute the following sub-steps. Do not skip any command.

### Step 2.1: Read the help

```
node dist/main.js <command> --help
```

**Log** the full help output for each command.

**Observe**:
- Does every option have a description?
- Are types shown (string, number, boolean, choices)?
- Are defaults shown?
- Is the command description clear about what it does and when to use it?

### Step 2.2: Execute the happy path

Run the command with valid inputs that a real user would provide. Use the test scenarios from Phase 0.

```
node dist/main.js <command> --option value ...
```

**Log** the exact command and its full output.

**Observe**:
- Did it succeed?
- Is the output informative — does it confirm what happened?
- Is the output structured (JSON, table) or just a plain string?
- How long did it take? Was there any feedback during execution?
- Did it produce the expected side effects? (created a file, started a service, etc.) Verify.

### Step 2.3: Execute error paths

For each command, deliberately trigger failures:

1. **Missing required arguments**: Run with no args (or missing a required one)
2. **Wrong types**: Pass a string where a number is expected, etc.
3. **Invalid values**: Pass an enum value that doesn't exist, a path that doesn't exist
4. **Conflicting options**: If options interact, try contradictory combinations

```
node dist/main.js <command>                    # missing required args
node dist/main.js <command> --port notanumber  # wrong type
node dist/main.js <command> --format invalid   # invalid enum
```

**Log** each command and output.

**Observe**:
- Does the error message say what went wrong?
- Does it suggest what to do instead?
- Does it exit with a non-zero code?
- Does it show a stack trace (bad) or a human-readable message (good)?

### Step 2.4: Test with `--help` as a naive user

For each command, re-read the `--help` output and ask yourself:
- If I had never seen the source code, could I construct the correct invocation from this help text alone?
- Is there anything I'd need to guess?

**Log** any commands where the help text was insufficient.

---

## Phase 3: Interactive Mode Testing

Skip this phase if the CLI has no interactive mode. Check by running `node dist/main.js` with no arguments or with a `--interactive` / `repl` subcommand.

### Step 3.1: Launch and observe the welcome

Launch interactive mode and record the welcome output.

**Observe**:
- Does it tell you what this CLI is?
- Does it list key commands or tell you how to get help?
- Does it show current state (workspace, configuration, running services)?

### Step 3.2: Test `/help` and completion

Type `/help` and record the output. Try tab-completion if the REPL supports it.

**Observe**:
- Are all commands from `--help` also available here?
- Are descriptions shown?
- Is completion discoverable?

### Step 3.3: Execute commands in interactive mode

Run at least 3 commands from the REPL, including:
- A read-only command (list, status, etc.)
- A mutating command (create, init, etc.)
- A command with required parameters — does it prompt?

**Log** each interaction.

### Step 3.4: Test bare text input

Type plain text (not starting with `/`). What happens?
- If there's an agent, does it respond helpfully?
- If there's no agent, is the error message clear?

### Step 3.5: Test error recovery

Trigger an error in interactive mode. Does the REPL survive, or does it crash?

---

## Phase 4: Service Testing

Skip this phase if the CLI has no services. Check for `defineService()` in the source.

### Step 4.1: Start each service

```
node dist/main.js <service>-start
```

**Observe**:
- Does it start without errors?
- Is there readiness feedback (a message like "listening on port X")?
- How long does it take to become ready?

### Step 4.2: Check service status

```
node dist/main.js <service>-status
```

**Observe**: Does it accurately report running/stopped state?

### Step 4.3: Interact with the running service

If the service exposes an API or affects other commands, test that interaction. Run commands that depend on the service while it's running.

### Step 4.4: Stop the service

```
node dist/main.js <service>-stop
```

**Observe**: Does it stop cleanly? Is the port freed? Does status update?

### Step 4.5: Test service unavailability

Run commands that depend on the service while it's stopped. Does the error message explain the dependency and suggest starting the service?

---

## Phase 5: Agent Testing

Skip this phase if the CLI has no agent integration. Check for Mastra setup or agent configuration in the source.

### Step 5.1: Review agent configuration

Read the system prompt and any skills. Summarize in the evidence log:
- What role is the agent told to play?
- What boundaries are set?
- What skills/workflows are defined?
- Do skills reference actual commands by name?

### Step 5.2: Test agent with a simple task

Give the agent a simple, single-command task within its domain. For example, if it's a package development CLI, ask it to list packages.

**Log** the agent's response and any tool calls it makes.

**Observe**: Did it select the right command? Was the output sensible?

### Step 5.3: Test agent with a multi-step task

Give the agent a task requiring 2-3 commands in sequence. Something a real user would ask.

**Log** the full interaction.

**Observe**: Did it follow a logical sequence? Did it use skill guidance or improvise? Did it handle intermediate failures?

### Step 5.4: Test agent boundaries

Ask the agent to do something outside its domain or capabilities.

**Observe**: Does it refuse gracefully, or does it attempt to hallucinate a solution?

---

## Phase 6: Source Code Review

Now review the source with specific questions in mind. This is **not** a general code review — focus only on aspects that affect the 15 design principles.

### Step 6.1: Config placement audit

Search for hardcoded values that should be configurable:

```
# Port numbers, URLs, file paths in command logic
grep -rn "localhost\|127\.0\.0\.1\|:\d\{4\}" src/
grep -rn "https\?://" src/
```

Check config fields: is each one used by multiple commands (correct) or just one (should be an option)?

### Step 6.2: Framework compliance audit

Search for violations:

```
grep -rn "process\.exit" src/
grep -rn "console\.\(log\|error\|warn\)" src/
grep -rn "\\\\x1b\[" src/
```

Check for global mutable state: module-level `let` or `var` that's modified at runtime.

### Step 6.3: Output design review

For each command's `execute()` function, check:
- Does it return a typed result object, or does it `console.log`?
- For list-type commands: is the return value an array/object (good) or a formatted string (bad)?
- For mutation commands: does the return value confirm what changed?

### Step 6.4: Zod schema review

For each command's input schema:
- Is every field's type the most specific possible? (`z.enum` over `z.string`, `z.number` over `z.string` for ports)
- Does every field have `.describe()`?
- Are `optional()` / `default()` / required used correctly?

---

## Phase 7: Grading

**Only after completing phases 0-6**, grade each principle. Every grade must cite specific evidence log entries.

Read `references/design-principles.md` and `references/scoring-rubric.md` for the full criteria.

### Scoring table

Produce a table with all 15 principles:

```markdown
| # | Principle | Grade | Evidence | Key Issues |
|---|-----------|-------|----------|------------|
| 1 | Project Basics | Good/Needs work/Poor | [1.1, 1.2, 1.3] | ... |
| 2 | README and Setup | Good/Needs work/Poor | [0.1, 1.4] | ... |
| 3 | Self-Documentation | Good/Needs work/Poor | [2.1, 2.4, 3.1] | ... |
| 4 | CLI Identity | Good/Needs work/Poor | [0.2, 1.4] | ... |
| 5 | Command Naming | Good/Needs work/Poor | [0.2, 2.1] | ... |
| 6 | Command Options | Good/Needs work/Poor | [2.1, 2.3, 6.4] | ... |
| 7 | Services vs. Commands | Good/Needs work/Poor | [4.1-4.5] | ... |
| 8 | Config Schema | Good/Needs work/Poor | [6.1, 6.4] | ... |
| 9 | Config vs. Options vs. Hardcoded | Good/Needs work/Poor | [6.1] | ... |
| 10 | Agent Tool Surface | Good/Needs work/Poor | [2.1, 2.2, 6.3] | ... |
| 11 | Agent Instructions | Good/Needs work/Poor | [5.1-5.4] | ... |
| 12 | Interactive Mode | Good/Needs work/Poor | [3.1-3.5] | ... |
| 13 | Output Design | Good/Needs work/Poor | [2.2, 2.3, 6.3] | ... |
| 14 | Triggers and Routines | Good/Needs work/Poor | [...] | ... |
| 15 | Separation of Concerns | Good/Needs work/Poor | [6.2] | ... |
```

For principles where you skipped the relevant phase (e.g., no agent → skip 11), grade as **N/A** with a note.

### Issue list

For each "Needs work" or "Poor" grade, list:

1. **The specific issue** — with `file:line` reference and the evidence log entry that revealed it
2. **What you observed** — the actual behavior (exact output or behavior you saw)
3. **What you expected** — what a well-designed CLI would do instead
4. **Suggested fix** — concrete, actionable change (not "improve the description")

### Priority ranking

Order improvements by impact:
1. **Blocking**: Poor grades on principles 1-3 (can't build, test, or understand the project)
2. **High**: Poor grades on principles 4-6, 10 (identity and command design affect every interaction)
3. **Medium**: Poor grades on principles 7-9, 15 (architecture issues compound over time)
4. **Low**: Needs-work grades on principles 11-14 (polish items)

### Production readiness

A CLI is **production-ready** when all 15 principles score Good or Needs Work with only minor issues. Any **Poor** score indicates a design problem to resolve before shipping.

---

## Phase 8: Implement Fixes (Optional)

If the user requests fixes (not just grading), work through the issue list in priority order. For each fix:

1. Make the change
2. Re-run the specific test from Phase 2/3/4/5 that revealed the issue
3. Update the evidence log with the new result
4. Update the grade if warranted

Commit fixes in logical groups — don't mix unrelated changes.
