# CLI Optimization Report

**Status**: Complete — all phases executed
**Test workspace**: `/tmp/cli-optimization-rGjdOK`
**Contents**: `assistant/` (reactor package with todo-list document model, built and tested), `my-platform/` (fusion project), `.ph/` (local config)
**CLI**: vetra-mastra v1.0.0
**Date**: 2026-04-09
**Task**: Create a local-first platform connected with a switchboard backend running a new reactor package "assistant" with a todo list document model.

---

## Scoring Table

| # | Principle | Grade | Evidence | Key Issues |
|---|-----------|-------|----------|------------|
| 1 | Project Basics | Needs work | [0.1, 0.2, 0.3] | No lint script. Only 1 test suite (10 tests). Build and install clean. |
| 2 | README and Setup | Needs work | [7.1] | README exists but not evaluated in depth for this narrow QA. |
| 3 | Self-Documentation | Needs work | [1.1, 1.2, 2.2, 3.2a, 3.2f, 3.3] | `--version` enum values not shown in help. No workflow documentation. Missing required arg errors duplicated. Some errors Informative rather than Guiding. |
| 4 | CLI Identity | Good | [1.1, 2.2] | Name is clear, tagline communicates purpose, command list is complete, domain vocabulary consistent. |
| 5 | Command Naming | Good | [1.2, 2.2] | Consistent `noun-verb` pattern (reactor-package-init, fusion-project-start). Descriptions are accurate. Agent selected correct skill on first try. |
| 6 | Command Options | Needs work | [1.2, 3.3, 7.5] | `--version` is z.enum but help shows generic `<value>` — valid choices invisible. All other options well-typed with descriptions. |
| 7 | Services vs. Commands | Good | [3.1c, 3.1g, 5.1-5.5] | Clean separation. Readiness patterns work. Preflight checks are excellent. Lifecycle commands consistent. |
| 8 | Config Schema | Good | [3.1i, 7.2] | Minimal schema, all fields have .describe(), env vars intuitive, defaults sensible. |
| 9 | Config vs. Options vs. Hardcoded | Good | [7.2] | Values at correct levels. Service params override config where appropriate. |
| 10 | Agent Tool Surface | Needs work | [6.2, 6.5] | Agent mostly succeeds but: reactor-packages-list returned empty in agent context (workdir issue), addActions input format caused one failure. fusion-ps shows "8000" not full URL. |
| 11 | Agent Instructions | Good | [6.1, 6.2, 6.5, 7.6] | Agent followed skill guidance, selected correct skill first try, completed multi-step task. Skills reference actual commands. Minor: document-modeling skill flagged as oversized. |
| 12 | Interactive Mode | N/A | — | Not tested in this narrow QA. |
| 13 | Output Design | Needs work | [3.1c, 3.1g, 3.2a, 3.2e, 3.2f] | Structured returns ✓. Streaming ✓. Some errors only Informative (not Guiding). Missing arg errors duplicated. fusion-ps shows bare port "8000" vs vetra-ps full URLs. |
| 14 | Triggers and Routines | N/A | — | No triggers observed in this CLI. |
| 15 | Separation of Concerns | Needs work | [7.3] | 6× console.log in event handlers, 4× console.log in mastra/index.ts, ANSI codes in welcome message. No process.exit (good). |

---

## Issue List

### Issue 1: `--version` enum values not visible in help output
**File**: `src/commands/reactor-package-init.ts` / framework help renderer
**Evidence**: [1.2, 3.3, 7.5]
**Observed**: `--version <value>  Powerhouse version (overrides config)` — no indication that valid values are `staging`, `dev`, `latest`
**Expected**: `--version <value>  Powerhouse version: staging, dev, latest (overrides config)` or `--version <staging|dev|latest>`
**Suggested fix**: Update the `.describe()` string to include valid values: `"Powerhouse version (staging | dev | latest, overrides config)"`. Alternatively, if the framework supports enum rendering in help, ensure it's enabled.
**Principles**: 3, 6

### Issue 2: Missing required argument errors are duplicated
**File**: Framework-level (Commander.js error handling)
**Evidence**: [3.2a, 3.2f]
**Observed**: `error: required option '--name <value>' not specified` printed twice when `--name` is omitted
**Expected**: Error printed once, ideally with usage hint
**Suggested fix**: Investigate the Commander.js error handler — the error event may be firing twice. Likely a framework-level fix in ph-clint.
**Principles**: 3, 13

