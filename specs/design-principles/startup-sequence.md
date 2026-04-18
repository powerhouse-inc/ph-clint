# Startup Sequence and Dispatch

## Overview

When a ph-clint CLI starts, it must decide what to run and in what order. The startup sequence is the ordered initialization of Reactor, Switchboard, Connect, and Routine — the four optional runtime layers. The dispatch determines *whether* that sequence runs at all.

This document covers the interaction modes, keep-alive conditions, dispatch logic, the startup sequence, the teardown strategy, error handling, and the design principles behind them.

## Interaction Modes

The CLI has three interaction modes, determined by the `-i` flag and TTY detection:

| Mode | Condition | Description |
|---|---|---|
| `headless` | no `-i` flag | No input loop. Executes command/prompt and exits, or serves until killed. |
| `interactive-streaming` | `-i` + `!isTTY` | Line-based stdio interaction. EOF-aware. Testable programmatically. |
| `interactive-terminal` | `-i` + `isTTY` | Ink REPL with rich UI. |

Detection:
```typescript
type InteractionMode = 'headless' | 'interactive-streaming' | 'interactive-terminal';

const mode: InteractionMode = !interactiveFlag ? 'headless'
  : (isTTY ? 'interactive-terminal' : 'interactive-streaming');
```

Note that at the OS level there is no "no stdio" — every process gets fd 0/1/2. The difference is the CLI's interaction model, not the process setup. `interactive-streaming` is what tests use (via `interactiveInput` in `RunOptions`), and what piped stdin produces. `interactive-terminal` is the rich Ink REPL that requires a real TTY.

## Keep-Alive Conditions

Orthogonal to interaction mode. A keep-alive reason means the process should block on signals after its primary work (command execution / input stream) completes:

- **Routine active** (`effectiveRoutine` is defined) — the trigger loop is processing events
- **Switchboard enabled** (`effectiveSwitchboard` is true) — an in-process HTTP server has no purpose if the process exits; treating it as a keep-alive condition is consistent with "if you configured it, you want it to run"
- **Input channel open** — implicit while stdin/REPL is active, not a post-EOF reason

The behavioral matrix:

| Keep-alive reason | Headless | Interactive-streaming | Interactive-terminal |
|---|---|---|---|
| Nothing | exit after command | exit on EOF | exit on `/exit` |
| Switchboard | block on signals | block on signals after EOF | block until `/exit` |
| Routine | block on signals | block on signals after EOF | block until `/exit` |

## Exceptions: `--meta`, `--help`, `--version`

Three flags bypass the dispatch entirely:

- **`--meta`** — Outputs CLI metadata as JSON and exits. Checked first, before any dispatch logic. No startup sequence, no Commander parsing, no context beyond what's needed for metadata generation.
- **`--help` / `-h`** and **`--version` / `-V`** — Commander built-in flags. These are detected in the pre-command args and routed to Commander regardless of whether a routine is defined or `-i` is set. Without this exception, `mycli --help` on a CLI with triggers would start the full Reactor/Switchboard stack just to print a help message.

The detection is simple: if any pre-command arg is `--help`, `-h`, `--version`, or `-V`, force command execution mode. Commander's `exitOverride()` ensures the process exits cleanly after printing.

## Framework Flags

### `--no-routine` / `-R`

Suppresses routine activation. When set, the routine object is still created (so CLI metadata, help text, and auto-injected service commands remain correct), but:

- **Dispatch**: `--no-routine` removes routine as a keep-alive reason. Without other keep-alive reasons or `-i`, falls to help.
- **Startup sequence step 4**: Skipped entirely — the trigger loop does not start.
- **Keep-alive**: Since the routine is suppressed, stdin EOF causes a clean exit instead of blocking on signals (unless switchboard provides keep-alive).

Use cases: debugging the REPL or Switchboard without the trigger loop interfering, running one-shot commands while the routine is defined but not needed.

### `--no-switchboard` / `-S`

Suppresses switchboard activation. When set:

