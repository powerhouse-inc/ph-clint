# CLI Optimization Evidence Log — vetra-mastra

## Phase 0: Build & Bootstrap

### [0.1] Fresh install and build
**Command**: `pnpm install && pnpm build`
**Output** (excerpt):
```
Packages: +787
WARN Issues with peer dependencies found:
  @mastra/core -> @ai-sdk/ui-utils -> unmet peer zod@^3.23.8: found 4.3.6
Build:
  Building skills from skills-src
  6 skills built, 3 agent instructions generated
```
**Observation**: Install and build succeed. Peer dependency warning for zod version mismatch (expects zod@^3.23.8 but found 4.3.6). Build includes a skills-building step that compiles agent instructions and SKILL.md files.
**Principle(s)**: 1 (Project Basics)

### [0.2] Run tests
**Command**: `pnpm test`
**Output**:
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        1.961 s
```
**Observation**: All 10 tests pass. Only 1 test suite. Low test count for a CLI with 18+ commands.
**Principle(s)**: 1 (Project Basics)

### [0.3] Run lint
**Command**: N/A — no lint script in package.json
**Observation**: No linting configured.
**Principle(s)**: 1 (Project Basics)

### [0.4] Verify CLI is executable
**Command**: `node dist/main.js --version` → `1.0.0`
**Command**: `node dist/main.js --help` → Full help output captured
**Observation**: CLI runs and produces help output. Version is 1.0.0.
**Principle(s)**: 1 (Project Basics)

---

## Phase 1: Black-Box Discovery

### [1.1] Root help exploration
**Command**: `node dist/main.js --help`
**Observation**:
- CLI name: "vetra-mastra", tagline: "Reactor development with AI agent"
- 18 commands visible, organized around: reactor packages, fusion projects, vetra dev server, fusion dev server, config, init
- Global options: --interactive, --verbose, --resume, --workdir, --config
- Configuration section shows 5 env vars with defaults
- No mention of document modeling, agent skills, or the primary creative workflow
**Principle(s)**: 3 (Self-Documentation), 4 (CLI Identity)

### [1.2] Per-command help
All 18 commands explored with `--help`. Key observations:
- **config**: Excellent help — examples, resolution order, file locations, current values
- **reactor-package-init**: Takes --name (validated regex) and --version
- **vetra-start**: Takes --workdir, --watch, --connectPort, --switchboardPort
- **vetra-manage / fusion-project-manage**: Say "REPL only" — unclear meaning

**Confusion points**:
- No command for "document modeling" — the primary workflow is invisible
- Domain terms (Reactor, Fusion, Switchboard, Connect Studio) used without explanation
- Agent interaction mechanism not documented in help
- "REPL only" on manage commands not explained
**Principle(s)**: 3, 5, 10

### [1.4] Mental model (help-only)
Built from help alone — see cli-optimization-discovery.md for full details. Key gap: could not discover document modeling workflow at all.

---

## Phase 3: Command-by-Command Testing

### [3.1] init — happy path
**Command**: `node dist/main.js init`
**Output**:
```
[init] Store: .ph/vetra-mastra
[init] Installing skills from skills/
[init] Installed 7 skills (7 files)
[init] Workspace initialized
```
**Observation**: Works. Output is informative — tells you what store was created, how many skills installed.
**Principle(s)**: 13 (Output Design)

### [3.2] reactor-package-init — happy path
**Command**: `node dist/main.js reactor-package-init --name todo-list --version dev`
**Output**: Streaming output with progress indicators, npm install, success message with path.
**Observation**: Works well. Takes ~2 minutes due to npm install. Progress feedback via spinner. Final message: "Successfully created project 'todo-list'" with path. Note: `--version dev` required for dev environment (not a CLI issue, testing environment constraint).
**Principle(s)**: 13

### [3.3] reactor-package-init — error paths
**Command**: `node dist/main.js reactor-package-init` (no --name)
**Output**: `error: required option '--name <value>' not specified`
**Rating**: **Informative** — says what's missing but not how to fix it (no usage line shown)

**Command**: `node dist/main.js reactor-package-init --name "invalid name with spaces!"`
**Output**: `Invalid arguments: --name: Invalid string: must match pattern /^[a-zA-Z0-9-_]+$/`
**Rating**: **Guiding** — shows the valid pattern

### [3.4] reactor-packages-list — happy path
**Command**: `node dist/main.js reactor-packages-list`
**Output**: `Found 1 project(s): todo-list (connect:3000, switchboard:4001)`
**Observation**: Clean, informative output with port info.
**Principle(s)**: 13

### [3.5] config — error paths
**Command**: `node dist/main.js config --name nonexistent`
**Output**: `Invalid option: expected one of "apiKey"|"model"|"connectPort"|"switchboardPort"|"phVersion"`
**Rating**: **Guiding** — lists valid options

**Command**: `node dist/main.js config --write foo` (no --name)
**Output**: `--name is required (use --list to show all settings).`
**Rating**: **Guiding** — tells you what's needed and suggests alternative

**Command**: `node dist/main.js config --name apiKey --scope invalid`
**Output**: `Invalid option: expected one of "args"|"env"|"local"|"user"|"sys"`
**Rating**: **Guiding** — lists valid scopes

### [3.6] vetra-start — happy path
**Command**: `node dist/main.js vetra-start --workdir todo-list`
**Output**:
```
✓ drive-url matched (2 remaining)
✓ mcp-server matched (1 remaining)
✓ connect-port matched (0 remaining)
✓ Vetra Dev Server is ready — Connect Studio on port 3001
● Vetra Dev Server [ready]  pid 14027  drive-url=http://localhost:4001/d/vetra-414d8827 mcp-server=http://localhost:4001/mcp connect-studio=3001
```
**Observation**: Excellent readiness feedback — shows each pattern matching, then final status with all endpoints. Very informative.
**Principle(s)**: 7 (Services), 13

### [3.7] vetra-start — error: no workdir
**Command**: `node dist/main.js vetra-start` (no --workdir, run from CLI project root)
**Output**: `✗ Vetra Dev Server failed: Process exited before becoming ready`
**Rating**: **Opaque** — doesn't say WHY it failed. The `ph vetra` command needs to run from a Powerhouse project directory, but the error doesn't mention this. Should say something like "ph vetra failed — are you running from a Reactor package directory? Try: vetra-start --workdir <project-name>"
**Principle(s)**: 13, 3

### [3.8] vetra-logs — error: no logs when stopped
**Command**: `node dist/main.js vetra-logs` (after service stopped)
**Output**: `undefined`
**Rating**: **Opaque** — outputs literal "undefined". Should say "No logs available" or "Service is not running".
**Principle(s)**: 13

### [3.9] vetra-stop — when already stopped
**Command**: `node dist/main.js vetra-stop`
**Output**: `✗ vetra: Service vetra is not running`
**Rating**: **Informative** — clear but could suggest "Use vetra-start to start it"

### [3.10] vetra-restart — reveals command resolution issue
**Command**: `node dist/main.js vetra-restart` (when not running, no workdir)
**Output**:
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "ph-cli" not found
Command failed: pnpm exec ph-cli vetra --watch
```
**Observation**: The restart reveals the underlying command (`pnpm exec ph-cli vetra --watch`) while normal start uses `ph vetra`. This is an inconsistency — restart seems to use a different execution path. The raw error from pnpm leaks through rather than being wrapped.
**Rating**: **Opaque** — raw subprocess error, no guidance
**Principle(s)**: 7, 13