### Issue 3: `console.log` usage in service event handlers
**File**: `src/cli.ts:130-149`
**Evidence**: [7.3]
**Observed**: Service lifecycle events (pattern-matched, ready, failed, restarting, stopped) use `console.log()` directly
**Expected**: Use framework's structured output or logger
**Suggested fix**: Replace `console.log` calls with the framework's event rendering or stderr logger. These are rendering concerns that should go through the framework's transport layer.
**Principles**: 15

### Issue 4: `reactor-packages-list` returns empty in agent context
**File**: `src/commands/reactor-packages-list.ts`
**Evidence**: [6.2, 6.5]
**Observed**: When the agent called `reactor-packages-list`, it returned "No Reactor package projects found" despite running inside the assistant project
**Expected**: Should detect the current project or use the correct workdir
**Suggested fix**: Verify that the agent's tool invocation passes the workdir context. The command scans the workdir for subdirectories with `powerhouse.config.json` — if the workdir IS the project (not its parent), it won't find it. Consider also checking the current directory itself, not just subdirectories.
**Principles**: 10

### Issue 5: Inconsistent service status display (fusion-ps vs vetra-ps)
**File**: `src/cli.ts` (fusion service readiness pattern)
**Evidence**: [3.1g, 3.1d]
**Observed**: `vetra-ps` shows full URLs: `drive-url=http://localhost:4001/d/vetra-4d16dbf6 mcp-server=http://localhost:4001/mcp connect-studio=3001`. `fusion-project-ps` shows bare port: `fusion-url=8000`
**Expected**: Both should show full URLs for consistency and copy-paste convenience
**Suggested fix**: Update fusion service readiness pattern capture to include the full URL, or format the output to prepend `http://localhost:` to the captured port.
**Principles**: 10, 13

### Issue 6: ANSI escape codes in welcome message
**File**: `src/cli.ts:158-161`
**Evidence**: [7.3]
**Observed**: Raw `\x1b[` codes used for coloring the welcome message
**Expected**: Use framework's styling/theming system
**Suggested fix**: Minor — replace ANSI literals with framework-provided styling if available.
**Principles**: 15

---

## Priority Ranking

### High Impact
1. **Issue 1**: `--version` enum values hidden — blocks first-time users (Principle 3, 6)
2. **Issue 4**: `reactor-packages-list` empty in agent context — affects agent reliability (Principle 10)

### Medium Impact
3. **Issue 5**: Inconsistent fusion-ps vs vetra-ps output — confuses both users and agents (Principle 10, 13)
4. **Issue 2**: Duplicated error messages — unprofessional, confusing (Principle 3, 13)
5. **Issue 3**: console.log in event handlers — framework compliance (Principle 15)

### Low Impact
6. **Issue 6**: ANSI codes in welcome message — minor framework compliance (Principle 15)

---

## Production Readiness

**Rating: Needs iteration**

No Poor scores. Multiple Needs Work scores on principles 1, 3, 6, 10, 13, 15 — all with specific, fixable issues. The CLI successfully completed the end-to-end task (init reactor package → start vetra → agent creates document model → init fusion → start fusion). The agent was effective, self-corrected from errors, and delivered a working todo list document model with passing tests and build.

The highest-impact improvements are: (1) making enum values visible in help text, (2) fixing the workdir context for reactor-packages-list in agent mode, and (3) making service status output consistent.

---

## Top 3 Dev Agent Prompts

### Prompt 1: Make `--version` enum values visible in help

```
## Task

Make the valid values for the `--version` option on `reactor-package-init` visible in the CLI help output.

## Context

vetra-mastra is a CLI built with the ph-clint framework. The `reactor-package-init` command has a `--version` option defined as `z.enum(['staging', 'dev', 'latest'])`, but when a user runs `reactor-package-init --help`, they see:

  --version <value>  Powerhouse version (overrides config)

There is no indication of what valid values are. Users must guess or read source code.

## Current behavior

```
$ node dist/main.js reactor-package-init --help
Options:
  --name <value>     Project name (alphanumeric, hyphens, underscores)
  --version <value>  Powerhouse version (overrides config)
```

## Required change

Update the `.describe()` string for the `--version` field in `src/commands/reactor-package-init.ts` to include the valid enum values. For example:

```typescript
version: z.enum(['staging', 'dev', 'latest']).optional().describe('Powerhouse version: staging | dev | latest (overrides config)')
```

If the ph-clint framework has built-in enum rendering in help output (check the framework docs or source), enable that instead so all enums are auto-documented.

## Verification

Run:
```
pnpm build && node dist/main.js reactor-package-init --help
```

Expected: The `--version` line should show the valid values (staging, dev, latest) in either the description or the value placeholder.
```