- **Dispatch**: `--no-switchboard` removes switchboard as a keep-alive reason. Without other keep-alive reasons or `-i`, falls to help.
- **Startup sequence step 2**: Skipped entirely — the HTTP server does not start.
- **Keep-alive**: Since the switchboard is suppressed, it no longer counts as a reason to stay alive after EOF or in headless mode.

Use cases: debugging the REPL without the HTTP server, running one-shot commands when switchboard is configured but not needed.

Only registered when `reactorConfig?.switchboard?.enabled` is true (same pattern as `--no-routine` only appearing when triggers are defined).

## Dispatch

After extracting framework flags, checking for exceptions, and resolving the context (workdir, config, services), `runImpl()` dispatches:

```
1. Command execution: built-in flag OR (no -i AND (subcommand or prompt))
   → No startup sequence. Route to Commander or agent, then exit.

2. Interactive or keep-alive: -i OR hasKeepAlive
   → Full startup sequence. Mode-specific main loop.

3. Nothing to do: else
   → Show help (via Commander).
```

### Why `-i` forces the startup sequence

The spec requires: **if `-i` is set, always enter the startup sequence path, even if a subcommand or prompt is also provided.** This is because interactive mode implies the user wants a persistent session. The startup sequence provisions the runtime (Reactor, Switchboard, Connect) so that the REPL, triggers, and background services all work.

### Why keep-alive forces the startup sequence

A routine needs the full runtime stack. Document-change triggers need the Reactor to be initialized and Switchboard to be bridging subscriptions before the routine's tick loop can produce work items. Similarly, a configured switchboard needs the Reactor to be running before it can serve requests. Without the startup sequence, these components would never start.

### Why command execution is lazy

One-shot commands (`mycli noop --flag val`) and agent prompts (`mycli "what is the weather"`) should start fast. They don't need Reactor, Switchboard, or Connect unless they explicitly request them via `context.reactor()`. Lazy accessors mean these components are only created on demand, and most commands never touch them.

## Mode-Specific Main Loop

After the startup sequence, the dispatch switches on `mode`:

### `interactive-terminal`

Ink REPL — unchanged. The REPL session is created before `startupSequence()` runs, so the user sees the prompt immediately while runtime layers initialize.

### `interactive-streaming`

Line-based stdio. After startup sequence, reads lines from `interactiveInput` (testing) or piped stdin. On EOF:
- If `hasKeepAlive` → output "Stdin closed — still serving." and block on SIGINT/SIGTERM
- Otherwise → clean teardown and exit

### `headless`

No input loop. After startup sequence, outputs "Serving — press Ctrl+C to stop." and blocks on SIGINT/SIGTERM. This branch is reached when keep-alive is active but no `-i` flag is set (e.g., a CLI with switchboard enabled, run without `-i`).

## The Startup Sequence

`startupSequence(output)` runs four steps in a fixed order. Each step depends on the one before it:

```
1. Reactor    → in-process document store, drive, subscriptions
2. Switchboard → GraphQL + MCP endpoint wrapping the Reactor — skipped when --no-switchboard
3. Connect    → web UI child process pointing at Switchboard
4. Routine    → tick-based trigger loop processing document events — skipped when --no-routine
```

### Step 1: Reactor

Calls the lazy `getReactor()` accessor, which invokes the user's `configureReactor().create()` factory. The factory receives a `ReactorSetupContext` containing:

- `workdir`, `config`, `workspace` — standard context
- `emit`, `on` — event bus hooks
- `switchboard` — the `SwitchboardConfig` from `configureReactor()`, so the factory can set `enableSync` on the underlying Reactor builder

The factory returns a `ReactorContext` with `client`, `driveId`, `_module` (the internal `ReactorClientModule`), and a `shutdown()` function. The `_module` is opaque to the user — it exists so the framework can pass it to Switchboard without coupling the user's code to Reactor internals.

**Output:** `Reactor ready (drive: {driveId})`

### Step 2: Switchboard

Runs only if `reactorConfig.switchboard.enabled` is true, `--no-switchboard` is not set, and the Reactor produced a `_module`. Switchboard is not a full service (no `ServiceManager`, no detached process) — it runs in-process as a NestJS HTTP server.

