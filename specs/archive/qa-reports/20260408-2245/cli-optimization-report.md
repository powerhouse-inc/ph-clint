# CLI Optimization Report — vetra-mastra

## Task Under Test
Create a document model for a todo list using the vetra-mastra CLI, from workspace initialization through to viewing the result in Vetra Studio.

## Scoring Table

| # | Principle | Grade | Evidence | Key Issues |
|---|-----------|-------|----------|------------|
| 1 | Project Basics | Needs work | [0.1, 0.2, 0.3] | Build/tests pass but no lint, low test count (10 tests for 18+ commands) |
| 2 | README and Setup | Good | [7.1] | Accurate, shows structure, setup steps, skill table |
| 3 | Self-Documentation | Needs work | [1.1, 1.2, 3.7, 3.8, 4.1] | Core workflow (document modeling) invisible in --help; opaque service errors |
| 4 | CLI Identity | Good | [1.1] | Name, tagline, and command list give clear picture of infrastructure capabilities |
| 5 | Command Naming | Good | [1.2] | Consistent `noun-verb` pattern, commands discoverable as groups |
| 6 | Command Options | Good | [1.2, 7.5] | All options have .describe(), types are specific (enum, regex, coerce) |
| 7 | Services vs. Commands | Good | [3.6, 3.11, 5.1] | Clean service/command separation, readiness patterns, lifecycle |
| 8 | Config Schema | Good | [7.5, 3.5] | Minimal, all fields described, sensible defaults |
| 9 | Config vs. Options vs. Hardcoded | Good | [7.2] | Clean separation; ports in config, overridable per-command |
| 10 | Agent Tool Surface | Poor | [6.1-6.4, 7.2] | MCP tools not connected — agent cannot complete its primary workflow |
| 11 | Agent Instructions | Needs work | [6.1-6.4, 7.6] | Good instructions but false claim about MCP tools; skill too large |
| 12 | Interactive Mode | Needs work | [4.1, 4.2, 6.2] | Good welcome screen; no workflow guidance; no conversation continuity in CLI mode |
| 13 | Output Design | Needs work | [3.6, 3.7, 3.8, 3.10] | Great success output; several opaque error messages |
| 14 | Triggers and Routines | N/A | — | No triggers/routines defined |
| 15 | Separation of Concerns | Good | [7.3] | No process.exit, console.log only in event handlers, uses framework correctly |

---

## Detailed Findings

### BLOCKING: Principle 10 — Agent Tool Surface (Poor)

**The issue**: MCP tools (`reactor_mcp__*`) are not connected to the agent. The `connectMcp()` function exists in `src/mcp/client.ts` but is never called. The agent is created with only CLI command tools at `src/agents/agent-rupert.ts:77`.

**What I observed**: The agent called `reactor_mcp__list_documents` 3+ times across multiple invocations — every call produced no visible output. The agent then loops: tries MCP → fails silently → explores files → checks status → tries MCP again. It cannot create document model specifications, which is the core workflow.

**What I expected**: After `vetra-start` succeeds and captures the MCP server URL, the agent should automatically gain access to `reactor_mcp__*` tools for document and drive operations.

