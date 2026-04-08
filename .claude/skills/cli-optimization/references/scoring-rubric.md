# CLI Optimization — Scoring Rubric

Detailed grading criteria for each of the 15 design principles. Use this reference when the boundary between grades is ambiguous.

## Three-Level Scale

| Grade | Meaning |
|-------|---------|
| **Good** | Meets the principle consistently across all commands, services, and config. No issues found. |
| **Needs work** | Mostly correct but with specific issues that should be addressed. List them. |
| **Poor** | Systemic problems — the principle is violated across multiple commands or the design misses the point entirely. |

---

## Principle 1: Project Basics

| Grade | Criteria |
|-------|----------|
| Good | `install`, `build`, `test` all pass. Lint exists and is clean. `package.json` is complete. Test coverage is meaningful (not just smoke tests). |
| Needs work | Commands pass but with warnings. Test coverage exists but is thin (<50% or covers only happy paths). Lint has minor suppressions. |
| Poor | `build` or `test` fails. No test script. `package.json` is missing critical fields (`type`, `engines`, `main`/`exports`). |

## Principle 2: README and Setup Documentation

| Grade | Criteria |
|-------|----------|
| Good | README explains purpose, install, setup, run, and project structure. A new developer could get running in 5 minutes. |
| Needs work | README exists but is missing one of: setup instructions, project structure, or prerequisites. Or it's accurate but verbose. |
| Poor | No README. Or README is purely aspirational / auto-generated boilerplate with no actionable content. |

## Principle 3: Self-Documentation

| Grade | Criteria |
|-------|----------|
| Good | Every command and option has a `.describe()`. `--help` at every level is sufficient. Welcome message orients the user. |
| Needs work | Most commands have descriptions but some options lack `.describe()`. Welcome message exists but is minimal. |
| Poor | Majority of commands/options have no descriptions. Help output is bare names. No welcome message. |

## Principle 4: CLI Identity

| Grade | Criteria |
|-------|----------|
| Good | Name is distinctive. Tagline describes user value. Command list gives complete picture. Vocabulary is consistent. |
| Needs work | Identity is clear but tagline could be better, or vocabulary has minor inconsistencies. |
| Poor | Name is generic/confusing. Tagline describes tech stack. Domain vocabulary is inconsistent across commands. |

## Principle 5: Command Naming and Descriptions

| Grade | Criteria |
|-------|----------|
| Good | Consistent naming pattern. Every description answers "what + when." Agent could select correctly from name + description. |
| Needs work | Naming is mostly consistent with 1-2 exceptions. Some descriptions duplicate the name instead of adding value. |
| Poor | Mixed naming patterns. Multiple descriptions are missing or unhelpful. Agent would struggle with tool selection. |

## Principle 6: Command Options

| Grade | Criteria |
|-------|----------|
| Good | Every option has correct type, `.describe()`, sensible defaults. No semantic overlap. Positive boolean flags. |
| Needs work | Most options are well-designed but some lack `.describe()` or use `string` where `enum` would be better. |
| Poor | Multiple options lack descriptions. Types are wrong (string instead of enum/number). Semantic overlap exists. |

## Principle 7: Services vs. Commands

| Grade | Criteria |
|-------|----------|
| Good | Clean separation. All services have readiness patterns. Lifecycle commands are consistent. |
| Needs work | Separation is correct but readiness patterns or lifecycle commands have gaps. |
| Poor | Long-running processes defined as commands. Services lack readiness detection. |

## Principle 8: Config Schema Design

| Grade | Criteria |
|-------|----------|
| Good | Minimal schema. All fields have `.describe()`. Env var names are intuitive. No overlap with options. Defaults are sensible. |
| Needs work | Schema is reasonable but has fields that could be options, or some `.describe()` strings are missing. |
| Poor | Bloated schema with fields that never change. Required fields that should have defaults. No `.describe()` strings. |

## Principle 9: Config vs. Options vs. Hardcoded

| Grade | Criteria |
|-------|----------|
| Good | Every parameterized value is at the correct level. Overrides are explicit and documented. |
| Needs work | Mostly correct but 1-2 values are at the wrong level (e.g., a port hardcoded that should be config). |
| Poor | Systemic misplacement — multiple hardcoded values that should be config, or config values that should be options. |

## Principle 10: Agent Tool Surface

| Grade | Criteria |
|-------|----------|
| Good | All commands work as agent tools. Output schemas are informative. Side effects are documented. Granularity is right. |
| Needs work | Most commands work as tools but some outputs are uninformative or descriptions are vague. |
| Poor | Commands return human-formatted text. Descriptions are too vague for agent selection. Granularity is wrong. |

## Principle 11: Agent Instructions and Skills

| Grade | Criteria |
|-------|----------|
| Good | System prompt defines role/boundaries. Skills are scoped, reference commands, include guardrails. |
| Needs work | Agent setup exists but skills are outdated or missing guardrails. |
| Poor | No system prompt differentiation. Skills are documentation dumps. Agent improvises instead of following guidance. |

## Principle 12: Interactive Mode Experience

| Grade | Criteria |
|-------|----------|
| Good | Welcome message orients user. Prompting is appropriate. Bare text routes sensibly. Auto-completion works. |
| Needs work | Interactive mode works but welcome message is minimal or prompting is over-eager. |
| Poor | No welcome message. Prompting for every optional parameter. Auto-completion is broken or missing. |

## Principle 13: Output Design

| Grade | Criteria |
|-------|----------|
| Good | Structured output for all commands. Streaming where appropriate. Actionable error messages. |
| Needs work | Most output is structured but some commands use `console.log`. Error messages could be more actionable. |
| Poor | Commands primarily use `console.log`. No streaming. Error messages are stack traces or "Failed." |

## Principle 14: Trigger and Routine Design

| Grade | Criteria |
|-------|----------|
| Good | Triggers are well-scoped with filters. Tick interval is appropriate. Graceful degradation. |
| Needs work | Triggers work but filters could be tighter, or degradation is not handled for all sources. |
| Poor | Triggers fire on everything (no filters). Queue growth is unbounded. Crashes when source is unavailable. |

## Principle 15: Separation of Concerns

| Grade | Criteria |
|-------|----------|
| Good | No `process.exit()`, `console.log`, or ANSI codes in implementation. Lazy imports. No global mutable state. |
| Needs work | Mostly clean but 1-2 instances of direct `console.log` or a non-lazy heavy import. |
| Poor | Multiple `process.exit()` calls. Direct ANSI codes. Global mutable state. Heavy top-level imports. |

---

## Overall Production Readiness

| Rating | Criteria |
|--------|----------|
| **Production-ready** | All 15 principles score Good or Needs Work (minor issues only) |
| **Needs iteration** | 1-2 Poor scores, but none on principles 1-3 (build health) |
| **Not ready** | Any Poor score on principles 1-3, or 3+ Poor scores on any principles |