Before starting, it resolves the port via `resolvePort()`, which scans the configured port range for the first available port and throws with a clear error if none is free. This combines port checking and selection in one step.

The Switchboard host and port are configurable via `SwitchboardConfig.host` (default `'localhost'`) and `SwitchboardConfig.port` (default derived from CLI name). After startup, the URLs are propagated back to `ReactorContext` (`switchboardUrl`, `driveUrl`, `mcpUrl`) so that downstream consumers (Connect, agent tools) can find them.

**Output:** `Switchboard ready at http://localhost:{port}/graphql`
**Debug:** `drive: http://localhost:{port}/d/{driveId}`, `mcp: http://localhost:{port}/mcp`

### Step 3: Connect

Runs only if `reactorConfig.connect.enabled` is true and a `ServiceManager` is available. Connect is a full managed service — a detached child process that persists beyond CLI exit.

Before starting, the sequence checks for an already-running Connect instance:

1. **Same workdir** → skip, output the existing URL from the readiness capture.
2. **Different workdir** → stop the old instance, start a new one. This handles the case where the user switches projects between CLI invocations. The wrong-workdir stop is logged at `info` level (visible without `--verbose`).
3. **Not running** → start fresh.

Connect is started via `ServiceManager.start()`, which runs the service definition's preflight checks (`checkCommand('ph')` and `checkPort()`), spawns the detached process, and waits for the readiness pattern to match in the process's stdout log. The readiness pattern captures the actual URL from Vite's output (`Local:   http://localhost:3000/`), so the URL displayed to the user is the real bound address, not a guess.

**Output:** `Connect ready at http://localhost:3000/` or `Connect already running at http://localhost:3000/`

### Step 4: Routine

Sets the resolved context on the routine and starts the tick loop. This is the final step because triggers may immediately query the Reactor or inspect Switchboard state. **Skipped when `--no-routine` / `-R` is set.**

**Output:** `Routine running`

## REPL Before Startup

In interactive mode, the REPL session is created and the welcome message is displayed **before** `startupSequence()` runs. This is deliberate: the user sees the prompt immediately while Reactor, Switchboard, and Connect initialize in the background (from the user's perspective — they're actually sequential but happen after the welcome).

The startup sequence's `output` callback writes status messages into the same stream as the REPL, so messages like "Reactor ready" appear inline as the user waits. In headless/test mode, they go to the `stdout` callback.

## EOF Keep-Alive

In interactive-streaming mode (piped stdin / `interactiveInput`), there are two reasons the process should stay alive after the input stream closes:

1. **The routine is active** — the trigger loop is processing document events and the Switchboard is serving requests. Tearing down on EOF would kill a running server.
2. **The switchboard is enabled** — an HTTP server has no purpose if the process exits immediately.

The rule: **when stdin reaches EOF and any keep-alive condition is active (`hasKeepAlive`), the process blocks on SIGINT/SIGTERM instead of tearing down.** When no keep-alive condition is active, EOF causes a clean teardown and exit — the process has no reason to stay alive.

This means:
- `echo "hello" | connect-agent -i` → processes "hello", then stays alive (routine/switchboard serving)
- `connect-agent -i -R -S < input.txt` → processes input, then exits cleanly (both suppressed)
- `connect-agent -i` in a real TTY → Ink REPL manages lifecycle, unaffected

## Teardown

`teardown()` is a single function that shuts down everything in reverse order:

```
1. Routine    → stop tick loop
2. Switchboard → stop HTTP server
3. Reactor    → kill PGlite process
```

Connect is **not** shut down by teardown — it's a detached process that intentionally survives CLI exit. The user manages it via `connect-stop`.

Teardown is called from these sites:
- Interactive mode exit (after REPL session ends or EOF processing)
- Keep-alive signal handler (SIGINT/SIGTERM in headless or interactive-streaming mode)
- Command execution after command/prompt completion
- Help display after Commander finishes
- `startupSequence` catch block (on error, before re-throwing)

Before the refactor, each site had its own inline `await switchboardInstance?.shutdown(); await cachedReactor?.shutdown()` sequence — easy to get wrong when adding new shutdown steps. The centralized `teardown()` ensures consistency and makes it trivial to add a new layer.

