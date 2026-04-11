# CLI Optimization Evidence Log

**Test workspace**: `/tmp/cli-optimization-rGjdOK`
**CLI**: vetra-mastra v1.0.0
**Date**: 2026-04-09

---

## Phase 0: Build & Bootstrap

### [0.1] Fresh install and build
**Command**: `pnpm install && pnpm build`
**Output** (excerpt):
```
Done in 5.6s using pnpm v10.26.0
Building skills from skills-src
--- Building agent instructions ---
  OK RupertDevAgent → rupertDevAgentInstructions (7445 chars)
  OK ReactorPackageDevAgent → reactorPackageDevAgentInstructions (15819 chars)
  OK FusionDevAgent → fusionDevAgentInstructions (6655 chars)
--- Building SKILL.md files ---
  OK document-editor-creation → SKILL.md (2 scenarios, 16916 chars)
  OK document-modeling → SKILL.md (4 scenarios, 42673 chars)
  OK fusion-development → SKILL.md (1 scenarios, 3233 chars)
  OK fusion-project-management → SKILL.md (4 scenarios, 4728 chars)
  OK handle-stakeholder-message → SKILL.md (3 scenarios, 10228 chars)
  OK reactor-package-project-management → SKILL.md (3 scenarios, 2873 chars)
Done.
```
**Observation**: Clean build. No errors or TypeScript warnings. Skill build step compiles instructions and SKILL.md files from skills-src.
**Principle(s)**: 1 (Project Basics)

### [0.2] Run tests
**Command**: `pnpm test`
**Output** (excerpt):
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        3.065 s
```
**Observation**: All 10 tests pass. Only 1 test suite — coverage is thin but tests exist and pass.
**Principle(s)**: 1 (Project Basics)

### [0.3] Run lint
**Command**: `pnpm lint`
**Output**: No lint script defined in package.json.
**Observation**: No linting configured.
**Principle(s)**: 1 (Project Basics)

### [0.4] Verify CLI is executable
**Command**: `node dist/main.js --version` → `1.0.0`
**Command**: `node dist/main.js --help` → Full help output captured (see Phase 1).
**Observation**: CLI runs correctly from built dist.
**Principle(s)**: 1 (Project Basics)

---

## Phase 1: Black-Box Discovery

### [1.1] Root help output
**Command**: `node dist/main.js --help`
**Output**: See discovery report. Lists 17 commands, 6 agent skills, 5 config fields, global options.
**Observation**: Well-structured help. Shows commands, skills, config fields with env var names and defaults. Tagline "Reactor development with AI agent" is clear. Missing: workflow guidance, concept definitions (what is a Reactor package? Switchboard? Fusion project?).
**Principle(s)**: 3 (Self-Documentation), 4 (CLI Identity)

### [1.2] Command help exploration
**Observation**: All commands have --help with descriptions and option documentation. `reactor-package-init --version` says "Powerhouse version (overrides config)" but doesn't list valid values — it's actually a z.enum(['staging','dev','latest']) in source, but help shows it as a generic `<value>`. `fusion-project-start --switchboardUrl` defaults to `http://localhost:4001/graphql` — this implicitly documents the Switchboard relationship but doesn't explain it. Config command has excellent help with examples and layer documentation.
**Principle(s)**: 3 (Self-Documentation), 5 (Command Naming), 6 (Command Options)

### [1.3] Interactive mode
Not tested in this phase — deferred to Phase 4.

### [1.4] Mental model
See discovery report. Key confusion: no workflow documentation, no concept definitions, --version valid values unknown.
**Principle(s)**: 3, 4, 5

---

## Phase 2: User Alignment

### [2.1-2.3] User corrections
- Execution order was correct as guessed
- `--version dev` only needed on reactor-package-init (not vetra-start)
- Agent should create the document model (not a command)
- Delivery mode: A (Report only) + top 3 prompts

**Discovery gaps confirmed by user**: --version valid values not documented, workflow order not documented.

---

## Phase 3: Command-by-Command Testing

### [3.0] Test workspace
**Path**: `/tmp/cli-optimization-rGjdOK`

### [3.1a] reactor-package-init — Happy path
**Command**: `node dist/main.js reactor-package-init --name assistant --version dev`
**Output**: Multi-step progress with spinners: create directory → git init → create boilerplate → npm install → format files → success message.
**Observation**: Clear progress feedback with ✅ checkmarks per step. Final message: `Successfully created project "assistant"`. npm install takes ~2 minutes with peer dep warnings (expected for large Powerhouse deps). Output includes "Shell cwd was reset to /home/wouter/projects/demo-workspace/cli-test" — this appears to be framework behavior resetting workdir.
**Principle(s)**: 10 (Agent Tool Surface), 13 (Output Design)

