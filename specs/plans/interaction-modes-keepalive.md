# Refactor: Interaction Modes, Keep-Alive Conditions, and `--no-switchboard`

## Context

The CLI dispatch logic in `runImpl()` currently uses "Path 1/2/3" terminology and conflates two orthogonal concerns: the **interaction mode** (how the CLI does I/O) and the **keep-alive reason** (why it stays running). This makes the code harder to follow and causes a behavioral gap: a CLI with reactor + switchboard enabled but no `-i` and no routine falls to Path 3 (show help, exit) — the switchboard never starts, which is surprising since it's a configured HTTP server.

This refactor introduces explicit terminology for the three interaction modes, separates keep-alive as an orthogonal concept, adds switchboard as a keep-alive condition, and introduces `--no-switchboard` / `-S` to suppress it.

## Interaction Modes

| Mode | Condition | Description |
|---|---|---|
| `headless` | no `-i` flag | No input loop. Executes command/prompt and exits, or serves until killed. |
| `interactive-streaming` | `-i` + `!isTTY` | Line-based stdio interaction. EOF-aware. Testable programmatically. |
| `interactive-terminal` | `-i` + `isTTY` | Ink REPL with rich UI. |

At the OS level, there is no "no stdio" — every Linux process gets file descriptors 0/1/2. The difference is what fd 0 is connected to (TTY character device, pipe/FIFO, /dev/null, socket) and whether `process.stdin.isTTY` is true. The three modes are about the CLI's **interaction model**, not the OS-level process setup.

Detection:
```typescript
type InteractionMode = 'headless' | 'interactive-streaming' | 'interactive-terminal';

const mode: InteractionMode = !interactiveFlag ? 'headless'
  : (isTTY ? 'interactive-terminal' : 'interactive-streaming');
```

## Keep-Alive Conditions

Orthogonal to mode. A keep-alive reason means the process should block on signals after its primary work (command execution / input stream) completes:

- **Routine active** (`effectiveRoutine` is defined) — existing behavior
- **Switchboard enabled** (`effectiveSwitchboard` is true) — new behavior. An in-process HTTP server has no purpose if the process exits; treating it as a keep-alive condition is consistent with "if you configured it, you want it to run"
- **Input channel open** — implicit while stdin/REPL is active, not a post-EOF reason

Behavioral matrix:

| Keep-alive reason | Headless | Interactive-streaming | Interactive-terminal |
|---|---|---|---|
| Nothing | exit after command | exit on EOF | exit on `/exit` |
| Switchboard | block on signals | block on signals after EOF | block until `/exit` |
| Routine | block on signals | block on signals after EOF | block until `/exit` |

## Test Clients

### `InteractiveStreamingClient`

A test harness for `interactive-streaming` mode that wraps `cli.run()` with controllable I/O. New file: `packages/ph-clint/src/testing/streaming-client.ts`, exported from `src/testing/index.ts`.

```typescript
interface InteractiveStreamingClient {
  /** Push a line of input (as if typed + Enter). */
  writeInput(line: string): void;
  /** Close the input stream (EOF). */
  sendEOF(): void;
  /** Emit SIGINT to unblock keep-alive. */
  sendKillSignal(): void;
  /** All stdout lines collected so far. */
  readonly output: string[];
  /** All stderr lines collected so far. */
  readonly errors: string[];
  /** Exit code once the process exits, undefined while running. */
  readonly exitCode: number | undefined;
  /** Promise that resolves when cli.run() completes. */
  readonly done: Promise<void>;
}
```

Implementation: creates an async generator backed by a queue + resolve/reject pair. `writeInput()` pushes to the queue and resolves the pending pull. `sendEOF()` closes the generator. `sendKillSignal()` emits `process.emit('SIGINT')`. Passes the generator as `interactiveInput` and captures stdout/stderr/exit via `RunOptions`.

Usage in tests:
```typescript
const client = createStreamingClient(cli, ['node', 'test', '-i']);
client.writeInput('/echo --message hello');
// wait for output...
await delay(100);
expect(client.output).toContainEqual(expect.stringContaining('hello'));
client.writeInput('/exit');
await client.done;
```

