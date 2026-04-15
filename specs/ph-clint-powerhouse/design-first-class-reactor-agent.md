# Design: First-class Reactor and Agent access

## Problem

The trigger → agent → document reaction loop (the core use case for examples 06-08) is unreasonably hard to wire. See `issue-trigger-context-gap.md` for the full problem statement.

Root causes:

1. **TriggerContext is too narrow.** It exposes `config`, `state`, `emit`, `on` — but not the reactor client or agent provider. Triggers must use module-level mutable state to access these.

2. **Reactor and agent have asymmetric lifecycles.** The reactor is a push-based `Integration` that mutates `context.powerhouse` during `setup()`. The agent is a pull-based lazy factory via `setAgentLoader()` / `getAgentProvider()`. Neither is accessible from triggers.

3. **The `Integration` abstraction is premature.** `integrations: Integration[]` in `CliOptions` was designed for generic extensibility, but only two integrations exist (Powerhouse and Mastra), and both are first-class framework features. The abstraction obscures their configuration and forces the reactor through an opaque setup/teardown lifecycle.

## Design

### Principle: reactor and agent are symmetric first-class capabilities

Both follow the same pattern:
- **Configured late** — via `cli.configureReactor()` / `cli.configureAgent()` after `defineCli()`, because their factories may depend on resolved config, imports, or CLI shape.
- **Loaded lazily** — the factory runs on first access, then caches. No work is done for commands that don't need them.
- **Accessed uniformly** — via `reactor()` and `agent()` async accessors that return the capability or `undefined`.

### Public API changes

#### `defineCli` — remove integration-specific concerns

```typescript
interface CliOptions<TSchema, TSecrets> {
  name: string;
  version: string;
  description: Resolvable<string>;
  commands: Command[];
  configSchema?: TSchema;
  secretsSchema?: TSecrets;
  interactive?: InteractiveConfig;
  triggers?: Trigger[];
  routine?: RoutineConfig;
  services?: ServiceDefinition[];
  events?: Record<string, (data: any) => void>;
  prompts?: PromptsConfig;
  workdir?: string;
  configDefaults?: Record<string, unknown>;
  // REMOVED: integrations?: Integration[];
}
```

#### `cli.configureAgent()` — replaces `cli.setAgentLoader()`

```typescript
cli.configureAgent((ctx: AgentSetupContext) => Promise<AgentProvider>);
```

Same semantics as today's `setAgentLoader`, renamed for symmetry. `AgentContext` is renamed to `AgentSetupContext` to avoid collision with the accessor return type.

#### `cli.configureReactor()` — replaces `definePowerhouseIntegration()`

```typescript
cli.configureReactor({
  create: (ctx: ReactorSetupContext) => Promise<ReactorContext>,
  // Static service templates — injected into command map immediately
  connect?: ConnectConfig,
  switchboard?: SwitchboardConfig,
});
```

The `create` factory receives `ReactorSetupContext` (workdir, config, workspace, emit) and returns a `ReactorContext` (client, driveId, URLs, shutdown). The factory is responsible for calling `buildReactor()`, `ensureDrive()`, `bridgeSubscriptions()`, and optionally `startSwitchboard()`.

`connect` and `switchboard` fields are static service templates. When present, `configureReactor()` immediately injects the corresponding service commands (`connect start`, `connect stop`, etc.) into the command map — no need to pass `services: [...]` separately.

#### `ReactorSetupContext` — what the factory receives

```typescript
interface ReactorSetupContext {
  workdir: string;
  config: Record<string, unknown>;
  workspace: WorkdirStore;
  emit?: (event: string, data?: unknown) => void;
}
```

Core infrastructure only. The factory builds the reactor from this.

#### `ReactorContext` — what the factory returns (replaces `PowerhouseContext`)

```typescript
interface ReactorContext {
  /** The Reactor client — IReactorClient from @powerhousedao/reactor. */
  client: any;
  /** The default drive ID. */
  driveId: string;
  /** Switchboard URLs (populated when switchboard is started by the factory). */
  switchboardUrl?: string;
  driveUrl?: string;
  mcpUrl?: string;
  /** Connect web UI URL (populated after Connect service starts). */
  connectUrl?: string;
  /** Teardown — called by the framework on CLI exit. */
  shutdown(): Promise<void>;
}
```

