# Interactive Mode Improvements

Three enhancements to the REPL input experience. All logic lives in pure functions or simple state — no new dependencies.

## 1. Tab completion for command names and arguments

**Current**: Tab completes command names only when there's a single match; multiple matches show suggestions below the input.

**Target**: Tab cycles through all completion candidates inline (command names, flag names, enum values). Second Tab advances to next candidate. Enter or space accepts.

### Implementation

- Add `tabIndex: number | null` state to `repl.tsx` (reset to null on any non-Tab keystroke)
- On Tab: call `session.getCompletions(input)`. If results exist, set `tabIndex = (tabIndex + 1) % results.length` and replace the completable portion of input with `results[tabIndex]`
- The existing `getCompletions()` already handles command names (`/gr` → `/greet`), flag names (`/greet --na` → `--name`), and enum values (`/list --filter d` → `done`)
- For flag/value completions, only replace the last token (not the whole input)
- Shift+Tab cycles backward (`tabIndex - 1`)

### Key function (pure, in `completions.ts`)

```typescript
function applyCompletion(input: string, completion: string): string
```

Takes the current input and the selected completion candidate, returns the new input string with the last token replaced.

## 2. Up/down arrow cycles command matches when typing `/` prefix

**Current**: Multiple command matches show as grey text below input. No keyboard navigation.

**Target**: When input starts with `/` and has no space (i.e. typing a command name), up/down arrow cycles through matching commands inline, replacing the input.

### Implementation

- Add `commandCycleIndex: number | null` state to `repl.tsx`
- Reuse `session.getCompletions(input)` to get candidates
- On ArrowUp/ArrowDown (when input starts with `/` and has no space): cycle through candidates, setting `input` to the selected one
- Reset `commandCycleIndex` to null when input changes via typing (not via cycling)
- This is mutually exclusive with history cycling (see below) — the `/` prefix distinguishes the two modes

### Key detail

- `useInput()` already has access to `key.upArrow` and `key.downArrow`
- The candidates list is the same as what's shown in the suggestions row — just navigate it instead of displaying it

## 3. Up/down arrow cycles through history

**Current**: History is displayed as static entries. No recall.

**Target**: When input does NOT start with `/` (or is empty), up/down arrow cycles through previous inputs from the history.

### Implementation

- Add `historyIndex: number | null` state and `savedInput: string` to `repl.tsx`
- `savedInput` preserves whatever the user was typing before they started cycling
- On ArrowUp (when not in command-match mode): set `historyIndex` to walk backward through `history` entries, setting `input` to `history[idx].input`
- On ArrowDown: walk forward; when past the end, restore `savedInput`
- Reset `historyIndex` to null on any typed character change
- Filter history to unique inputs (skip consecutive duplicates)

### Key detail

- History is already stored as `HistoryEntry[]` in `repl.tsx` state
- Only user inputs are recalled (not outputs)
- Empty inputs were never added to history (the submit handler skips them)

## State summary for `repl.tsx`

New state variables (all in the existing `Repl` component):

| State | Type | Purpose |
|-------|------|---------|
| `tabIndex` | `number \| null` | Current tab-completion cycle position |
| `commandCycleIndex` | `number \| null` | Current up/down command match position |
| `historyIndex` | `number \| null` | Current up/down history position |
| `savedInput` | `string` | Input preserved while cycling history |

All reset to null/empty when the user types a normal character.

## Mode selection in `useInput()`

```
if key is Tab/Shift+Tab:
  → tab completion mode (feature 1)
else if key is Up/Down AND input starts with "/" and has no space:
  → command cycle mode (feature 2)
else if key is Up/Down AND (input is empty OR doesn't start with "/"):
  → history cycle mode (feature 3)
```

## Files to change

- `packages/ph-clint/src/interactive/completions.ts` — add `applyCompletion()`
- `packages/ph-clint/src/interactive/repl.tsx` — add state, update `useInput()` handler
- `packages/ph-clint/tests/completions.test.ts` — tests for `applyCompletion()`
- No changes to session.ts, router.ts, or types.ts

## Testing approach

- `applyCompletion()` is a pure function — unit test directly
- The cycling state logic in `repl.tsx` is tested via E2E if needed, but the state machine is simple enough that manual verification suffices for the Ink layer
- No new dependencies required