### `InteractiveTerminalClient`

A test harness for `interactive-terminal` mode. Wraps `ink-testing-library`'s `render()` with the Repl component. New file: `packages/ph-clint/src/testing/terminal-client.ts`.

This operates at the **Repl component level**, not `cli.run()`, because faking `process.stdin.isTTY` is impractical. The dispatch logic and startup sequence are tested via the streaming client; the terminal client tests Ink-specific UI behavior (rendering, key handling, visual output).

```typescript
interface InteractiveTerminalClient {
  /** Write raw characters (including KEYS.ENTER, KEYS.TAB, etc.). */
  writeRaw(chars: string): void;
  /** Type a string and press Enter. */
  submit(line: string): void;
  /** Get the last rendered frame (stripped of ANSI). */
  lastFrame(): string;
  /** Unmount the Ink app. */
  unmount(): void;
}
```

Implementation: thin wrapper around `render(<Repl session={session} />)` from `ink-testing-library`, adding `submit()` as sugar for `writeRaw(text + KEYS.ENTER)` and ANSI stripping on `lastFrame()`.

## Files to Change

### 1. `specs/design-principles/startup-sequence.md` — Update spec

Rewrite/extend to incorporate:

**a. New "Interaction Modes" section** (replace or precede "The Three Paths"):
- Define `headless`, `interactive-streaming`, `interactive-terminal`
- Explain detection: `-i` flag + `isTTY`
- Note that at the OS level there is no "no stdio" — every process gets fd 0/1/2; the difference is the CLI's interaction model, not the process setup

**b. New "Keep-Alive Conditions" section:**
- Routine (existing)
- Switchboard (new)
- Explain orthogonality: keep-alive is independent of interaction mode
- The behavioral matrix

**c. Update "Framework Flags" section:**
- Add `--no-switchboard` / `-S` documentation, paralleling `--no-routine` / `-R`
- Use cases: debugging the REPL without the HTTP server, running one-shot commands when switchboard is configured but not needed

**d. Update dispatch description** to use the new terminology instead of "Path 1/2/3"

**e. Update EOF Keep-Alive section** to mention switchboard as a keep-alive condition

**f. Update Teardown section** — no functional change but update terminology in the call-site list

### 2. `packages/ph-clint/src/testing/streaming-client.ts` — New file

`InteractiveStreamingClient` implementation.

### 3. `packages/ph-clint/src/testing/terminal-client.ts` — New file

`InteractiveTerminalClient` implementation.

### 4. `packages/ph-clint/src/testing/index.ts` — New file

Public exports: `createStreamingClient`, `createTerminalClient`, `InteractiveStreamingClient`, `InteractiveTerminalClient`.

### 5. `packages/ph-clint/src/index.ts` — Add testing export

Export `./testing/index.js` (possibly under a `ph-clint/testing` subpath export in package.json, or from the main barrel — follow existing patterns).

### 6. `packages/ph-clint/src/core/cli.ts` — Core refactor

**a. Add `--no-switchboard` / `-S` flag** (follows `--no-routine` / `-R` pattern)

- `buildProgram()` (~line 571): Register `-S, --no-switchboard` option, conditionally when `reactorConfig?.switchboard?.enabled`
- Flag extraction loop (~line 775): Parse `-S` / `--no-switchboard` → `noSwitchboardFlag`
- After flag extraction: compute `effectiveSwitchboard`:
  ```typescript
  const effectiveSwitchboard = !noSwitchboardFlag && reactorConfig?.switchboard?.enabled;
  ```

**b. Compute interaction mode** (after flag extraction, ~line 1070)

Move the `isTTY` computation (currently line 1201, inside Path 2) up to before dispatch:
```typescript
const isTTY = interactiveFlag && !opts.interactiveInput && process.stdin.isTTY;

const mode: InteractionMode = !interactiveFlag ? 'headless'
  : (isTTY ? 'interactive-terminal' : 'interactive-streaming');
```