Same shape as today's `PowerhouseContext` plus an explicit `shutdown()` that the framework calls during teardown. Renamed to `ReactorContext` for consistency.

#### `CommandContext` — gets `reactor()` and `agent()` accessors

```typescript
interface CommandContext<TConfig = Record<string, unknown>> {
  workdir: string;
  workspace: WorkdirStore;
  config: TConfig;
  stdout: (text: string) => void;
  log?: Logger;
  routine?: Routine;
  processes?: ProcessManager;
  services?: ServiceManager;
  emit?: (event: string, data?: unknown) => void;
  reactor(): Promise<ReactorContext | undefined>;
  agent(): Promise<AgentProvider | undefined>;
  // REMOVED: powerhouse?: PowerhouseContext;
}
```

Commands access the reactor via `context.reactor()` and the agent via `context.agent()`. Both are lazy — first call triggers initialization, subsequent calls return the cached instance.

#### `CoreContext` — CommandContext minus the two capabilities

```typescript
type CoreContext<TConfig = Record<string, unknown>> =
  Omit<CommandContext<TConfig>, 'reactor' | 'agent'>;
```

Used as `TriggerContext.context` to avoid duplicate access paths.

#### `TriggerContext` — gets `reactor()` and `agent()` as top-level accessors

```typescript
interface TriggerContext {
  context: CoreContext;
  state: Record<string, unknown>;
  reactor(): Promise<ReactorContext | undefined>;
  agent(): Promise<AgentProvider | undefined>;
}
```

Triggers access reactor and agent at the top level: `ctx.reactor()`, `ctx.agent()`. Infrastructure is on `ctx.context` (workdir, config, emit, services, etc.). No duplicate paths — reactor/agent are not on `ctx.context`.

#### `Cli` interface — updated methods

```typescript
interface Cli {
  // ... existing: name, version, description, etc.
  hasAgent: boolean;
  hasReactor: boolean;
  configureAgent(factory: (ctx: AgentSetupContext) => Promise<AgentProvider>): void;
  configureReactor(config: ReactorConfiguration): void;
  // REMOVED: setAgentLoader(loader: AgentLoader): void;
  // ... rest unchanged
}
```

### Removed types

| Type | Replacement |
|------|-------------|
| `Integration` | Removed entirely (YAGNI) |
| `PowerhouseContext` | `ReactorContext` |
| `PowerhouseIntegrationOptions` | `ReactorConfiguration` (the `configureReactor` arg) |
| `PowerhouseIntegrationResult` | Removed (no return value needed) |
| `AgentContext` | `AgentSetupContext` (the factory input) |
| `AgentLoader` | Inline function type in `configureAgent` |

### Internal changes

#### `cli.ts` — run() lifecycle

`ensureIntegrationsReady()` is removed. The two lazy initializers replace it:

```typescript
let cachedReactor: ReactorContext | undefined;
async function getReactor(): Promise<ReactorContext | undefined> {
  if (cachedReactor) return cachedReactor;
  if (!reactorConfig) return undefined;
  const rCtx: ReactorSetupContext = { workdir, config, workspace, emit };
  cachedReactor = await reactorConfig.create(rCtx);
  return cachedReactor;
}

let cachedAgent: AgentProvider | undefined;
async function getAgent(): Promise<AgentProvider | undefined> {
  if (cachedAgent) return cachedAgent;
  if (!agentFactory) return undefined;
  // Reactor is initialized first — agent may need reactor tools
  await getReactor();
  const aCtx: AgentSetupContext = { workdir, config, context, ... };
  cachedAgent = await agentFactory(aCtx);
  return cachedAgent;
}
```

Both `CommandContext` and `TriggerContext` bind to these same functions.

**Teardown**: At CLI exit, `cachedReactor?.shutdown()` is called. No reverse-order integration loop needed.

#### `routine.ts` — TriggerContext construction

`makeTriggerContext` receives the lazy accessors and a live reference to `ctx` (the CommandContext minus reactor/agent):

