---
name: cli-optimization
description: "Black-box QA and grading procedure for a ph-clint CLI project. Discovers the CLI from its own help output, aligns with the user on intended behavior, tests every command, and produces an evidence-backed report against 15 design quality principles. Source code review comes last, not first."
metadata:
  author: Powerhouse
  version: "2.0.0"
compatibility: "Node.js >=22.13, pnpm, access to the CLI project source and a terminal to run commands"
---

# CLI Optimization Skill

A black-box-first QA procedure for ph-clint CLI projects. You will build the CLI, discover it from its own `--help` output (without reading source code), align your understanding with the user, then test every command, error path, and interaction — grading against 15 design principles backed by concrete evidence. Source code review comes last as an audit, not as your starting point.

## Critical Rules

1. **Black-box first.** Do NOT read source code, command implementations, agent skills, or system prompts until Phase 7. Your understanding of the CLI must come from its own help output and from the user — never from peeking at the implementation. Reading source code early is cheating and defeats the purpose of QA.
2. **Test in a temporary directory.** All CLI and agent testing (Phases 3–6) MUST happen in a dedicated temporary directory, not in the project source tree. Create it once at the start of Phase 3 and use it for all subsequent test execution. **Preserve the directory** after testing — its contents are evidence. Record the path in the evidence log and include it in the final report. This prevents test side effects (created files, config, databases) from polluting the source tree and ensures the test environment is reproducible.
3. **Stop early when severe issues pile up.** If at any severity checkpoint (end of Phase 3, 4, 5, or 6) you have accumulated **2–3 severe issues**, stop testing and produce an early-exit report. Severe issues are: commands that crash or produce no output, services that won't start, error messages rated Opaque, agent unable to complete a basic task, or build/test failures. There is no value in exhaustive QA when foundational things are broken — the issues need to be fixed first, and QA can resume in a follow-up session. See "Early Exit" below.
4. **Run everything.** Every command must be executed at least once with valid inputs and once with invalid/missing inputs. Do not grade a command you have not run.
5. **Take notes.** Maintain an Evidence Log (described below) throughout. Every grade must cite specific observations from the log.
6. **Align with the user before testing.** After discovery, present your understanding and ask the user to confirm or correct it. Document what you got wrong — this is valuable signal about the CLI's self-documentation quality.
7. **Capture actual output.** When you run a command, record the exact output (or a representative excerpt). "It works" is not evidence.
8. **Test as a naive user.** Pretend you have never seen this CLI. Can you figure out what to do from the help text alone? Where do you get stuck?

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

## Severity Tracking & Early Exit

### Severe issues

An issue counts as **severe** if any of the following are true:

- A command crashes, hangs, or produces no output at all
- A service won't start and the error is Opaque (no guidance on how to fix it)
- The build or test suite fails (Phase 0 blockers)
- An error message is rated Opaque on a core workflow path (not an edge case)
- The agent cannot complete a basic single-command task (Step 6.1)
- A happy-path execution from the user-confirmed ideal scenario (Phase 2) fails

Track severe issues in a running count in the evidence log. Mark each with **[SEVERE]** in the log entry title.

### Severity checkpoints

At the **end of Phase 3, 4, 5, and 6**, check the severe issue count. If you have accumulated **2 or more severe issues**, trigger an early exit.

### Early exit procedure

When an early exit is triggered:

1. **Stop testing.** Do not proceed to the next phase. Skip directly to producing the early-exit report.
2. **Produce a partial grading report.** Grade only the principles you have evidence for. Mark untested principles as **Blocked** (not N/A — N/A means the feature doesn't exist, Blocked means you couldn't get to it).
3. **Write the early-exit report** and save it as `cli-optimization-report.md`:

```markdown
# CLI Optimization Report (Early Exit)

**Status**: Stopped after Phase [N] — [count] severe issues found
**Test workspace**: [path]
**Resumption**: This QA session should be resumed after the severe issues below are fixed.

## Severe Issues (fix these first)

[For each severe issue:]
### [Number]. [Short title]
**Evidence**: [log entry reference]
**Observed**: [exact output or behavior]
**Impact**: [what this blocks — which later phases and principles can't be tested until this is fixed]
**Suggested fix**: [concrete change]

## Partial Scoring Table

[Same format as Phase 8, but with Blocked entries for untested principles]

## What Was Not Tested

[List the phases and steps that were skipped, and what they would have covered]

## Resumption Notes

[What the QA agent in the follow-up session needs to know — e.g., "Phase 3 was completed for commands X, Y, Z but not A, B. Phase 4+ was not started."]
```

4. **Enter Phase 9** (if the user chose Mode B: Guided Improvement). The improvement cycle works the same way — present the severe issues as the top suggestions and produce dev agent prompts for them. After the user has dispatched fixes, they can start a new QA session to resume where this one left off.

---

## Phase 0: Build & Bootstrap

**Goal**: Get the CLI running so you can discover it from the outside. Do NOT read source code in this phase.

### Step 0.1: Fresh install and build

Run from the project root:

```
pnpm install
pnpm build
```

**Log**: Record exact output. Note any warnings, peer dependency issues, or errors.

### Step 0.2: Run tests

```
pnpm test
```

**Log**: Record pass/fail counts, coverage percentage if reported, and any failures.

### Step 0.3: Run lint (if available)

```
pnpm lint
```

**Log**: Record output. Note suppressions or disabled rules.

### Step 0.4: Verify the CLI is executable

Find the built entry point and run it:

```
node dist/main.js --version   # or however the CLI is invoked
node dist/main.js --help
```

**Log**: Record the exact help output. This is your baseline for all subsequent discovery and testing.

If the CLI doesn't run at all, stop and note this as a blocking issue. Everything downstream depends on a working build.

---

## Phase 1: Black-Box Discovery

**Goal**: Understand what this CLI does using ONLY the CLI's own self-documentation (`--help`, welcome messages, error output). Do NOT read source code, README, agent skills, or system prompts. The point is to test whether the CLI explains itself.

### Step 1.1: Explore the root help

Starting from the root `--help` output captured in Phase 0, examine:

1. **CLI name and tagline** — what does the CLI claim to be?
2. **Command inventory** — list every command visible in `--help`
3. **Global options** — what options are available across all commands?

### Step 1.2: Explore each command's help

For every command listed in the root help, run:

```
node dist/main.js <command> --help
```

**Log** the full help output for each command.

For each command, note in your own words:
- What you *think* this command does (based on name + description only)
- What inputs it requires and what options are available
- What you expect the output to be
- Any confusion — things you can't figure out from the help alone

### Step 1.3: Explore interactive mode (if available)

Launch the CLI with no arguments or with `--interactive` / `repl`. Record:
- What the welcome message tells you
- What `/help` shows
- Whether bare text input is accepted

### Step 1.4: Build your mental model (help-only)

Based solely on the help output, write a summary answering:

1. **What domain does this CLI operate in?** (your best guess)
2. **Who is the primary user?** (developer, operator, end-user, AI agent?)
3. **What are the key workflows?** The 3-5 main things you think a user would do
4. **What are you unsure about?** List every point of confusion, ambiguity, or missing information

**Important**: Do not look up answers. Your confusion IS the data. It measures the CLI's self-documentation quality.

---

## Phase 2: User Alignment

**Goal**: Present your understanding to the user, get corrected, and document the delta as a Preliminary Discovery Report.

### Step 2.1: Present your hypothesis

Show the user your mental model from Step 1.4 and ask:

1. "Here is what I understood from the CLI's help output alone. Is this correct?"
2. "For the task you've asked me to test — what are the ideal high-level steps and the intended outcome?"
3. "Is there anything the help output didn't make clear that I need to know before testing?"

**Wait for the user to respond.** Do not proceed until they confirm or correct your understanding.