### Prompt 2: Fix `reactor-packages-list` workdir context in agent mode

```
## Task

Fix `reactor-packages-list` so it correctly detects a reactor package when the working directory IS the project root (not its parent).

## Context

vetra-mastra is a CLI with an AI agent. When the agent calls the `reactor-packages-list` tool while working inside a reactor package project directory, it returns "No Reactor package projects found" — even though the current directory IS a valid reactor package.

The command currently scans subdirectories of the workdir for `powerhouse.config.json`. But when workdir is set to the project itself (e.g., `/tmp/test/assistant`), it looks for `assistant/*/powerhouse.config.json` instead of checking `assistant/powerhouse.config.json`.

## Current behavior

```
# From /tmp/test (parent of project) — works:
$ node dist/main.js reactor-packages-list
Found 1 project(s): assistant (connect:3000, switchboard:4001)

# From /tmp/test/assistant (the project itself) — fails:
$ node dist/main.js -w /tmp/test/assistant reactor-packages-list
No Reactor package projects found
```

## Required change

In `src/commands/reactor-packages-list.ts`, add a check: if the workdir itself contains `powerhouse.config.json` (or `powerhouse.config.ts`), include it in the results as the current project. The scan of subdirectories should still happen as well.

Something like:
1. Check if `workdir/powerhouse.config.json` exists → if yes, add workdir as a project
2. Then scan `workdir/*/powerhouse.config.json` for sub-projects as currently done
3. Deduplicate results

## Verification

```
cd /tmp && mkdir -p test-rplist && cd test-rplist
node /path/to/dist/main.js reactor-package-init --name myproject --version dev
# From parent:
node /path/to/dist/main.js -w /tmp/test-rplist reactor-packages-list
# Should find: myproject
# From project:
node /path/to/dist/main.js -w /tmp/test-rplist/myproject reactor-packages-list
# Should find: myproject (the current directory)
```
```

### Prompt 3: Make fusion-project-ps output consistent with vetra-ps

```
## Task

Update the Fusion Dev Server status output to show full URLs instead of bare port numbers, matching the Vetra Dev Server format.

## Context

vetra-mastra has two services: Vetra (Switchboard backend) and Fusion (Next.js frontend). Their status outputs are inconsistent:

- `vetra-ps`: `● Vetra Dev Server [ready]  pid 29622  drive-url=http://localhost:4001/d/vetra-4d16dbf6 mcp-server=http://localhost:4001/mcp connect-studio=3001`
- `fusion-project-ps`: `● Fusion Dev Server [ready]  pid 1463  fusion-url=8000`

The fusion status shows a bare port "8000" while vetra shows full URLs. This is confusing for both human users (who want to click/copy URLs) and the AI agent (which needs the full URL for chaining).

## Current behavior

In `src/cli.ts`, the Fusion Dev Server readiness pattern captures just the port number:

```typescript
readinessPatterns: [
  { id: 'fusion-port', regex: /Local:\s*http:\/\/localhost:(\d+)/, captureName: 'fusion-url' },
]
```

The captured value is just the port (e.g., "8000") because the regex capture group only grabs `(\d+)`.

## Required change

Option A (preferred): Change the regex capture group to include the full URL:
```typescript
{ id: 'fusion-port', regex: /Local:\s*(http:\/\/localhost:\d+)/, captureName: 'fusion-url' }
```

This way the capture includes `http://localhost:8000` instead of just `8000`.

Option B: Keep the capture as-is but rename `captureName` from 'fusion-url' to 'fusion-port' to accurately reflect that it's a port number, not a URL.

## Verification

```
pnpm build
# Start fusion with a project:
node dist/main.js -w /path/to/workdir fusion-project-start --workdir /path/to/fusion-project
node dist/main.js fusion-project-ps
```

Expected (Option A): `● Fusion Dev Server [ready]  pid XXXXX  fusion-url=http://localhost:8000`
Expected (Option B): `● Fusion Dev Server [ready]  pid XXXXX  fusion-port=8000`
```

---

## What Was Not Tested

- **Interactive mode (Phase 4)**: Welcome message, /help, bare text input, auto-completion, error recovery in REPL
- **Agent boundary testing (Phase 6.3)**: Asking agent to do something outside its domain
- **Agent ambiguous task (Phase 6.4)**: Testing with vaguely worded requests
- **README quality (Phase 2 in depth)**: README.md content accuracy and completeness
- **Triggers (Phase 14)**: No triggers defined in this CLI