```typescript
interface RoutineOptions {
  triggers: Trigger[];
  commands: Map<string, Command>;
  tickInterval?: number;
  idleInterval?: number;
  context?: CoreContext;
  eventBus?: EventBus;
  processManager?: ProcessManager;
  getReactor?: () => Promise<ReactorContext | undefined>;
  getAgent?: () => Promise<AgentProvider | undefined>;
}

function makeTriggerContext(trigger: Trigger): TriggerContext {
  const state: Record<string, unknown> = {};
  return {
    get context() { return ctx; },  // live reference
    state,
    reactor: () => options.getReactor?.() ?? Promise.resolve(undefined),
    agent: () => options.getAgent?.() ?? Promise.resolve(undefined),
  };
}
```

#### `configureReactor()` — service command injection

```typescript
configureReactor(config: ReactorConfiguration): void {
  reactorConfig = config;

  // Inject Connect service commands immediately
  if (config.connect?.enabled) {
    const def = connectServiceDefinition(config.connect);
    for (const cmd of createServiceCommands(def)) {
      commandMap.set(cmd.id, cmd);
    }
    pendingServiceDefs.push(def);
  }

  // Switchboard service commands if applicable
  if (config.switchboard?.enabled) {
    // similar pattern
  }
}
```

Service definitions are static templates — they don't need the reactor to be running. Actual service startup happens inside the `create` factory or later during `run()`.

### Convenience helpers

The `create` factory in `configureReactor` gives full control, but the common case (build reactor, ensure drive, bridge subscriptions, optionally start switchboard) should be easy:

```typescript
// Provided by ph-clint as a helper (not the only way)
import { buildDefaultReactor } from 'ph-clint/reactor';

cli.configureReactor({
  create: (ctx) => buildDefaultReactor(ctx, {
    documentModels,
    drive: { name: 'Agent Chat' },
    subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
    switchboard: { enabled: true, port: 4801 },
  }),
  connect: { enabled: true, port: 3000, workdir: agentAppDir },
});
```

`buildDefaultReactor` is a helper that composes `buildReactor()` + `ensureDrive()` + `bridgeSubscriptions()` + `startSwitchboard()` and returns a `ReactorContext`. Advanced users write their own factory.

### Example: before and after

#### Before (188 lines, module-level state, integration wrapper)

```typescript
// Module-level mutable state for the trigger callback
let phContext: PowerhouseContext | undefined;
let innerAgent: AgentProvider | undefined;
let agentProcessing = false;

// Wrap the integration to capture PowerhouseContext and create inner agent
const integration = {
  ...phIntegration,
  async setup(context: any) {
    await phIntegration.setup?.(context);
    phContext = context.powerhouse;
    innerAgent = await createInnerAgent({ ... });
  },
};

// Trigger callback uses module-level state
const trigger = createDocumentChangeTrigger({
  async onDocumentChanged() {
    if (!phContext || !innerAgent) return null;
    // ... 70 lines of manual plumbing
  },
});

const cli = defineCli({
  integrations: [integration],
  services: [...services],
  triggers: [trigger],
});
cli.setAgentLoader(createAgent);
cli.run(process.argv);
```

#### After (~40 lines, no workarounds)

```typescript
const cli = defineCli({
  name: 'connect-agent',
  configSchema,
  commands: [],
  triggers: [documentChangeTrigger],
  interactive: { welcome: ... },
});

cli.configureAgent((ctx) => createAgent(ctx));

cli.configureReactor({
  create: (ctx) => buildDefaultReactor(ctx, {
    documentModels,
    drive: { name: 'Agent Chat' },
    subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
    switchboard: { enabled: true, port: 4801 },
  }),
  connect: { enabled: true, port: 3000, workdir: agentAppDir },
});

cli.run(process.argv);
```

```typescript
// trigger.ts
async poll(ctx: TriggerContext): Promise<WorkItem | null> {
  const pending = ctx.state.pendingChanges as Array<unknown>;
  if (pending.length === 0) return null;
  pending.length = 0;

  const reactor = await ctx.reactor();
  const agent = await ctx.agent();
  if (!reactor || !agent) return null;

  const docs = await reactor.client.getChildren(reactor.driveId);
  // ... check last message, build prompt, stream response, write to doc
}
```

## Impact analysis

### Files that change

**Core library (packages/ph-clint/src/):**

