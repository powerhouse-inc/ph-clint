# marked-terminal inserts whitespace-only separator lines in lists

## Problem

When rendering markdown lists through `marked` + `marked-terminal`, extra blank lines appeared between list items in the terminal output. The LLM's raw text had tight lists (no blank lines between sub-items), but the rendered output showed double-spaced items, getting worse with deeper nesting levels.

## Root Cause

`marked-terminal` inserts whitespace-only separator lines between list items. These lines contain indentation spaces plus an ANSI reset code (e.g., `"       \x1b[0m"`). They are invisible when viewing output but render as blank lines in the terminal.

Two factors made this hard to diagnose:

1. **ANSI codes defeat `trim()`** — `"       \x1b[0m".trim()` returns `"\x1b[0m"` (not empty), so naive whitespace checks miss these lines.

2. **Loose list amplification** — When the LLM sends blank lines between top-level list items (common with numbered lists), `marked` sets `loose: true` on the entire list. `marked-terminal` then adds separator lines between ALL items including nested ones that were tight in the source, multiplying the visual spacing at each nesting level.

3. **Re-rendering during streaming** — The Ink REPL called `renderMarkdown()` on every `text-delta` chunk, re-parsing the growing text. As the list grew and `marked` flipped from tight to loose parsing, the display would visually "jump" from compact to double-spaced mid-stream.

## Fix

Three changes in `src/interactive/markdown.ts`:

1. **Force tight lists** via `walkTokens` — Set `loose: false` on all `list` and `list_item` tokens before rendering, preventing `marked-terminal` from adding extra separators for loose lists.

2. **Strip whitespace+ANSI separator lines** — Post-process the rendered output to remove lines that are whitespace-only after stripping ANSI codes, while preserving truly empty lines (paragraph breaks).

3. **Raw text during streaming** — The Ink REPL shows raw text (no markdown rendering) during streaming to avoid re-parsing artifacts. Markdown rendering is applied once by `session.ts` for the final history entry.

## Key Insight

The debugging path was long because the symptom (extra blank lines) had multiple contributing causes that each looked like THE cause in isolation. The `walkTokens` fix alone wasn't sufficient because `marked-terminal` still emitted whitespace-only separator lines. The whitespace stripping alone wasn't sufficient because `trim()` doesn't handle ANSI codes. Both fixes together resolved the issue.

## Files Changed

- `src/interactive/markdown.ts` — `walkTokens` + post-processing filter
- `src/interactive/repl.tsx` — Removed `renderMarkdown` from streaming path
- `src/interactive/session.ts` — `renderMarkdown` applied once on final result