### Step 2.1b: Choose the delivery mode

After the user confirms your understanding, ask:

> "After I complete testing and grading, how would you like to proceed?
>
> **A) Report only** — I produce the full grading report with prioritized issues and suggested fixes. You decide what to do with it.
>
> **B) Guided improvement** — After the report, I walk you through the top issues one at a time. For each one, I present 3 high-impact suggestions, you pick one (or suggest an alternative), and I produce a ready-to-use prompt you can hand to a dev agent to make the change. We repeat until you're satisfied."

Record the user's choice. It determines whether Phase 9 runs.

### Step 2.2: Write the Preliminary Discovery Report

Save this to `cli-optimization-discovery.md` in the project directory. It should contain:

```markdown
# Preliminary Discovery Report

## Task Under Test
[What the user asked you to test]

## What I Understood From Help Alone
[Your mental model from Step 1.4]

## What I Got Wrong / Couldn't Figure Out
[Every correction the user provided, and what the help text said (or didn't say) that led you astray]

## What The Help Text Was Missing
[Information the user had to supply that should have been discoverable from --help]

## Ideal Execution Scenario (from user)
[The high-level steps and intended outcome, as described by the user]

## Self-Documentation Quality Signal
[Summary: how well did the CLI explain itself? This feeds into Principles 3, 4, 5]
```

This report is a direct input to the grading of Principles 3 (Self-Documentation), 4 (CLI Identity), and 5 (Command Naming).

### Step 2.3: Identify test scenarios

Now that you understand the intended behavior, write down test scenarios for each command:

- **Happy path**: What inputs would a real user provide? What should happen?
- **Error path**: What happens with missing required args? Wrong types? Invalid values?
- **Edge cases**: Empty strings, very long inputs, special characters, conflicting options

For each service:
- **Start/stop cycle**: Can it be started, checked for status, and stopped?
- **Readiness**: How do you know it's ready?
- **Failure mode**: What happens if a dependency is unavailable?

---

## Phase 3: Command-by-Command Testing

**For every command** listed in the `--help` output, execute the following sub-steps. Do not skip any command.

### Step 3.0: Create the test workspace

Before running any commands, create a temporary directory to use as the working directory for all test execution (Phases 3–6):

```
mktemp -d /tmp/cli-optimization-XXXXXX
```

**Log** the path in the evidence log. All commands from this point forward should be run from (or with `--workdir` pointing to) this directory. Do NOT run test commands from the project source tree.

This directory will accumulate all side effects of testing — created files, config, databases, agent state. **Do not delete it.** Its contents are evidence and will be referenced in the final report.

### Step 3.1: Execute the happy path

Run the command with valid inputs based on the test scenarios from Phase 2. Use the user-confirmed ideal execution as your guide.

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

### Step 3.2: Execute error paths

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