## Error Handling

### Startup errors are fatal

If any step in `startupSequence()` throws, the catch block runs `teardown()` to clean up everything started so far, then re-throws. The caller catches the re-thrown error, logs it via `log.error()` (always visible — error level), and exits with code 1.

This means a port conflict on Switchboard will:
1. Leave the Reactor running momentarily
2. `teardown()` will shut down the Reactor
3. The error message is displayed
4. CLI exits cleanly with code 1

### Preflight errors give actionable messages

Both Switchboard and Connect use the same `checkPort()` factory from the service infrastructure. Error messages follow the pattern:

```
Switchboard port 4801 is already in use
  Hint: Stop the process using port 4801, or set a different port in config.
```

Connect also runs `checkCommand('ph')` which catches missing CLI installations:

```
Connect Studio: 'ph' command not found
  Hint: Install the Powerhouse CLI: npm install -g ph-cli
```

### Connect wrong-workdir is a warning, not an error

If Connect is running in a different workdir, the startup sequence stops it and starts a new instance. This is logged at `info` level (visible without `--verbose`) because it's a significant state change the user should know about, but it's not an error — it's automatic recovery.

## Logging Strategy

The startup sequence uses two output channels:

### `output()` — stdout, always visible

Concise status messages with the most relevant parameters. These are what a normal user sees:

```
Reactor ready (drive: abc123)
Switchboard ready at http://localhost:4801/graphql
Connect ready at http://localhost:3000/
Routine running
```

### `log` — stderr, level-filtered

- **`log.debug()`** (--verbose only): Implementation details — storage paths, preflight steps, startup timing, workdir resolution. Useful for debugging configuration issues.
- **`log.info()`** (always visible): Important state changes that aren't errors — stopping a wrong-workdir Connect instance.
- **`log.error()`** (always visible): Fatal startup errors before graceful shutdown.

The distinction is intentional: `output()` is the public API of the startup sequence (what the REPL displays), while `log` is the diagnostic channel (what you grep in CI logs).

## Separation of Concerns

### Switchboard is not a service

Switchboard runs in-process — it's a NestJS HTTP server started by `startSwitchboard()`. It does not go through `ServiceManager` because:

- It shares the Reactor's process (they communicate via `_module`, not HTTP)
- It must shut down before the Reactor (reverse dependency order)
- It doesn't need detached process management, PID tracking, or restart policies

However, Switchboard **reuses** the service infrastructure's preflight functions (`checkPort`) for port validation. This gives consistent error messages without coupling Switchboard to the service lifecycle.

### Connect is a full service

Connect runs as a detached child process via `ServiceManager`. It survives CLI exit, has readiness detection, preflight checks, and managed shutdown. This is appropriate because:

- Connect is a Vite dev server — a separate Node.js process
- It needs to persist across CLI restarts (otherwise the browser tab dies every time the CLI restarts)
- Multiple CLIs might race to start Connect on the same port — service state files prevent this

### Reactor is neither

The Reactor is an in-process library (PGlite + Reactor SDK). It's not a service and not an HTTP server. It's created via a user-provided factory and accessed via the lazy `getReactor()` accessor. The factory pattern exists because different CLIs configure the Reactor differently (different document models, storage paths, sync settings).

### `_module` bridges Reactor and Switchboard

The Reactor factory returns a `ReactorContext` with a `_module` field — the raw `ReactorClientModule` from `@powerhousedao/reactor`. This is deliberately typed as `any` because the Reactor SDK is an optional peer dependency.

The `_module` exists solely so the framework can pass it to `startSwitchboard()` without the user's code needing to know about Reactor internals. Before the refactor, `buildDefaultReactor()` started Switchboard internally, which coupled the Reactor factory to Switchboard configuration. Now they're separate steps in the startup sequence, connected only by `_module`.

### `enableSync` flows through `ReactorSetupContext`

When Switchboard is configured, the Reactor needs to enable its sync channel scheme at build time. Rather than having the user manually coordinate this, the framework passes `reactorConfig.switchboard` into `ReactorSetupContext`. The standard `buildDefaultReactor()` helper reads `ctx.switchboard?.enabled` to set `enableSync` on the Reactor builder. Custom factories can do the same or ignore it.

