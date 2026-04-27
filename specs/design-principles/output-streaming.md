# Output Streaming Architecture

How tool, service, and agent output gets routed across the three execution modes.

## Output Infrastructure

### RunOptions (the injection layer)

All output flows through injectable callbacks defined in `RunOptions` (`core/types.ts:761`):

| Callback | Default | Purpose |
|---|---|---|
| `stdout` | `console.log` | Formatted results (adds `\n`) |
| `stderr` | `console.error` | Errors and diagnostics |
| `writeRaw` | `process.stdout.write` | Raw streaming (no `\n` added) |

These are resolved once at startup (`cli.ts:56-66`) and threaded through the entire pipeline.

### CommandContext.stdout (`core/types.ts:111`)

Each command receives `ctx.stdout: (text: string) => void` bound to `writeRaw`. Commands use this for progressive output during execution (e.g., subprocess logs). This is a raw write — no formatting, no newline, no ANSI wrapping.

### CommandContext.runProcess (`core/types.ts:127`)

Convenience helper for running bounded subprocesses. Wraps `ProcessManager.run()` with auto-wired `onOutput` that routes each line through `ctx.stdout()`. This ensures subprocess output flows through the session's chunk system instead of writing directly to the terminal.

```typescript
const result = await ctx.runProcess('pnpm install', { cwd: dir, timeout: 120_000 });
```

When the session intercepts `ctx.stdout`, the first call opens a tool-segment (`tool-call` chunk), subsequent calls emit `tool-output` chunks (rolling window), and after execute completes, a `tool-result` chunk closes the segment. Commands that don't produce progressive output (no `ctx.stdout` calls) skip the segment wrapper entirely.

### StreamChunk (`core/types.ts:188-215`)

The atomic unit of agent streaming output:

| Type | Fields | Rendered as |
|---|---|---|
| `text-delta` | `text` | Raw text (agent prose) |
| `tool-call` | `toolCallId?`, `toolName`, `args` | `▶ toolName(args)` (dim green) |
| `tool-result` | `toolCallId?`, `toolName`, `result`, `isError` | `✓ toolName` + body or `→ summary` |
| `error` | `error` | `Error: message` (red) |

`formatStreamChunk()` (`core/stream.ts:18-43`) renders a StreamChunk to a display string. This is the shared formatter used by all three modes.

## The Three Modes

### Mode 1: Headless Command (`cli.ts:1166`)

One-shot execution, then exit.

```
argv → buildProgram() → Commander action → cmd.execute(input, ctx)
                                                    ↓
                                              Result object
                                                    ↓
                                         formatResult() → stdout()
```

**Agent prompt in command mode** (`cli.ts:1168-1180`):
```
prompt → agentProvider.stream() → StreamChunks
                                       ↓
                              formatStreamChunk(chunk) → writeRaw()
```

Each chunk is written immediately as it arrives. No buffering, no windowing, no markdown rendering. The `\n` padding in `formatStreamChunk` provides visual separation between tool blocks and text.

### Mode 2: Headless Interactive-Streaming (`cli.ts:1276`)

Line-based stdin/stdout, keep-alive. Used by IDE integrations and piped workflows.

```
stdin line → session.processInput(line) → ReplOutput
                                               ↓
                                          stdout(result.text)
```

Inside `session.processInput()` for agent prompts (`session.ts:413-508`):
```
agentProvider.stream() → StreamChunks
         ↓
    Accumulate into segments:
      text-delta  → merge consecutive into text segments
      tool-call   → new tool segment (tracked by toolCallId)
      tool-result → match to tool segment, append result
         ↓
    Build final result:
      text segments  → renderMarkdown()
      tool segments  → indent with ⎿ prefix
         ↓
    Join with \n\n → ReplOutput.text
```

Tool results are head-cropped via `cropToolBody()` (`session.ts:387-396`) to `outputWindow` lines with `... (N more lines)` indicator.

### Mode 3: Ink Terminal REPL (`cli.ts:1248`)

Full interactive terminal with React/Ink rendering.

