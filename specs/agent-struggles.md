# Agent Struggles Analysis

Observed from a RupertDevAgent session (2026-04-13) creating a kanban board document model and editor.

## 1. Editor state path (`state.global` vs `state`) — 2 tries, resolved

- First `tsc` after writing editor files fails — `Property 'columns' does not exist on type 'KanbanBoardPHState'`
- Agent reads type definitions, realizes state is nested under `state.global` not `state`
- Second `tsc` passes after fixing

## 2. Lint errors + stale edit string — 3 tries, resolved

- First `lint:fix` reports errors
- `mastra_workspace_edit_file` fails — "The specified text was not found" (agent guessed the old_string wrong)
- Agent re-reads the file, then fixes with two separate edits
- Second `lint:fix` passes

## 3. Leftover `_onReorderColumns` in ColumnList — 2 tries, resolved

- `tsc` fails — `Property '_onReorderColumns' does not exist on type 'ColumnListProps'`. The earlier lint fix renamed/removed a prop but left a dangling reference in the destructuring
- Agent reads the file, fixes the destructuring
- Next `tsc` passes

## 4. addActions to kanban/board document instance — 4 tries + restart, resolved

Biggest struggle. The agent created a `kanban/board` document in the preview drive and tried to add sample data, but ADD_COLUMN actions kept failing with "Invalid action":

| Attempt | Action | Result |
|---------|--------|--------|
| 1 | SET_TITLE + ADD_COLUMN batch | SET_TITLE succeeded, ADD_COLUMN failed |
| 2 | Retry after `sleep 3` | SET_TITLE alone succeeded |
| 3 | ADD_COLUMN alone | Failed again |
| 4 | ADD_COLUMN after `sleep 5` | Failed again |

The agent's diagnosis path was confused:
- Checked creator files — action names were correct
- Checked the document model document itself — looked fine
- Slept and retried — wrong hypothesis (timing)
- Checked logs — saw the Reactor had been shut down earlier
- Tried `reactor-project-start` — got "already running" error (stale PID)
- Checked manifest and module files — all correct
- Finally **restarted the Reactor** — this was the actual fix; the Reactor needed a restart to pick up the newly code-generated document model
- ADD_COLUMN succeeds after restart

**Root cause**: The Reactor was running with a stale package cache. The `kanban/board` document model was code-generated into the filesystem, but the running Reactor hadn't loaded it. The agent needed 4 failed attempts before correctly diagnosing that a restart was needed.

## 5. Full task restart on second user message — not a failure, but wasteful

- User said "Only apply subtle colors with a business look and feel" (a styling refinement)
- The agent treated this as a brand new task — re-fetched drives, re-created the document model from scratch, re-created the editor, rather than just updating the CSS/styling on the existing editor
- This duplicated ~50 tool calls worth of work that was already done in turn 1

## 6. Session interrupted before completion

- The session ended with "Goodbye!" — the agent was interrupted (Escape) right after the columns were successfully added. It never got to add sample cards or finish the demo data setup.

## Summary

| # | Struggle | Tries | Resolved? |
|---|----------|-------|-----------|
| 1 | Editor state path | 2 | Yes |
| 2 | Lint errors + stale edit | 3 | Yes |
| 3 | Leftover prop reference | 2 | Yes |
| 4 | Reactor stale document model | 4 + restart | Yes |
| 5 | Context loss between messages | N/A | Wasteful |
| 6 | Session interrupted | N/A | Incomplete |

The biggest time sink was the Reactor reload issue (4 retries). The agent also exhibited significant context loss between user messages, repeating the entire workflow unnecessarily.
