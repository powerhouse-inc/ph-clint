Plan: Surface thread ID after agent response in CLI command mode

## Problem

After `vetra-mastra "Create a document model for a todo list"` completes, the user has no way
to discover the thread ID to continue the conversation with `--resume <thread-id>`. Multi-turn
workflows (agent proposes → user confirms → agent implements) are impossible in command mode.

Interactive mode already handles this: the exit message shows `To resume, run: vetra-mastra -i --resume <thread-id>`.

## Analysis

The fix belongs in the **ph-clint library**, not in 05b. The core's command-mode agent path
(cli.ts:689-701) streams the agent response but never prints a thread ID afterward. The issue
is that:

1. If `--resume <thread-id>` was passed, `resumeId` holds it — but it's never echoed back.
2. If no `--resume` was passed, a new thread is implicitly created by Mastra, but the library
   never learns what ID was assigned.

### Thread ID sourcing

There are two sub-problems:

**When `--resume` is used**: We already have `resumeId`. Just print it after the stream.

**When `--resume` is not used (new conversation)**: We need the thread ID from the agent.
Currently `AgentProvider.stream()` only yields `StreamChunk` values — there's no metadata
channel for the thread ID. Options:

**Option A — Generate thread ID before streaming, pass it in**
The CLI generates a UUID, passes it as `threadId` to `agentProvider.stream()`, then prints it.
This works because Mastra's memory system accepts a caller-provided thread ID. The agent stores
its conversation under that ID, and future `--resume` calls use the same ID.

**Option B — Add a metadata field to AgentProvider.stream()**
Return `{ threadId }` alongside the stream. More "correct" but requires changing the
AgentProvider interface and all implementations.

**Option C — Add a `threadId` getter to AgentProvider**
After streaming completes, read `agentProvider.lastThreadId`. Requires interface change.

Option A is the simplest and requires no interface changes. Generate a UUID, pass it as
`threadId`, print it after the stream. The Mastra `wrapAgent` already passes `threadId` through
to the agent's memory system. If the user passes `--resume`, use that instead.

## Plan

### Step 1 — Generate thread ID when not resuming (packages/ph-clint/src/core/cli.ts)

In `runImpl()`, before the agent streaming block (~line 689), generate a thread ID if one
wasn't provided via `--resume`:

```ts
import { randomUUID } from 'node:crypto';

// ... inside runImpl, before the agent streaming block:
const threadId = resumeId ?? randomUUID();
```

Then use `threadId` instead of `resumeId` in the stream call:

```ts
for await (const chunk of agentProvider.stream(prompt, { threadId, tools: commandMap })) {
```

### Step 2 — Print thread ID after agent response

After the stream loop completes (line 698), print the thread hint:

```ts
stdout('');
const D = '\x1b[2m';
const R = '\x1b[0m';
stdout(`${D}Thread: ${threadId}  (continue with: ${options.name} --resume ${threadId} "your message")${R}`);
```

Use dim formatting to keep it unobtrusive. The hint includes a copy-pasteable example.

### Step 3 — Tests

- **Unit test**: Verify that command-mode agent output includes a `Thread:` line.
- **Unit test**: Verify that when `--resume abc123` is passed, the printed thread ID is `abc123`
  (not a new UUID).
- **Integration test**: Verify round-trip — send a message, capture thread ID from output,
  send a follow-up with `--resume <captured-id>`.

## Scope

- **Library change**: `packages/ph-clint/src/core/cli.ts` only (the command-mode agent path).
- **No 05b changes** — this is a framework feature that benefits all CLI implementations.
- **No interface changes** — `AgentProvider` and `AgentStreamOptions` stay the same.
- **Risk**: Very low. The only behavioral change is printing one extra line after agent output.
  Thread IDs are already supported end-to-end; we're just generating and surfacing them.