**Suggested fix**: Port the dynamic tool injection pattern from the prototype:
```typescript
// src/agents/agent-rupert.ts — change line 77
tools: async () => ({
  ...cliTools,
  ...(await getMcpTools()),
}),
```
And add a hook (or modify `vetra-start`'s ready handler) to call `connectMcp(mcpServerUrl)` when the service reports the `mcp-server` endpoint.

**Impact**: This is the blocking issue for the entire document modeling workflow. Without it, the agent is limited to scaffolding and service management — it cannot do the creative work it's designed for.

---

### HIGH: Principle 3 — Self-Documentation (Needs work)

**Issue 1**: The primary workflow (document modeling through the agent) is invisible in `--help`. No command mentions document modeling, agent skills, or how to interact with the agent outside of `--interactive`.

**What I observed**: From `--help` alone, I could not discover that: (a) document modeling exists, (b) it's done through the AI agent, (c) the agent has a document-modeling skill, or (d) bare text arguments send messages to the agent.

**Suggested fix**: Add a brief section to the root `--help` output:
```
Agent:
  vetra-mastra "your message"    Send a message to the AI agent
  vetra-mastra -i                Interactive mode with the agent

  The agent can help with document modeling, editor creation, and
  project management. Try: vetra-mastra "Create a document model for invoices"
```

**Issue 2**: Several error messages are opaque (see Principle 13 below).

---

### HIGH: Principle 11 — Agent Instructions (Needs work)

**Issue 1**: The system prompt states "When a reactor project is running, MCP tools (`reactor-mcp__*`) automatically become available for document and drive operations" — this is FALSE in the current implementation. The agent expects tools that don't exist, leading to silent failures and confusion loops.

**Suggested fix**: Either (a) fix the MCP integration (Principle 10) so the statement becomes true, or (b) remove the claim and add instructions for what the agent should do when MCP tools aren't available.

**Issue 2**: The `document-modeling` skill is 1043 lines / ~8164 estimated tokens, exceeding the recommended <500 lines / <5000 tokens. Runtime warnings are emitted every invocation. With haiku as the default model, this large skill may degrade agent performance.

**Suggested fix**: Move reference material (reducer guidelines, operation tables, examples) to `references/` files that the agent can read on demand, keeping the skill's core instructions under 500 lines.

**Issue 3**: The skill mandates "Present your proposal to the user and ask for confirmation" which is good for interactive use but prevents the agent from following explicit user instructions to "just implement it." Consider adding: "If the user explicitly says to proceed without confirmation, skip the proposal step."

---

### MEDIUM: Principle 12 — Interactive Mode (Needs work)

**Issue 1**: The welcome screen lists commands but doesn't mention document modeling, agent skills, or how to ask the agent for help. A new user seeing the welcome would think this is a project scaffolding tool, not an AI-assisted document modeling environment.

**Suggested fix**: Add to the welcome screen:
```
  Ask me anything    "Create a document model for invoices"
  /help              Show all commands
```

**Issue 2**: Each CLI invocation (`node dist/main.js "message"`) starts a fresh conversation. Multi-turn workflows (propose → confirm → implement) are impossible in CLI command mode. The `--resume <thread-id>` flag exists but there's no mechanism to discover or return thread IDs from previous invocations.

**Suggested fix**: After each agent response in CLI mode, print the thread ID and a hint: `Thread: abc-123 (resume with --resume abc-123)`.

---

### MEDIUM: Principle 13 — Output Design (Needs work)

**Issue 1**: `vetra-start` without `--workdir` (from non-project directory):
- **Actual**: `✗ Vetra Dev Server failed: Process exited before becoming ready`
- **Expected**: `✗ Vetra Dev Server failed: ph vetra exited — no Powerhouse project found in /current/dir. Try: vetra-start --workdir <project-name>`
- **Rating**: Opaque
- **File**: `src/cli.ts:116-117` (event handler only shows `event.error`)

**Issue 2**: `vetra-logs` when service is stopped:
- **Actual**: `undefined`
- **Expected**: `No logs available — Vetra Dev Server is not running. Start it with: vetra-start`
- **Rating**: Opaque

**Issue 3**: `vetra-restart` when not running exposes raw subprocess error:
- **Actual**: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "ph-cli" not found`
- **Expected**: Wrapped error with guidance
- **Rating**: Opaque

**Good output design** (for reference): `vetra-ps` when running shows `● Vetra Dev Server [ready] pid 14027 drive-url=... mcp-server=... connect-studio=3001` — icons, status labels, and all endpoints. Config validation errors list valid options. These are excellent.

---

### LOW: Principle 1 — Project Basics (Needs work)

- No `pnpm lint` script — no linting configured at all
- Only 10 tests in 1 test suite for a CLI with 18+ commands, 2 services, and agent integration
- Zod peer dependency mismatch warning (zod@4.3.6 vs expected ^3.23.8) — works but may cause subtle issues

---

## Priority Ranking

1. **BLOCKING** — Principle 10 (Agent Tool Surface): MCP tools not connected. The entire document modeling workflow is non-functional. Fix the `connectMcp()` integration.

2. **HIGH** — Principle 11 (Agent Instructions): False claim about MCP tools auto-availability; oversized skill file. Fix after #1 or simultaneously.

3. **HIGH** — Principle 3 (Self-Documentation): Primary workflow invisible in help. Add agent usage section to `--help` and welcome screen.

4. **MEDIUM** — Principle 13 (Output Design): 3 opaque error messages in service lifecycle. Add context and guidance to error messages.

5. **MEDIUM** — Principle 12 (Interactive Mode): No conversation continuity in CLI mode; welcome screen missing workflow hints.

6. **LOW** — Principle 1 (Project Basics): Add linting, expand test coverage.

---

## Production Readiness

**Not production-ready.** Principle 10 (Agent Tool Surface) scores **Poor** — the agent cannot complete its primary workflow because MCP tools are not wired up. This is a single integration gap (the code exists but isn't connected) that, once fixed, would unblock the entire document modeling flow.

After fixing the MCP integration, 4 principles still need minor work (3, 11, 12, 13) but none are blocking. The CLI's infrastructure layer (commands, services, config, framework usage) is well-designed and would score Good across the board.

**Estimated effort to reach production-ready**: The MCP integration fix is small (a few lines to wire `connectMcp()` into the service ready handler and make agent tools dynamic). The remaining Needs Work items are documentation and error message improvements.