```
keyboard → TextInput → handleSubmit()
                            ↓
              Wire session.onStreamChunk callback
                            ↓
              session.processInput(input)
                    ↓                    ↓
          StreamChunks arrive     Final ReplOutput
                    ↓                    ↓
          onStreamChunk(chunk)     → history entry
                    ↓
          setSegments(updateSegments(prev, chunk))
                    ↓
          React re-render of streaming display
```

**Two rendering phases:**

1. **During streaming** — Segments render live in the dynamic area:
   - Text segments: raw text (no `renderMarkdown` — avoids re-parsing on every chunk)
   - Tool segments: `▶` header unindented, `⎿ ✓` status + body indented, rolling window of last N lines
   - `updateSegments()` (`repl.tsx:92-151`) splits formatted output into individual lines

2. **After completion** — Segments cleared, result goes to `<Static>` history:
   - `result.text` from session (already markdown-rendered) stored as `entry.output`
   - Displayed directly in `<Text>{entry.output}</Text>` — no double rendering

**Rolling window** (`repl.tsx:604-618`): Tool body lines are windowed to `outputWindow` (default 6). Header lines are pinned above the window. Hidden lines show `⎿ ... (N more lines)`.

## Tool Call/Result Matching

Parallel tool calls are matched by `toolCallId` (from Vercel AI SDK, propagated through `mastra/stream.ts`). Fallback chain:

1. Exact match by `toolCallId` (when available)
2. FIFO match by `toolName`
3. Any incomplete tool segment

This applies in both `updateSegments()` (repl.tsx) and the session segment builder (session.ts).

## Markdown Rendering

`renderMarkdown()` (`interactive/markdown.ts`) uses `marked` + `marked-terminal`.

**Applied to:**
- Text segments in session result (`session.ts:492`)
- Text segments during REPL streaming (`repl.tsx:600`) — raw text, no markdown during streaming; only on last segment
- Command result text (`session.ts:202, 319`)

**Not applied to:**
- Tool call/result lines (pre-formatted with ANSI colors)
- Headless command mode streaming (raw chunks to writeRaw)
- Service status lines

**Caveats:**
- `marked-terminal` inserts whitespace+ANSI separator lines between list items. A `walkTokens` hook forces `loose: false`, and a post-processing filter strips lines that are whitespace-only after ANSI removal.
- During REPL streaming, `renderMarkdown` is called on the active text segment on each chunk update. The tight-list fix prevents visual "jumps" from tight-to-loose reclassification.

## Service Output

Services managed by `ServiceManager` capture stdout/stderr into circular log buffers.

- `services.logs(id, instanceId, lines)` — returns captured log lines as string
- `services.watchLogs(id, instanceId, onLine)` — streaming callback for live tailing
- Service status formatted by `formatStatus()` (`service-command.ts:10-29`) — icon + name + pid + endpoints

In the REPL, service events flow through `onMessage` callback → `setStatusLines()` for persistent status bar display.

## Conversation Logging

`loggedStream()` (`mastra/logging.ts:191-230`) wraps the agent stream to persist conversations as markdown files at `{logDir}/{agentName}/{timestamp}.md`. It yields chunks unchanged — purely observational, no effect on display routing.

## Known Issues

### Streaming-to-history jump

When streaming completes and the display transitions from dynamic segments to static history, a one-line vertical jump can occur if the line counts differ (e.g., extra blank lines between tool segments during streaming vs. history rendering).

## Output Path Summary

| Data Source | Headless Command | Headless Streaming | Ink REPL |
|---|---|---|---|
| Agent text-delta | `writeRaw(text)` | segment → `renderMarkdown` → `stdout` | segment → raw display → history (rendered) |
| Agent tool-call | `writeRaw(▶ ...)` | segment → `⎿` indent → `stdout` | segment → `⎿` indent + rolling window |
| Agent tool-result | `writeRaw(✓ ...)` | segment → crop → `⎿` indent → `stdout` | segment → crop → `⎿` indent + rolling window |
| Command result | `stdout(text)` | `renderMarkdown` → `stdout` | `renderMarkdown` → history entry |
| Command stdout | `writeRaw(text)` | `tool-output` chunk → rolling window | `tool-output` chunk → rolling window |
| Service status | N/A | `stdout(status)` | status bar line |
| Errors | `stderr(msg)` | `log.error(msg)` → stderr | red text in history |