Compute keep-alive:
```typescript
const hasKeepAlive = !!effectiveRoutine || !!effectiveSwitchboard;
```

**c. Restructure dispatch** (lines 1118-1302)

Replace the three-path if/else with mode-aware dispatch:

```
// Exceptions: --meta, --help, --version — unchanged, handled before dispatch

// 1. Command execution: subcommand or prompt without -i → execute, exit
if (isBuiltinFlag || (!interactiveFlag && (isSubcommand || hasPrompt))) {
  → same as current Path 1
}

// 2. Interactive or keep-alive: -i OR hasKeepAlive
else if (interactiveFlag || hasKeepAlive) {
  → startup sequence + mode-specific main loop
}

// 3. Nothing to do → show help
else {
  → same as current Path 3
}
```

The key change: the condition becomes `interactiveFlag || hasKeepAlive` (was `interactiveFlag || effectiveRoutine`).

**d. Mode-specific main loop** (inside the startup-sequence branch)

Replace the `if (isTTY) { ... } else { ... }` with a switch on `mode`:

```typescript
switch (mode) {
  case 'interactive-terminal':
    // Ink REPL — unchanged from current TTY branch
    break;

  case 'interactive-streaming':
    // Startup sequence, then line reader, then EOF handling
    // Keep-alive check: hasKeepAlive (was effectiveRoutine only)
    break;

  case 'headless':
    // Startup sequence, then block on signals
    // New branch — previously unreachable without routine
    // Message: "Serving at ... — Press Ctrl+C to stop."
    break;
}
```

**e. Update `startupSequence()`** (~line 963)

- Step 2 (switchboard): skip when `noSwitchboardFlag` is set (same pattern as routine in step 4)
- Update comment: `// 2. Switchboard — skipped when --no-switchboard`

**f. EOF keep-alive** (inside `interactive-streaming` branch)

Change condition from `if (effectiveRoutine)` to `if (hasKeepAlive)`:
```typescript
if (hasKeepAlive) {
  stdout('Stdin closed — still serving. Press Ctrl+C to stop.');
  // ... signal handler ...
}
```

**g. Update comments** throughout to use `headless`, `interactive-streaming`, `interactive-terminal` terminology.

### 7. `packages/ph-clint/tests/cli.test.ts` — Update and add tests

**Update existing tests:**
- `--no-routine without -i falls to help (Path 3)` → update description to new terminology
- EOF keep-alive tests → update descriptions
- Consider migrating some tests to use `InteractiveStreamingClient`

**Add new tests:**
- `--no-switchboard suppresses switchboard start during startup sequence`
- `--no-switchboard without -i and without routine falls to help`
- `headless mode with switchboard stays alive` — reactor + switchboard, no `-i`, no routine → starts switchboard, blocks on signals
- `headless mode with switchboard + --no-switchboard shows help`

### 8. `packages/ph-clint/tests/powerhouse-cli.test.ts` — Verify existing test still passes

The test at line 165 (`startupSequence output appears in headless interactive mode`) should continue working.

## Execution Order

1. Update `specs/design-principles/startup-sequence.md` — establish framing, terminology, behavioral matrix
2. Create `src/testing/streaming-client.ts`, `src/testing/terminal-client.ts`, `src/testing/index.ts`
3. Export from `src/index.ts` or add subpath export
4. Update `src/core/cli.ts` — flag, mode computation, dispatch restructure, startupSequence, comments
5. Update tests in `tests/cli.test.ts` — new tests + updated descriptions
6. Verify `tests/powerhouse-cli.test.ts` passes
7. `pnpm build && pnpm test` — all green

## Verification

```bash
cd packages/ph-clint
pnpm build && pnpm test
```

All existing tests must pass. New tests must cover:
- `--no-switchboard` flag parsing and suppression
- Switchboard as keep-alive in headless mode
- Switchboard as keep-alive in interactive-streaming mode (EOF → stay alive)
- Suppression of both (`-R -S`) falling to help