**Observe** (error recovery guidance is a key quality signal — grade strictly here):
- Does the error message say **what** went wrong?
- Does it say **why** it went wrong? (e.g., "port 4001 is not reachable" not just "connection failed")
- Does it tell the user **how to fix it**? (e.g., "Try: vetra-start" or "Run with --port <number>")
- Does it list **prerequisites** if a dependency is missing? (e.g., "Requires a running Switchboard instance — see vetra-start")
- Does it show the **correct usage** when arguments are wrong? (e.g., print the command's usage line)
- Does it exit with a non-zero code?
- Does it show a stack trace (bad) or a human-readable message (good)?

**Rate each error message** on this scale:
- **Guiding**: Tells you what went wrong, why, and how to fix it. A user could recover without searching docs.
- **Informative**: Tells you what went wrong but not how to fix it. The user knows what broke but must figure out the fix.
- **Opaque**: Just says something failed. The user must guess or read source code to recover.

Log the rating for each error message. A CLI where most errors are "Opaque" has a serious self-documentation problem.

### Step 3.3: Test constructability from help alone

For each command, re-read the `--help` output and ask yourself:
- Could a user construct the correct invocation from this help text alone, without source code?
- Is there anything they'd need to guess?
- Cross-reference with the Preliminary Discovery Report — were the commands you got wrong during discovery also the ones with insufficient help text?

**Log** any commands where the help text was insufficient.

### Severity checkpoint

Review the severe issue count. If you have **2 or more [SEVERE] entries**, trigger the early exit procedure. Do not proceed to Phase 4.

---

## Phase 4: Interactive Mode Testing

Skip this phase if the CLI has no interactive mode. Check by running `node dist/main.js` with no arguments or with a `--interactive` / `repl` subcommand.

### Step 4.1: Launch and observe the welcome

Launch interactive mode and record the welcome output.

**Observe**:
- Does it tell you what this CLI is?
- Does it list key commands or tell you how to get help?
- Does it show current state (workspace, configuration, running services)?

### Step 4.2: Test `/help` and completion

Type `/help` and record the output. Try tab-completion if the REPL supports it.

**Observe**:
- Are all commands from `--help` also available here?
- Are descriptions shown?
- Is completion discoverable?

### Step 4.3: Execute commands in interactive mode

Run at least 3 commands from the REPL, including:
- A read-only command (list, status, etc.)
- A mutating command (create, init, etc.)
- A command with required parameters — does it prompt?

**Log** each interaction.

### Step 4.4: Test bare text input

Type plain text (not starting with `/`). What happens?
- If there's an agent, does it respond helpfully?
- If there's no agent, is the error message clear?

### Step 4.5: Test error recovery

Trigger an error in interactive mode. Does the REPL survive, or does it crash?

### Severity checkpoint

Review the severe issue count. If you have **2 or more [SEVERE] entries**, trigger the early exit procedure. Do not proceed to Phase 5.

---

## Phase 5: Service Testing

Skip this phase if the CLI has no services. Check the `--help` output for service-related commands (e.g., `*-start`, `*-stop`, `*-status`).

### Step 5.1: Start each service

```
node dist/main.js <service>-start
```

**Observe**:
- Does it start without errors?
- Is there readiness feedback (a message like "listening on port X")?
- How long does it take to become ready?

**If it fails to start**, pay close attention to the error:
- Does it say what prerequisite is missing? (e.g., "Port 4001 already in use", "Config field 'endpoint' is required")
- Does it suggest how to fix it? (e.g., "Stop the other process on port 4001" or "Set VETRA_ENDPOINT in config")
- Does it distinguish between configuration errors, port conflicts, and missing dependencies?

**Rate** the start-failure error as Guiding / Informative / Opaque.

### Step 5.2: Check service status

```
node dist/main.js <service>-status
```

**Observe**: Does it accurately report running/stopped state?

### Step 5.3: Interact with the running service

If the service exposes an API or affects other commands, test that interaction. Run commands that depend on the service while it's running.

### Step 5.4: Stop the service

```
node dist/main.js <service>-stop
```

**Observe**: Does it stop cleanly? Is the port freed? Does status update?

### Step 5.5: Test service unavailability

Run commands that depend on the service while it's stopped.

**Observe** (this is one of the most important error-quality tests):
- Does the error name the missing dependency? (e.g., "Switchboard is not running" not "connection refused")
- Does it tell the user how to start the dependency? (e.g., "Try: vetra-start")
- Does it distinguish between "service not started" vs. "service started but unhealthy" vs. "wrong configuration"?
- If the service needs config (a port, URL, API key), does the error mention the relevant config field?

**Rate** each dependency-failure error as Guiding / Informative / Opaque (see Phase 3 scale).

### Severity checkpoint

Review the severe issue count. If you have **2 or more [SEVERE] entries**, trigger the early exit procedure. Do not proceed to Phase 6.

---

## Phase 6: Agent Testing

Skip this phase if the CLI has no agent integration. Check by typing bare text in interactive mode or looking for agent-related commands in `--help`.

**Important**: In this phase, test the agent as a user would — by interacting with it through the CLI. Do NOT read the agent's system prompt, skills, or configuration yet. That comes in Phase 7. Your job here is to **observe the agent's chain of thought** — watch how it reasons about tool selection, what confuses it, where it hesitates or backtracks, and where it gets stuck. These observations are the primary evidence for Principles 10 and 11.

### Step 6.1: Test agent with a simple task

Give the agent a simple, single-command task within its domain. For example, if it's a package development CLI, ask it to list packages.

**Log** the agent's response and every tool call it makes (including the arguments it chose).

**Observe the chain of thought:**
- Did it select the right tool on the first try, or did it hesitate between multiple tools?
- If it hesitated, what about the tool names/descriptions caused the ambiguity?
- Did it provide correct arguments, or did it guess/hallucinate parameter values?
- Did it interpret the tool's output correctly, or did it misread structured data?

### Step 6.2: Test agent with a multi-step task

Give the agent a task requiring 2-3 commands in sequence. Something a real user would ask. Use the user-confirmed ideal execution from Phase 2 as your reference.

**Log** the full interaction — every reasoning step, tool call, and response.

**Observe the chain of thought:**
- Did it identify the right sequence of steps, or did it miss steps / add unnecessary ones?
- At each step, did it use the output of the previous step to inform the next? Or did it ignore structured output and improvise?
- Where did it get confused? Note the **exact moment** of confusion — which tool description, output, or error message caused it to go off track.
- Did it recover from intermediate errors, or did it give up / loop?
- Did it follow a recognizable workflow pattern, or did it improvise the entire sequence?

### Step 6.3: Test agent boundaries

Ask the agent to do something outside its domain or capabilities.

**Observe**: Does it refuse gracefully, or does it attempt to hallucinate a solution? Does it suggest an alternative?

### Step 6.4: Test agent with an ambiguous task

Give the agent a vaguely worded request that could map to multiple commands. For example, "set up the project" or "show me what's going on."

**Observe:**
- Does it ask for clarification, or does it guess?
- If it guesses, does it guess correctly? What signal did it use to decide?
- If tool descriptions are ambiguous, note which ones competed for selection.

### Step 6.5: Write the Agent Effectiveness Assessment

After completing steps 6.1–6.4, write an assessment in the evidence log summarizing:

**Confusion inventory** — for each point where the agent got confused or made a wrong choice:
1. What the agent did (the wrong tool call or reasoning step)
2. What it should have done
3. What caused the confusion (ambiguous tool name? vague description? uninformative output? missing workflow guidance?)
4. Where the fix belongs: tool surface (Principle 10) or agent instructions/skills (Principle 11)

**First-try success rate** — for each task, did the agent complete it correctly on the first attempt without backtracking? Track:
- Task → first-try success (yes/no) → if no, what went wrong and what would have prevented it

**Improvement suggestions** — concrete, prioritized recommendations to make the agent more effective at first tries:
- **Tool surface fixes** (Principle 10): rename tools, improve descriptions, add output fields, adjust granularity — changes that help the agent select the right tool and use it correctly without needing skill guidance
- **Skill/instruction fixes** (Principle 11): add workflow steps, add guardrails, reference specific tools, add "when not to use" guidance — changes that help the agent follow multi-step workflows correctly
- **Error recovery fixes** (Principle 13): improve error messages so the agent can self-correct when a tool call fails — the agent should be able to read the error and know what to try next

For each suggestion, note whether it would help the agent succeed on the **first try** (proactive fix) vs. help it **recover after a failure** (reactive fix). Prioritize proactive fixes.

### Severity checkpoint

Review the severe issue count. If you have **2 or more [SEVERE] entries**, trigger the early exit procedure. Do not proceed to Phase 7.

---

## Phase 7: Source Code Review

**Now** — and only now — read the source code. This is the first time you look at the implementation. Focus on aspects that affect the 15 design principles. Compare what you find against your black-box observations from earlier phases.

### Step 7.1: Read the implementation

Read these files (in order, skip any that don't exist):

1. `README.md` — compare against what you learned from `--help` alone
2. `package.json` — name, description, dependencies, scripts
3. The main entry point (usually `src/main.ts` or `src/index.ts`) — find the `defineCli()` call
4. Every file that contains `defineCommand()` or `defineService()` — read the full implementation
5. Config schema — usually passed to `defineCli()` or in a separate file
6. Agent setup — system prompt, skills, tool registration (if the CLI has an agent)

**Log** any discrepancies between what you expected (from black-box testing) and what the source reveals. These discrepancies are high-value findings — they indicate self-documentation failures.

### Step 7.2: Config placement audit

Search for hardcoded values that should be configurable:

```
# Port numbers, URLs, file paths in command logic
grep -rn "localhost\|127\.0\.0\.1\|:\d\{4\}" src/
grep -rn "https\?://" src/
```

Check config fields: is each one used by multiple commands (correct) or just one (should be an option)?

### Step 7.3: Framework compliance audit

Search for violations:

```
grep -rn "process\.exit" src/
grep -rn "console\.\(log\|error\|warn\)" src/
grep -rn "\\\\x1b\[" src/
```

Check for global mutable state: module-level `let` or `var` that's modified at runtime.

### Step 7.4: Output design review

For each command's `execute()` function, check:
- Does it return a typed result object, or does it `console.log`?
- For list-type commands: is the return value an array/object (good) or a formatted string (bad)?
- For mutation commands: does the return value confirm what changed?

### Step 7.5: Zod schema review

For each command's input schema:
- Is every field's type the most specific possible? (`z.enum` over `z.string`, `z.number` over `z.string` for ports)
- Does every field have `.describe()`?
- Are `optional()` / `default()` / required used correctly?

### Step 7.6: Agent configuration review (if applicable)

Now read the system prompt and skills. Summarize in the evidence log:
- What role is the agent told to play?
- What boundaries are set?
- What skills/workflows are defined?
- Do skills reference actual commands by name?
- Compare against the agent's actual behavior observed in Phase 6 — did it follow its instructions?

---

## Phase 8: Grading

**Only after completing phases 0-7** (or after reaching Phase 8 without triggering an early exit), grade each principle. Every grade must cite specific evidence log entries. The Preliminary Discovery Report from Phase 2 is primary evidence for Principles 3, 4, and 5.

Read `references/design-principles.md` and `references/scoring-rubric.md` for the full criteria.

### Test workspace

Include the test workspace path and a summary of its contents at the top of the report:

```markdown
**Test workspace**: `/tmp/cli-optimization-XXXXXX`
**Contents**: [list files/directories created during testing — config files, databases, generated output, etc.]
```

This directory is preserved for the user to inspect. It shows exactly what the CLI produced during testing.

### Scoring table

Produce a table with all 15 principles:

```markdown
| # | Principle | Grade | Evidence | Key Issues |
|---|-----------|-------|----------|------------|
| 1 | Project Basics | Good/Needs work/Poor | [0.1, 0.2, 0.3] | ... |
| 2 | README and Setup | Good/Needs work/Poor | [7.1] | ... |
| 3 | Self-Documentation | Good/Needs work/Poor | [1.1, 1.2, 2.2, 3.3] | ... |
| 4 | CLI Identity | Good/Needs work/Poor | [1.1, 2.2] | ... |
| 5 | Command Naming | Good/Needs work/Poor | [1.2, 2.2] | ... |
| 6 | Command Options | Good/Needs work/Poor | [1.2, 3.2, 7.5] | ... |
| 7 | Services vs. Commands | Good/Needs work/Poor | [5.1-5.5] | ... |
| 8 | Config Schema | Good/Needs work/Poor | [7.2, 7.5] | ... |
| 9 | Config vs. Options vs. Hardcoded | Good/Needs work/Poor | [7.2] | ... |
| 10 | Agent Tool Surface | Good/Needs work/Poor | [1.2, 3.1, 6.5, 7.4] | ... |
| 11 | Agent Instructions | Good/Needs work/Poor | [6.1-6.5, 7.6] | ... |
| 12 | Interactive Mode | Good/Needs work/Poor | [4.1-4.5] | ... |
| 13 | Output Design | Good/Needs work/Poor | [3.1, 3.2, 7.4] | ... |
| 14 | Triggers and Routines | Good/Needs work/Poor | [...] | ... |
| 15 | Separation of Concerns | Good/Needs work/Poor | [7.3] | ... |
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

## Phase 9: Improvement Cycle

This phase depends on the delivery mode chosen in Step 2.1b.

### Mode A: Report Only

The procedure is complete. The grading report, evidence log, discovery report, and preserved test workspace are the deliverables. No further action unless the user asks.

---

### Mode B: Guided Improvement

An iterative cycle where you help the user fix the highest-impact issues one at a time by producing dev agent prompts they can copy/paste.

#### Step 9.1: Select the top 3 suggestions

From the issue list in Phase 8, pick the **3 highest-impact issues** that haven't been addressed yet. For each one, present:

```markdown
### Option [1/2/3]: [Short title]

**Issue**: [What's wrong — cite the evidence log entry and principle]
**Observed**: [The actual behavior or output you saw]
**Impact**: [Why this matters — who it affects and how]

**Proposed fix**: [Concrete, specific change — not "improve the description" but exactly what to change and where]
```

Order by impact: Blocking > High > Medium > Low (using the priority ranking from Phase 8).

#### Step 9.2: User selects

Ask the user:

> "Which of these 3 would you like to tackle first? Or suggest an alternative if you see a more pressing issue."

**Wait for the user to respond.** They may:
- Pick one of the 3 (e.g., "option 2")
- Modify a suggestion (e.g., "option 1, but change the approach to...")
- Propose something else entirely

#### Step 9.3: Produce the dev agent prompt

Based on the user's selection, write a **self-contained prompt** that a dev agent (a separate Claude Code session) can execute without additional context. The prompt must include:

```markdown
## Task

[One-sentence summary of what needs to change]

## Context

[What this CLI does — just enough for the dev agent to understand the domain]
[Which file(s) to change and why]

## Current behavior

[Exact output or code that demonstrates the problem — copied from the evidence log]

## Required change

[Precise description of what to do — specific enough that the dev agent doesn't need to make design decisions]
[Include file paths, function names, and expected patterns where possible]

## Verification

[How to verify the fix works — the exact command(s) to run and what the output should look like]
[Reference the test workspace path if relevant]
```

**Important rules for the prompt:**
- It must be **copy/paste ready** — the user should be able to paste it directly into a new agent session
- It must be **self-contained** — do not reference "the report" or "the evidence log" or anything the dev agent won't have access to
- It must include **verification steps** — so the dev agent can confirm its own fix works
- Keep it focused on **one change** — don't bundle multiple fixes into one prompt

Present the prompt to the user in a code block so they can copy it easily.

#### Step 9.4: Repeat

After the user has dispatched the prompt to a dev agent, ask:

> "Ready for the next one? I'll pick the next 3 highest-impact suggestions from the remaining issues."

If the user confirms, return to Step 9.1. Remove the addressed issue from the pool and select 3 new suggestions from what remains.

The cycle continues until:
- The user says to stop
- All "Poor" and "Needs work" issues have been addressed
- The user is satisfied with the current state

#### Step 9.5: Final summary (when the cycle ends)

When the user stops the cycle, produce a brief summary:

```markdown
## Improvement Cycle Summary

**Issues addressed**: [count] of [total]
**Prompts produced**: [list of one-line summaries]
**Remaining issues**: [list of unaddressed issues, still in priority order]
**Estimated grade impact**: [which principles would move from Poor→Needs work or Needs work→Good if the dev agent prompts are all executed successfully]
```