### [3.11] vetra-ps — clean status reporting
**Command**: `node dist/main.js vetra-ps` (when running)
**Output**: `● Vetra Dev Server [ready]  pid 14027  drive-url=... mcp-server=... connect-studio=3001`
**Command**: `node dist/main.js vetra-ps` (when stopped)
**Output**: `○ Vetra Dev Server [idle]`
**Observation**: Excellent — uses different icons (● vs ○) and labels ([ready] vs [idle]) for running/stopped states. Shows all endpoints when running.
**Principle(s)**: 7, 13

### [3.12] --verbose flag inconsistency
**Command**: `node dist/main.js vetra-start --verbose`
**Output**: `error: unknown option '--verbose'`
**Observation**: --verbose is a global option shown in root --help but not accepted by vetra-start. The verbose flag is only available as a global flag before the subcommand.
**Principle(s)**: 6 (Command Options)

---

## Phase 4: Interactive Mode Testing

### [4.1] Welcome screen
**Command**: `node dist/main.js --interactive` (observed via script TTY wrapper)
**Output** (reconstructed from ANSI):
```
  ╖HHHHHHH  ╥HHHHHH╖
  ▒▒▒▒▒▒▒▒h'▒▒▒▒▒▒▒▒    Vetra Mastra
  ▒▒▒▒▒▒▒▒  ╙▒▒▒▒▒▒▒    Reactor + AI Agent
  ╠▒▒▒▒╜"     ╙▒▒▒▒▒
  ,╖╖,         ,,╖╖,
  ▒▒▒▒▒▒╥    ╥▒▒▒▒▒▒
  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒
  ▒▒▒▒▒▒▒▒hj▒▒▒▒▒▒▒▒

  Agent: Mastra + anthropic/claude-haiku-4-5
  Workdir: /home/wouter/projects/demo-workspace/cli-test/vetra-cli
  /reactor-package-init new project   /reactor-packages-list browse
  /fusion-project-init new fusion    /fusion-projects-list browse
  /vetra-start dev server  /fusion-project-start fusion server
```
**Observation**: Nice branded welcome with logo, agent info, workdir, and quick reference commands. Does NOT mention document modeling, agent skills, or how to ask the agent for help.
**Principle(s)**: 12 (Interactive Mode), 3

