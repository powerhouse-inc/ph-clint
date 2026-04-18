# Command stdout bypasses REPL rendering in interactive mode

## Problem

When an agent calls a command that uses `ctx.stdout()` for progressive output (e.g., `reactor-project-init` streaming subprocess logs), the output writes directly to the terminal via `process.stdout.write`, bypassing Ink's rendering pipeline and the output window.

This causes raw subprocess output (pnpm install logs, git hints, dependency lists) to appear unformatted in the REPL, corrupting Ink's display. The output window cannot crop it because it never enters the StreamChunk pipeline.

## Root Cause

In `cli.ts` line ~847, the `CommandContext` is constructed with `stdout: writeRaw` where `writeRaw = process.stdout.write`. This is correct for headless/command mode, but in interactive mode the same context is passed to `commandsToMastraTools()` (in `mastra/tools.ts` line 22), which means agent tool calls use the same raw stdout.

The command (`reactor-project-init`) pipes child process output through `ctx.stdout()`:
```typescript
child.stdout.on('data', (chunk) => stdout(chunk.toString()));
child.stderr.on('data', (chunk) => stdout(chunk.toString()));
```

This goes straight to the terminal instead of through the REPL's segment rendering.

## Expected Behavior

In interactive mode, command progressive output should feed into the REPL's streaming display — appearing as part of the tool segment's body, subject to the rolling output window, with `⎿` indentation and `... (N more lines)` truncation.

## Possible Fix

When building the `CommandContext` for interactive mode, bind `stdout` to a function that emits the text as StreamChunk data (e.g., synthetic `tool-result` body chunks or a new `tool-output` chunk type) so it flows through `onStreamChunk` into the REPL's segment system.

Considerations:
- The command's `stdout` is called incrementally (per child process data event), not as a single result. The streaming mechanism needs to handle partial/incremental tool body output.
- The current `StreamChunk` types don't have an incremental tool output type — only `tool-call` (start) and `tool-result` (end). A `tool-output` chunk type for progressive body content may be needed.
- The `tool-result` chunk arrives after the command completes. Progressive output should appear during execution, before the result.

## Files

- `packages/ph-clint/src/core/cli.ts` — CommandContext construction (~line 847)
- `packages/ph-clint/src/integrations/mastra/tools.ts` — passes context to agent tools
- `packages/ph-clint/src/core/types.ts` — StreamChunk types (may need `tool-output`)
- `packages/ph-clint/src/interactive/repl.tsx` — segment rendering (would consume new chunk type)
