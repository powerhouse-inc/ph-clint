# Startup Sequence Refactor

## Problem

The CLI startup flow is scattered across multiple if-blocks in `runImpl()`, making it hard to follow. Reactor, Switchboard, and Connect initialization is lazy — nothing triggers it before the routine starts, creating a chicken-and-egg problem: the routine waits for document changes that can never arrive because Switchboard/Connect aren't running.

## Target Flow

```
1. no -i AND (subcommand or prompt)?
   → lazy mode, no startup sequence, no routine

2. -i OR routine defined?
   a. Start REPL if -i (welcome message visible immediately)
   b. Reactor if configured → output to REPL or stdout
   c. Switchboard if configured → output to REPL or stdout
   d. Connect if configured → output to REPL or stdout
   e. Routine if configured → output to REPL or stdout
   f. Run provided prompt or subcommand if any

3. else → show help
```

This must live in a single function that reads as a clear procedure.

## Design Decisions

- **Reactor and Switchboard are separate steps.** Currently `buildDefaultReactor()` bundles both. Switchboard will become a virtual service definition in the future, so it needs its own step now.
- **`_module?: any` on `ReactorContext`** carries the internal `ReactorClientModule` so the framework can pass it to `startSwitchboard()` without coupling to reactor internals.
- **REPL starts before the startup sequence.** The user sees the welcome message immediately; reactor/switchboard/connect/routine status messages appear in the REPL as they complete.
- **Path 1 requires no `-i`.** If `-i` is set, always go to path 2 even if a subcommand or prompt is also provided.

## Implementation Steps

### Step 1: Separate Switchboard from `buildDefaultReactor()`

**`src/integrations/powerhouse/types.ts`**:
- Add `_module?: any` to `ReactorContext` — opaque internal field for the `ReactorClientModule`

**`src/integrations/powerhouse/index.ts`**:
- Remove `switchboard` from `BuildDefaultReactorOptions`
- Remove switchboard startup logic from `buildDefaultReactor()`
- `buildDefaultReactor()` sets `_module` on the returned `ReactorContext`
- Remove the `enableSync` flag from `buildReactor()` call (always false now — sync is switchboard's concern)

**`src/integrations/powerhouse/reactor.ts`**:
- Keep `enableSync` option but document it's for switchboard use

**`src/index.ts`**:
- Export `startSwitchboard` and `StartSwitchboardOptions` from powerhouse integration

**Tests**: Update `tests/powerhouse-integration.test.ts` — remove switchboard-related assertions from `buildDefaultReactor` tests, add separate switchboard test if needed.

### Step 2: Framework starts Switchboard as its own step

**`src/core/cli.ts`**:
- Add `startSwitchboardLayer()` helper that calls `startSwitchboard()` using `cachedReactor._module` and `reactorConfig.switchboard`
- Track `switchboardInstance` for shutdown
- Update teardown sites: shut down switchboard before reactor

### Step 3: Extract `startupSequence()` and restructure `runImpl()`

**`src/core/cli.ts`**:

Extract `startupSequence(output: (msg: string) => void): Promise<void>`:
```
async function startupSequence(output) {
  // 1. Reactor (in-process document store + drive + subscriptions)
  if (reactorConfig) {
    await getReactor();
    output('Reactor ready');
  }

  // 2. Switchboard (GraphQL + MCP endpoint wrapping reactor)
  if (reactorConfig?.switchboard?.enabled && cachedReactor?._module) {
    await startSwitchboardLayer(...);
    output(`Switchboard ready at ${url}`);
  }

  // 3. Connect (web UI child process)
  if (reactorConfig?.connect?.enabled && context.services) {
    await context.services.start('connect');
    output('Connect starting');
  }

  // 4. Routine (tick-based trigger loop)
  if (routine) {
    routine.setContext(context);
    routine.start();
    output('Routine running');
  }
}
```

Restructure `runImpl()` dispatch:
```
// --meta → dump JSON, exit
// Path 1: no -i AND (subcommand or prompt) → lazy, no startup
// Path 2: -i OR routine → startupSequence, then run prompt/subcommand if any
// Path 3: else → show help
```

### Step 4: Update example 06

**`examples/06-connect-agent/agent-cli/src/cli.ts`**:
- Move `switchboard` config from `buildDefaultReactor()` options to `configureReactor()` top-level
- Remove `enableSync` concern (framework handles it)

### Step 5: Handle `enableSync` at framework level

When switchboard is configured, the framework needs to tell the reactor to enable sync. Two options:
- A: Pass `switchboard` config into `ReactorSetupContext` so `create()` can see it
- B: Add `enableSync` to `ReactorConfiguration` inferred from `switchboard.enabled`

Option A is simpler — the `create()` function already receives the setup context.

**`src/integrations/powerhouse/types.ts`**:
- Add `switchboard?: SwitchboardConfig` to `ReactorSetupContext`

**`src/core/cli.ts`**:
- Pass `reactorConfig.switchboard` into the `ReactorSetupContext` when calling `create()`

**`src/integrations/powerhouse/index.ts`**:
- `buildDefaultReactor()` reads `ctx.switchboard?.enabled` to set `enableSync`

## Files Changed

| File | Changes |
|------|---------|
| `src/integrations/powerhouse/types.ts` | `_module` on ReactorContext, `switchboard` on ReactorSetupContext |
| `src/integrations/powerhouse/index.ts` | Remove switchboard from `buildDefaultReactor()`, set `_module` |
| `src/core/cli.ts` | `startupSequence()`, restructure `runImpl()`, `startSwitchboardLayer()` |
| `src/index.ts` | Export `startSwitchboard`, `StartSwitchboardOptions` |
| `tests/powerhouse-integration.test.ts` | Update `buildDefaultReactor` tests |
| `tests/powerhouse-cli.test.ts` | Update for new startup flow |
| `examples/06-connect-agent/agent-cli/src/cli.ts` | Move switchboard config |

## Verification

1. `cd packages/ph-clint && pnpm build && pnpm test`
2. `cd examples/06-connect-agent/agent-cli && pnpm install && pnpm test`
3. Manual: `npx tsx src/cli.ts` in example 06 → Reactor, Switchboard, Connect all start before routine
