---
name: cli-optimization
description: "Systematically grade and improve a ph-clint CLI project against 15 design quality principles. Covers build health, documentation, self-documentation, command design, config, agent readiness, UX, and framework compliance. Produces a scored report with prioritized improvements."
metadata:
  author: Powerhouse
  version: "1.0.0"
compatibility: "Node.js >=22.13, pnpm, access to the CLI project source and a terminal to run commands"
---

# CLI Optimization Skill

Grade a ph-clint CLI project against the 15 design principles in `specs/design-principles.md`, identify issues, and produce a prioritized improvement plan.

## Before You Start

- You need access to the CLI project's source directory
- Read `references/design-principles.md` for the full principle definitions and scoring rubric
- Identify the CLI name from `defineCli()` in the source (referred to as `<cli>` below)
- Identify the package manager (check for `pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`) — instructions below use `pnpm`

## Phase 1: Environment & Build Health (Principles 1-3)

### Step 1.1: Build verification

Run these commands and record the results:

```
pnpm install
pnpm build
pnpm test
pnpm lint  # if it exists
```

**Grade principle 1** (Project Basics):
- **Good**: All commands pass cleanly, meaningful test coverage exists
- **Needs work**: Commands pass but with warnings, or test coverage is thin
- **Poor**: Any command fails, or `test`/`build` scripts are missing

### Step 1.2: README assessment

Check for a README at the project root. Evaluate:

1. Does it explain what the CLI does (not what it *is*)?
2. Does it have install/setup instructions that actually work?
3. Does it show the project structure?
4. Is it concise (under 200 lines for a typical project)?

**Grade principle 2** (README and Setup Documentation):
- **Good**: A developer unfamiliar with the project could get it running in 5 minutes
- **Needs work**: README exists but is incomplete, outdated, or verbose
- **Poor**: No README, or README is purely aspirational with no actionable setup instructions

### Step 1.3: Self-documentation check

Run the CLI and inspect its help output:

```
node dist/main.js --help
node dist/main.js <cmd> --help    # for each command
```

For each command and option, check:
- Is there a `.describe()` string? (Shows as help text next to the option)
- Is the description useful — does it say what the option *does*, not what it *is*?

If the CLI has interactive mode, launch it and check:
- Does the welcome message orient the user?
- Does `/help` or tab-completion show available commands?

**Grade principle 3** (Self-Documentation):
- **Good**: A user could accomplish any task from `--help` alone, without reading source
- **Needs work**: Most commands/options have descriptions but some are missing or vague
- **Poor**: Help output is bare names with no descriptions, or welcome message is empty

## Phase 2: Identity & Command Design (Principles 4-6)

### Step 2.1: CLI identity

Read the root `--help` output. Answer:
- Is the CLI name clear and distinctive?
- Does the tagline say what the CLI *does for you* (not the tech stack)?
- Does the command list give a complete picture of capabilities?

**Grade principle 4** (CLI Identity).

### Step 2.2: Command naming

List all commands. For each, evaluate:
- Does the name follow a consistent pattern (noun-verb or verb-noun)?
- Does the description answer "what does this do and when would I use it?"
- Would an agent select the right tool from name + description alone?

Look for: mixed naming patterns, names that duplicate the description, commands named for implementation details.

**Grade principle 5** (Command Naming and Descriptions).

### Step 2.3: Option analysis

For each command, run `<cli> <cmd> --help` and review every option:
- Is the type correct (string vs enum vs boolean vs number)?
- Is `.describe()` present and useful?
- Are there overlapping options that partially control the same thing?
- Are defaults sensible? Are required fields actually required?

**Grade principle 6** (Command Options).

## Phase 3: Architecture (Principles 7-9)

### Step 3.1: Services vs. commands

Review the source for `defineService()` and `defineCommand()` usage:
- Is every long-running process a service? Every run-to-completion action a command?
- Do services have readiness patterns?
- Are lifecycle commands (start/stop/status/logs) generated consistently?

**Grade principle 7** (Services vs. Commands).

### Step 3.2: Config schema

Find the config schema (usually in `defineCli()` or a separate config file). Evaluate:
- Is every field genuinely variable across environments?
- Are `.describe()` strings present?
- Do auto-generated env var names make sense?
- Is there overlap between config fields and command options?