### [3.1b] reactor-packages-list — Happy path
**Command**: `node dist/main.js reactor-packages-list` (from /tmp/cli-optimization-rGjdOK)
**Output**: `Found 1 project(s): assistant (connect:3000, switchboard:4001)`
**Observation**: Shows project name and port config. Informative output. Returns structured data internally.
**Principle(s)**: 10, 13

### [3.1c] vetra-start — Happy path
**Command**: `node dist/main.js vetra-start --workdir /tmp/cli-optimization-rGjdOK/assistant`
**Output**:
```
  ✓ drive-url matched (2 remaining)
  ✓ mcp-server matched (1 remaining)
  ✓ connect-port matched (0 remaining)
✓ Vetra Dev Server is ready — Connect Studio on port 3001
● Vetra Dev Server [ready]  pid 29622  drive-url=http://localhost:4001/d/vetra-4d16dbf6 mcp-server=http://localhost:4001/mcp connect-studio=3001
```
**Observation**: Excellent readiness feedback — shows each pattern matched with countdown. Final status line shows all endpoints. Port 3001 instead of default 3000 (likely port conflict auto-adjustment or readiness pattern captured actual port).
**Principle(s)**: 7 (Services), 13 (Output Design)

### [3.1d] vetra-ps — Happy path
**Command**: `node dist/main.js vetra-ps`
**Output**: `● Vetra Dev Server [ready]  pid 29622  drive-url=... mcp-server=... connect-studio=3001`
**Observation**: Clear status with all metadata.
**Principle(s)**: 7, 13

### [3.1e] vetra-logs — Happy path
**Command**: `node dist/main.js vetra-logs --lines 10`
**Output**: Shows Switchboard URLs, Drive URLs, Vite startup logs.
**Observation**: Useful output showing actual service logs.
**Principle(s)**: 7, 13

### [3.1f] fusion-project-init — Happy path
**Command**: `node dist/main.js -w /tmp/cli-optimization-rGjdOK fusion-project-init --name my-platform`
**Output**: `Cloning into 'my-platform'... pnpm install... Fusion project my-platform initialized at /tmp/cli-optimization-rGjdOK/my-platform`
**Observation**: Clean output. Uses git clone + pnpm install. Success message confirms path.
**Principle(s)**: 10, 13

### [3.1g] fusion-project-start — Happy path
**Command**: `node dist/main.js -w /tmp/cli-optimization-rGjdOK fusion-project-start --workdir /tmp/cli-optimization-rGjdOK/my-platform`
**Output**:
```
✓ fusion-port matched (0 remaining)
✓ Fusion Dev Server is ready
● Fusion Dev Server [ready]  pid 1463  fusion-url=8000
```
**Observation**: Readiness detection works. Note: fusion-url shows just "8000" not the full URL — inconsistent with vetra-ps which shows full URLs.
**Principle(s)**: 7, 13

### [3.1h] fusion-projects-list — Happy path
**Command**: `node dist/main.js fusion-projects-list`
**Output**: `Found 1 Fusion project(s): my-platform`
**Observation**: Simple and clear.
**Principle(s)**: 10, 13

### [3.1i] config --list — Happy path
**Command**: `node dist/main.js config --list`
**Output**: Shows all 5 config fields with current values and source (user/default).
**Observation**: Excellent config display. Shows resolved value and source layer.
**Principle(s)**: 8, 13

### [3.2a] reactor-package-init — Missing required arg
**Command**: `node dist/main.js reactor-package-init`
**Output**: `error: required option '--name <value>' not specified`
**Observation**: Error message is **Informative** — says what's missing but doesn't show full usage or hint. Message is duplicated (printed twice).
**Rating**: Informative
**Principle(s)**: 3, 13

### [3.2b] reactor-package-init — Invalid name
**Command**: `node dist/main.js reactor-package-init --name "invalid name!@#" --version dev`
**Output**: `Invalid arguments for 'reactor-package-init' --name: Invalid string: must match pattern /^[a-zA-Z0-9-_]+$/`
**Observation**: **Informative** — shows the regex constraint. Could be more guiding by showing an example valid name.
**Rating**: Informative
**Principle(s)**: 3, 13