| File | Change |
|------|--------|
| `core/types.ts` | Redefine `TriggerContext`, `CommandContext`; add `CoreContext`, `ReactorContext`, `ReactorConfiguration`, `ReactorSetupContext`; rename `AgentContext` → `AgentSetupContext`; remove `Integration`, `PowerhouseContext` reference |
| `core/cli.ts` | Replace `ensureIntegrationsReady` + `getAgentProvider` with `getReactor` + `getAgent`; add `configureReactor()` + `configureAgent()`; remove `setAgentLoader()`; remove `integrations` handling; update teardown |
| `core/routine.ts` | Update `RoutineOptions` with `getReactor`/`getAgent`; update `makeTriggerContext` to use live reference + accessors |
| `integrations/powerhouse/index.ts` | Remove `definePowerhouseIntegration()`; replace with `buildDefaultReactor()` helper |
| `integrations/powerhouse/types.ts` | `PowerhouseContext` → `ReactorContext`; add `ReactorConfiguration`, `ReactorSetupContext`; remove `PowerhouseIntegrationOptions`, `PowerhouseIntegrationResult` |
| `integrations/powerhouse/subscriptions.ts` | Unchanged (called by factory or helper) |
| `integrations/powerhouse/reactor.ts` | Unchanged (called by factory or helper) |
| `integrations/powerhouse/connect.ts` | Unchanged (service definition template) |
| `integrations/mastra/index.ts` | Update `AgentContext` → `AgentSetupContext` |
| `index.ts` | Update exports: remove `Integration`, `definePowerhouseIntegration`, `PowerhouseContext`; add `ReactorContext`, `configureReactor` types; rename `AgentContext` |

**Tests (packages/ph-clint/tests/):**

| File | Change |
|------|--------|
| `cli.test.ts` | `setAgentLoader` → `configureAgent` |
| `session.test.ts` | `setAgentLoader` → `configureAgent` |
| `powerhouse-integration.test.ts` | Rewrite: test `buildDefaultReactor` helper + `configureReactor` instead of `definePowerhouseIntegration` |
| `powerhouse-cli.test.ts` | Update: `integrations` → `configureReactor`; remove "integration can mutate context.powerhouse" test |
| `mastra-integration.test.ts` | `AgentContext` → `AgentSetupContext` |
| `mastra-integration.e2e.test.ts` | `AgentContext` → `AgentSetupContext` |

**Examples:**

| File | Change |
|------|--------|
| `04-chat-assistant/src/cli.ts` | `setAgentLoader` → `configureAgent` |
| `04-chat-assistant/tests/*.ts` | `setAgentLoader` → `configureAgent`; `AgentContext` → `AgentSetupContext` |
| `05-ph-rupert/src/cli.ts` | `setAgentLoader` → `configureAgent` |
| `05-ph-rupert/tests/*.ts` | `setAgentLoader` → `configureAgent` |
| `06-connect-agent/agent-cli/src/cli.ts` | Full rewrite: remove integration wrapper + module-level state; use `configureReactor` + `configureAgent` |
| `06-connect-agent/agent-cli/src/trigger.ts` | Rewrite: use `ctx.reactor()` + `ctx.agent()` |
| `06-connect-agent/agent-cli/src/agent.ts` | Remove `createInnerAgent`; `AgentContext` → `AgentSetupContext` |
| `06-connect-agent/agent-cli/tests/trigger.test.ts` | Update TriggerContext mock shape |

**Specs/docs:**

| File | Change |
|------|--------|
| `specs/ph-clint-powerhouse/phase-1-reactor.md` | Update API examples |
| `examples/07-doc-agent/README.md` | Update code examples |
| `examples/08-reactor-dev/README.md` | Update code examples |

### Migration summary

1. `Integration` interface — deleted, all usages removed
2. `integrations: []` in CliOptions — deleted
3. `definePowerhouseIntegration()` — replaced by `buildDefaultReactor()` helper + `cli.configureReactor()`
4. `PowerhouseContext` — renamed to `ReactorContext`
5. `context.powerhouse` — replaced by `context.reactor()` (commands) or `ctx.reactor()` (triggers)
6. `setAgentLoader()` — renamed to `configureAgent()`
7. `AgentContext` — renamed to `AgentSetupContext`
8. `TriggerContext.config/emit/on` — moved to `TriggerContext.context.config/emit/on`
9. `TriggerContext` gains `reactor()` and `agent()` top-level
10. `ensureIntegrationsReady()` — removed, replaced by lazy `getReactor()`/`getAgent()`