## Configuration

### Port Derivation

Default ports are derived deterministically from the CLI name via a DJB2 hash, so multiple CLIs (e.g. `ph-rupert` and `ph-mara`) don't collide:

- `defaultPort(cliName, 'switchboard')` → range 10000–59900
- `defaultPort(cliName, 'connect')` → range 10000–59900

When `portRange > 1`, the system scans `[port, port+range-1]` for the first free port using `resolvePort()`. If no port is free, a clear error is shown.

Port and name defaults are stamped synchronously in `configureReactor()` via `resolveReactorDefaults()`. The actual async port scan happens later in `startSwitchboardLayer()` / connect preflight.

### Service Name Namespacing

Service IDs and labels are derived from the CLI name:

- Connect service ID: `{cliName}-connect` (was `'connect'`)
- Switchboard label: `{cliName}-switchboard` (was `'Switchboard'`)

Both are configurable via the `name` field on their respective configs.

### `SwitchboardConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | — | Whether to start Switchboard |
| `host` | `string` | `'localhost'` | Hostname/IP to bind to |
| `port` | `number` | `hash(cliName, 'switchboard')` | HTTP port |
| `portRange` | `number` | `1` | Scan port..port+range-1 for first free |
| `name` | `string` | `'{cliName}-switchboard'` | Service label for preflight messages |

### `ConnectConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | — | Whether to start Connect |
| `port` | `number` | `hash(cliName, 'connect')` | HTTP port (passed to `ph connect --port`) |
| `portRange` | `number` | `1` | Scan port..port+range-1 for first free |
| `workdir` | `string` | CLI workdir | Must be a Reactor Package project |
| `name` | `string` | `'{cliName}-connect'` | Service ID for ServiceManager |

Note: Connect does not have a `host` field. The `ph connect` command (ph-cli v6) does not support `--host`. See `specs/issues/ph-connect-missing-host-flag.md`.

### Where config lives

Both `switchboard` and `connect` are fields on `ReactorConfiguration`, set via `configureReactor()`:

```typescript
cli.configureReactor({
  create: (ctx) => buildDefaultReactor(ctx, { ... }),
  switchboard: { enabled: true },          // port + name derived from CLI name
  connect: { enabled: true, workdir: agentAppDir },
});
```

Explicit overrides still work: `switchboard: { enabled: true, port: 4801, name: 'my-switchboard' }`.

This is deliberate: Switchboard and Connect depend on the Reactor, so their config lives alongside the Reactor factory. The startup sequence reads it from `reactorConfig.switchboard` and `reactorConfig.connect`.

## Design Rules

1. **Fixed order, explicit dependencies.** Reactor → Switchboard → Connect → Routine. Each step can assume the previous one completed. No parallel startup, no implicit ordering.

2. **Startup errors are fatal and clean.** If step N fails, tear down steps 1..N-1 in reverse order, then exit. Never leave orphaned in-process servers.

3. **Connect survives CLI exit.** It's a detached service, not an in-process component. The startup sequence starts it but does not own its lifecycle.

4. **Skip, don't crash.** If Connect is already running in the right workdir, skip it. If it's running in the wrong workdir, stop it and restart. Never throw because a service is already up.

5. **URLs come from readiness, not config.** The Connect URL displayed to the user is captured from the actual Vite output, not constructed from config. Config provides defaults for the fallback case only.

6. **Preflight is reusable.** `checkPort()`, `checkCommand()`, and `checkWorkdir()` are service-infrastructure functions. Switchboard reuses `checkPort()` even though it's not a service. This keeps error messages consistent across the system.

7. **Output what matters, log the rest.** The `output()` callback shows URLs, ports, and drive IDs. `log.debug()` shows storage paths, preflight steps, and internal state. The user shouldn't need `--verbose` to know where their services are running.

8. **One teardown function.** All exit paths call the same `teardown()`. Adding a new layer means adding one line to `teardown()`, not hunting for five inline shutdown sequences.