### [3.2c] reactor-package-init — Duplicate name
**Command**: `node dist/main.js reactor-package-init --name assistant --version dev`
**Output**: `Project assistant already exists at /tmp/cli-optimization-rGjdOK/assistant`
**Observation**: **Guiding** — tells you what and where. Idempotent check works.
**Rating**: Guiding
**Principle(s)**: 3, 13

### [3.2d] vetra-start — No reactor package project
**Command**: `node dist/main.js vetra-start` (from /tmp/cli-optimization-rGjdOK)
**Output**: `✗ vetra: Vetra Dev Server: Not a Reactor Package project (cwd: /tmp/cli-optimization-rGjdOK) Hint: Run vetra-start --workdir <project>, or create one with /reactor-package-init`
**Observation**: **Guiding** — tells what's wrong, shows the cwd that failed, and suggests two fixes. Excellent error.
**Rating**: Guiding
**Principle(s)**: 3, 13

### [3.2e] vetra-stop — Already stopped
**Command**: `node dist/main.js vetra-stop`
**Output**: `✗ vetra: Service vetra is not running`
**Observation**: **Informative** — says it's not running but doesn't suggest how to start it.
**Rating**: Informative
**Principle(s)**: 3, 13

### [3.2f] fusion-project-init — Missing required arg
**Command**: `node dist/main.js fusion-project-init`
**Output**: `error: required option '--name <value>' not specified` (duplicated)
**Observation**: Same as reactor-package-init — **Informative**, duplicated message.
**Rating**: Informative
**Principle(s)**: 3, 13

### [3.3] Constructability from help alone
**Observation**: Most commands are constructable from help alone. The key gap is `--version` on reactor-package-init — help says `<value>` but valid values (staging, dev, latest) are not shown. A user would have to guess. The `config` command has exemplary help with full examples.
**Principle(s)**: 3, 6

### Severity checkpoint: 0 severe issues. Proceeding.

---

## Phase 4: Interactive Mode Testing

Skipped for this narrow QA — focus was on the specific workflow. Interactive mode exists (--interactive flag).

---

## Phase 5: Service Testing

### [5.1a] vetra-start — Start
See [3.1c]. Starts successfully with readiness patterns.

### [5.1b] vetra-start — Already running
**Command**: `node dist/main.js vetra-start` (while already running)
**Output**: `✗ vetra: Service vetra is already running (pid 29622)`
**Observation**: **Informative** — says it's running with PID. Doesn't suggest what to do instead (restart? check status?).
**Rating**: Informative
**Principle(s)**: 7, 13

### [5.2] vetra-ps
See [3.1d]. Accurately reports running/stopped state with metadata.

### [5.3] Interact with running service
The agent successfully used the Switchboard MCP through the running service to create documents, add actions, and query state. This confirms the service is fully functional.
**Principle(s)**: 7

### [5.4] vetra-stop
**Command**: `node dist/main.js vetra-stop`
**Output**: `■ Vetra Dev Server stopped / ■ vetra stopped`
**Observation**: Clean stop. Two-line output (one from framework, one from event handler).
**Principle(s)**: 7

### [5.5] Service unavailability
See [3.2d]. When vetra isn't running and you try to start from wrong directory, error is Guiding.

### Severity checkpoint: 0 severe issues. Proceeding.

---

## Phase 6: Agent Testing

### [6.1] Simple task — Create todo list document model
**Command**: `node dist/main.js --workdir /tmp/cli-optimization-rGjdOK/assistant "Create a simple todo list document model..."`
**Observation**: Agent activated `document-modeling` skill, proposed a model with schema and operations, then waited for confirmation. Excellent first-try skill selection. Agent chose the correct skill immediately without hesitation.
**Principle(s)**: 10, 11