**Grade principle 8** (Config Schema Design).

### Step 3.3: Config vs. options vs. hardcoded

Search the codebase for hardcoded values that should be config, and config values that should be options:
- Look for port numbers, URLs, file paths in command logic
- Look for config fields used by only one command (should be options)
- Look for values that never change sitting in config (should be hardcoded)

**Grade principle 9** (Config vs. Options vs. Hardcoded).

## Phase 4: Agent Readiness (Principles 10-11)

### Step 4.1: Tool surface

Evaluate commands as agent tools. For each command:
- Is the name + description sufficient for an agent to select it correctly?
- Is the output schema informative (not just `{ success: true }`)?
- Are side effects clear from the description?
- Is granularity right — not too coarse, not too fine?

Test: describe a natural-language task and check if the tool list makes the right command obvious.

**Grade principle 10** (Agent Tool Surface).

### Step 4.2: Agent instructions and skills

If the project has an agent, review:
- System prompt: role, domain, boundaries defined?
- Skills: well-scoped, reference actual commands, up to date?
- Guardrails: agent instructed when *not* to use tools?

Test: give the agent a multi-step task. Does it follow skill guidance or improvise?

**Grade principle 11** (Agent Instructions and Skills).

## Phase 5: UX Polish (Principles 12-14)

### Step 5.1: Interactive mode

If the CLI has interactive mode, launch it and evaluate:
- Welcome message: shows CLI identity, key commands, current state?
- Parameter prompting: appropriate for each command?
- Bare text routing: sensible default behavior?
- Auto-completion: discoverable, not overwhelming?

**Grade principle 12** (Interactive Mode Experience).

### Step 5.2: Output design

For each command, run it and check:
- Returns structured data (not `console.log` strings)?
- Streaming used for long operations?
- Error messages are actionable (what went wrong + what to do)?
- Success output confirms what happened?

**Grade principle 13** (Output Design).

### Step 5.3: Triggers and routines

If the project has triggers/routines, review:
- Is each trigger well-scoped with a specific work item type?
- Are filters in place to prevent noise?
- Does the trigger degrade gracefully if its source is unavailable?

**Grade principle 14** (Trigger and Routine Design).

## Phase 6: Framework Compliance (Principle 15)

Search the codebase for framework violations:

```
# Direct process.exit() calls (should return error results)
grep -r "process.exit" src/

# Direct console.log (should use structured output)
grep -r "console.log\|console.error\|console.warn" src/

# Direct ANSI codes (framework handles rendering)
grep -r "\\\\x1b\[\|\\\\033\[" src/

# Top-level heavy imports (should be lazy)
# Review import statements at the top of command files
```

Check for global mutable state — all state should flow through `CommandContext`, config, or the event bus.

**Grade principle 15** (Separation of Concerns).

## Phase 7: Report

### Scoring table

Produce a table with all 15 principles:

```markdown
| # | Principle | Grade | Key Issues |
|---|-----------|-------|------------|
| 1 | Project Basics | Good/Needs work/Poor | ... |
| 2 | README and Setup | Good/Needs work/Poor | ... |
| 3 | Self-Documentation | Good/Needs work/Poor | ... |
| ... | ... | ... | ... |
| 15 | Separation of Concerns | Good/Needs work/Poor | ... |
```

See `references/scoring-rubric.md` for detailed grading criteria.

### Issue list

For each "Needs work" or "Poor" grade, list:
- The specific issue (with `file:line` reference where applicable)
- Why it matters (user impact or agent impact)
- Suggested fix

### Priority ranking

Order improvements by impact:
1. **Blocking**: Poor grades on principles 1-3 (can't build, test, or understand the project)
2. **High**: Poor grades on principles 4-6, 10 (identity and command design affect every interaction)
3. **Medium**: Poor grades on principles 7-9, 15 (architecture issues compound over time)
4. **Low**: Needs-work grades on principles 11-14 (polish items)

### Production readiness

A CLI is **production-ready** when all 15 principles score Good or Needs Work with only minor issues. Any **Poor** score indicates a design problem to resolve before shipping.