### [4.2] Interactive mode requires TTY
**Observation**: Piped input causes "Raw mode is not supported" crash from Ink. Expected for Ink-based REPL but could be handled more gracefully (detect non-TTY and fall back to line-mode or print a clear error).
**Principle(s)**: 12

---

## Phase 5: Service Testing

### [5.1-5.4] Vetra service lifecycle
Covered in Phase 3 entries [3.6], [3.7], [3.8], [3.9], [3.10], [3.11].
- Start: Works with --workdir, fails without it (opaque error)
- Status: Excellent — different icons for running/stopped, shows endpoints
- Stop: Clean
- Restart: Has command resolution inconsistency
**Principle(s)**: 7

### [5.5] Service unavailability — commands requiring vetra
Not directly testable — the agent is the primary consumer of the running service, and MCP tools aren't connected (see Phase 6).

---

## Phase 6: Agent Testing

### [6.1] Simple task — ask agent to create document model
**Command**: `node dist/main.js "Create a document model for a todo list"`
**Output** (excerpt):
```
[WorkspaceSkills] document-modeling: Instructions have 1043 lines (recommended: <500)
[WorkspaceSkills] document-modeling: Instructions have ~8164 estimated tokens (recommended: <5000)

I'll help you create a document model for a todo list. Let me start by activating the document modeling skill...
▶ skill({"name":"document-modeling"})
✓ skill → === BEGIN SKILL BRIEFING ===

[Agent proposes schema with state, operations, modules]

Does this proposal align with what you're looking for?
```
**Observation**:
- Agent correctly activates document-modeling skill
- Proposes a reasonable schema unprompted
- Asks for confirmation before implementing (per skill instructions)
- Warning about skill size (1043 lines / ~8164 tokens) — exceeds recommended limits
- Agent CANNOT proceed to implementation because MCP tools aren't connected

**First-try success**: Partial — proposal phase works, implementation phase blocked.
**Principle(s)**: 10, 11

### [6.2] Multi-step task — confirm and implement
**Command**: `node dist/main.js "Yes, proceed with implementing this document model. Keep it simple."`
**Output**: Agent starts fresh — no context from previous conversation. Activates skill again, proposes again, asks for confirmation again.
**Observation**: **Critical issue** — each CLI invocation starts a fresh conversation. The agent cannot carry multi-turn workflows across invocations. The `--resume <thread-id>` flag exists but there's no visible mechanism for getting or passing thread IDs in CLI command mode.
**Principle(s)**: 10, 11, 12

### [6.3] Direct implementation request
**Command**: Full detailed prompt with schema, operations, and "implement it now" instruction
**Output**: Agent explores workspace extensively (lists files, reads configs, checks status) but never reaches implementation. Key observations:
1. `reactor_mcp__list_documents` tool calls produce NO visible output — called 3+ times with no result
2. Agent keeps trying to start vetra even when told it's already running
3. Agent loops: call MCP → no result → explore files → check status → call MCP again
4. The skill explicitly says "MANDATORY: Present your proposal and ask for confirmation" which overrides the user's "just do it" directive

**Confusion inventory**:
| Agent action | Should have done | Cause |
|---|---|---|
| Called `reactor_mcp__list_documents` (failed silently) | Should have gotten document list | MCP tools not connected to agent — `connectMcp()` never called |
| Tried to start vetra again | Should have used running instance | `vetra-ps` result not showing readiness from agent's perspective, or agent ignoring it |
| Looped on file exploration | Should have proceeded to create via MCP | No MCP tools available, so agent falls back to exploration |
| Asked for confirmation despite "just do it" | Should have proceeded | Skill instructions override user directive |