### [6.2] Multi-step task — Full implementation
**Command**: Resumed with "Yes, looks good. Proceed with implementation."
**Tool calls observed (in order)**:
1. `reactor-packages-list` — checked workspace (returned "No Reactor package projects found" — confusing, since we're inside one)
2. `mastra_workspace_list_files` — explored project structure
3. `mastra_workspace_read_file` × 2 — read config files
4. `mastra_workspace_list_files` — tried to list vetra-cli source (wrong path)
5. `mastra_workspace_execute_command` — ran pwd to orient
6. `vetra-start` — tried to start (already running, got informative error)
7. `vetra-ps` — checked status (recovered correctly)
8. `vetra-mcp__getDrives` — listed drives
9. `vetra-mcp__getDocuments` — checked for existing docs
10. `vetra-mcp__createDocument` — created document model spec
11. `vetra-mcp__getDocumentModelSchema` — got schema for document-model type
12. `vetra-mcp__addActions` — first attempt failed (input format wrong)
13. `vetra-mcp__addActions` — second attempt succeeded (self-corrected)
14. `vetra-mcp__addActions` × 3 — set state schema, add module, add operations
15. `vetra-mcp__getDocument` — verified creation
16. `mastra_workspace_list_files` — checked generated code structure
17. `mastra_workspace_read_file` × 3 — read generated types and reducers
18. `mastra_workspace_edit_file` — implemented reducers
19. `vetra-mcp__addActions` — set operation reducers in spec
20. `mastra_workspace_execute_command` — ran tests (all passed)
21. `mastra_workspace_execute_command` — ran build (succeeded)
22. `vetra-mcp__createDocument` — created test document
23. `vetra-mcp__addActions` × 2 — tested operations on test document

**Observation**:
- **First-try skill selection**: ✓ Correct
- **Step 1 confusion**: `reactor-packages-list` returned "No Reactor package projects found" even though we were inside one — the workdir context wasn't passed correctly to the tool. Agent recovered by using workspace tools to orient.
- **Step 6 self-correction**: Agent tried `vetra-start` (already running), got clear error, immediately checked `vetra-ps` instead. Good error recovery.
- **Step 12 self-correction**: `addActions` failed with wrong input format (passed string instead of object). Error message from MCP was somewhat opaque (showed raw validation error), but agent correctly inferred the fix and succeeded on retry.
- **Overall**: Agent completed the full implementation successfully with minimal backtracking. Total: 23 tool calls, 1 error recovery (input format), 1 unnecessary call (vetra-start when already running).
**Principle(s)**: 10, 11

### [6.5] Agent Effectiveness Assessment

**Confusion inventory**:
1. `reactor-packages-list` returned empty when called from agent context — workdir not propagated. Fix belongs to: tool surface (Principle 10).
2. `addActions` input format mismatch (string vs object for SET_MODEL_ID) — MCP schema not fully self-documenting. Fix belongs to: tool surface (Principle 10).
3. Agent tried to navigate to vetra-cli source directory — confused about workspace boundary. Fix belongs to: agent instructions (Principle 11).

**First-try success rate**:
- Skill selection: ✓ first try
- Document model creation: ✓ first try
- Reducer implementation: ✓ first try
- addActions input format: ✗ (recovered on second try)
- vetra-start (already running): ✗ (but fast recovery)

**Overall**: 3/5 first-try success. The failures were recoverable and didn't derail the workflow.

### Severity checkpoint: 0 severe issues. Proceeding.

---

## Phase 7: Source Code Review

### [7.1] README vs --help
README exists at vetra-cli/README.md. Not read in detail for this narrow QA.

### [7.2] Config placement
Config schema in src/config.ts has 5 fields, all with describe(). All are environment-level (API key, model, ports, version) — correct placement. fusionPort (8000) and switchboardUrl (localhost:4001/graphql) are hardcoded as defaults in the fusion service definition rather than being config fields. Since they're service-specific, they're correctly placed as service params with defaults.

### [7.3] Framework compliance
- **process.exit**: None found ✓
- **console.log**: 6 instances in src/cli.ts event handlers (lines 130-149), 4 in src/mastra/index.ts
- **ANSI codes**: \x1b[ used in src/cli.ts:158-161 for welcome message colors
- **Global mutable state**: None found ✓

### [7.4] Output design
All commands return `{ text: string }` or `{ text: string; data: T[] }` — structured objects ✓. Services use framework lifecycle. Agent streaming works correctly.

### [7.5] Zod schema review
- `reactor-package-init --version`: z.enum(['staging','dev','latest']) — but enum values NOT shown in --help output (framework issue or missing .describe() list)
- `reactor-package-init --name`: z.string().regex() with .describe() ✓
- All fields have .describe() ✓
- Types are appropriate ✓

### [7.6] Agent configuration
- System prompt defines Rupert as a Reactor package development agent
- 6 skills, all referencing actual commands
- Skills are comprehensive (document-modeling has 42K chars in SKILL.md — flagged as oversized by framework)
- Workspace skills properly loaded from skills/ directory