**First-try success rate**: 0/3 tasks completed implementation.
**Root cause**: MCP tools are not connected to the agent (see Phase 7).
**Principle(s)**: 10, 11

### [6.4] Agent tool surface gaps
The agent has these tools available:
- CLI command tools (reactor-package-init, vetra-start, etc.) — ✅ working
- Workspace tools (mastra_workspace_list_files, mastra_workspace_read_file) — ✅ working
- Skill activation — ✅ working
- `reactor_mcp__*` tools — ❌ NOT CONNECTED

The entire document modeling workflow depends on `reactor_mcp__*` tools to:
1. List documents in the vetra drive
2. Create document model specifications
3. Add operations and state schemas
4. Create test documents in the preview drive

Without these tools, the agent cannot complete its primary workflow.

---

## Phase 7: Source Code Review

### [7.1] README vs help comparison
README mentions: "MCP client — dynamic tool discovery via Model Context Protocol" and lists 7 skills including document-modeling. Neither MCP tools nor skills are mentioned in `--help`. README accurately describes the project structure but doesn't explain the end-to-end workflow.

### [7.2] MCP integration — BROKEN
**File**: `src/mcp/client.ts`
- `connectMcp()`, `disconnectMcp()`, `getMcpTools()` functions exist
- `connectMcp()` is NEVER CALLED anywhere in the codebase
- The agent is created with only `cliTools` (line 77 of agent-rupert.ts): `tools: cliTools`
- No dynamic tool injection — tools are static, not `async () => ({...})`
- The MCP server URL IS captured by the service readiness pattern, but never passed to `connectMcp()`

**Comparison with prototype** (found by subagent):
The prototype at `ph-clint/prototypes/agent-rupert-cli/` correctly:
1. Uses `async () => ({ ...cliTools, ...(await getReactorMcpTools()) })` for dynamic tools
2. Calls `connectReactorMcp(result.mcpServer)` when the project starts
3. Merges MCP tools with CLI tools

This integration pattern was NOT ported to the vetra-mastra example.

### [7.3] Framework compliance
- **No `process.exit` calls** — ✅
- **`console.log` in cli.ts event handlers** — these are event callbacks, acceptable
- **`console.log` in mastra/index.ts** — debug logging that should use the logger
- **No raw ANSI escapes in commands** — welcome screen uses them in cli.ts but that's the framework's interactive handler

### [7.4] Output design
- Commands return `{ text: string, data?: T }` objects — ✅ good pattern
- `reactor-packages-list` returns both human text and structured data — ✅ excellent
- `reactor-package-init` returns `{ text: string }` — adequate

### [7.5] Zod schema review
- `configSchema`: All fields have `.describe()` — ✅
- `vetraParams`: Fields have `.describe()`, uses `z.coerce.number()` — ✅
- `reactor-package-init inputSchema`: Name has regex validation with `.describe()` — ✅
- `version` field uses `z.enum(['staging', 'dev', 'latest'])` — ✅ good use of enum

### [7.6] Agent configuration review
**System prompt** (rupertDevAgentInstructions): Comprehensive — 7400 chars covering:
- Powerhouse fundamentals (Document Model, Document, Drive, Action, Operation)
- Technology primer (Reactor, Connect, Switchboard, Fusion, Vetra)
- Available tools with clear descriptions
- Usage rules for projects, documents, drives
- Document model development expertise

**Key instruction**: "When a reactor project is running, MCP tools (`reactor-mcp__*`) automatically become available for document and drive operations." — This is FALSE in the current implementation. The tools are never injected.

**Document-modeling skill**: Well-structured with planning/implementation/QA phases. Correctly instructs the agent to propose before implementing. However, at 1043 lines (~8164 tokens), it exceeds recommended size limits, which may contribute to haiku-level models struggling with it.

---

## Phase 8 Notes

### Key discrepancies between black-box and source review
1. **MCP tools described as "automatically available" in agent instructions but never connected** — the most critical finding
2. **Agent instructions reference Reactor Packages Folder at `reactor-packages/`** but projects are created in the workdir root
3. **Skill size warnings** visible in runtime output — `document-modeling` at 1043 lines exceeds recommended 500 lines
