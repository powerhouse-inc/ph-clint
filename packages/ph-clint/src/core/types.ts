import type { z } from 'zod';

/**
 * Utility type: infer the TypeScript type from a Zod config schema.
 * Use in implementation projects for type-strict config access:
 *
 * ```ts
 * const configSchema = z.object({ port: z.number().default(3000) });
 * type MyConfig = InferConfig<typeof configSchema>;
 * // MyConfig = { port: number }
 * ```
 */
export type InferConfig<T extends z.ZodType> = z.infer<T>;

/**
 * A key-value store for CLI-managed state.
 * Backed by `{workdir}/.ph/{cli-name}/` on disk, or in-memory for testing.
 */
export interface WorkdirStore {
  /** Root directory of this store (e.g. `{workdir}/.ph/{cli-name}/`). */
  readonly basePath: string;
  read<T>(key: string, fallback: T): Promise<T>;
  write(key: string, value: unknown): Promise<void>;
}

/**
 * Context passed to command execute functions.
 * Provides access to workdir, workspace, resolved config, and optional runtime services.
 */
export interface CommandContext<TConfig = Record<string, unknown>> {
  /** The resolved working directory — where the user/agent collaborate on data. */
  workdir: string;
  /** Key-value store for CLI-managed state at {workdir}/.ph/{cli-name}/. */
  workspace: WorkdirStore;
  config: TConfig;
  /** Write progressive output during command execution (raw — no trailing newline added). */
  stdout: (text: string) => void;
  routine?: Routine;
  processes?: ProcessManager;
  services?: ServiceManager;
  emit?: (event: string, data?: unknown) => void;
}

/**
 * Interactive parameter prompting configuration for a command.
 * Used by the REPL to prompt for missing/optional parameters.
 */
export interface PromptConfig {
  promptForDefaults?: boolean;
  promptOptional?: string[];
}

/**
 * Interactive mode (REPL) configuration.
 * When used in CliOptions, `welcome` may be a Resolvable<string>.
 * After resolution (in `Cli.interactive`), it is always a plain string.
 * TConfig is inferred from the CLI's configSchema.
 */
export interface InteractiveConfig<TConfig = Record<string, unknown>> {
  welcome: Resolvable<string, TConfig>;
}

/**
 * Resolved interactive config — all Resolvable values have been resolved.
 */
export interface ResolvedInteractiveConfig {
  welcome: string;
}

/**
 * A command definition — the atomic unit of ph-clint.
 * Compatible with Mastra createTool() shape.
 */
export interface Command<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
  TConfig = Record<string, unknown>,
> {
  id: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: z.ZodType<TOutput>;
  prompt?: PromptConfig;
  execute: (input: z.output<TInput>, context: CommandContext<TConfig>) => Promise<TOutput>;
}

// ── Streaming ────────────────────────────────────────────────────

/**
 * Typed chunks for streaming command/agent output.
 * Framework-agnostic — the Mastra integration maps its fullStream chunks
 * to these types, and the REPL/CLI renders them.
 */
export interface TextDeltaChunk {
  type: 'text-delta';
  text: string;
}

export interface ToolCallChunk {
  type: 'tool-call';
  toolName: string;
  args: unknown;
}

export interface ToolResultChunk {
  type: 'tool-result';
  toolName: string;
  result: unknown;
  isError: boolean;
}

export interface ErrorChunk {
  type: 'error';
  error: string;
}

export type StreamChunk =
  | TextDeltaChunk
  | ToolCallChunk
  | ToolResultChunk
  | ErrorChunk;

// ── Agent Provider ───────────────────────────────────────────────

/**
 * Options for streaming an agent prompt.
 */
export interface AgentStreamOptions {
  threadId?: string;
  tools?: Map<string, Command>;
}

/**
 * Abstract agent provider — the boundary between the core and
 * agent integrations (Mastra, etc.). Core code never imports
 * agent framework modules directly.
 */
export interface AgentProvider {
  id: string;
  stream(
    prompt: string,
    opts?: AgentStreamOptions,
  ): AsyncGenerator<StreamChunk>;
}

// ── Integration ──────────────────────────────────────────────────

/**
 * An optional integration that plugs into the CLI lifecycle.
 * Mastra and Powerhouse each implement this interface.
 */
export interface Integration {
  id: string;
  agents?: AgentProvider[];
  setup?(context: CommandContext): Promise<void>;
  teardown?(): Promise<void>;
}

// ── Work Items ────────────────────────────────────────────────────

/**
 * A work item produced by a trigger for the routine loop to execute.
 */
export interface WorkItem {
  type: 'command' | 'function';
  params: Record<string, unknown>;
  callbacks?: {
    onSuccess?: (result: unknown) => void;
    onFailure?: (error: Error) => void;
  };
}

// ── Triggers ──────────────────────────────────────────────────────

/**
 * Context passed to trigger setup() and poll() functions.
 */
export interface TriggerContext {
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  emit: (event: string, data?: unknown) => void;
}

/**
 * Options for defineTrigger().
 */
export interface TriggerOptions {
  id: string;
  type: 'condition';
  setup?: (context: TriggerContext) => Promise<void>;
  poll: (context: TriggerContext) => Promise<WorkItem | null>;
}

/**
 * A trigger instance — produces work items for the routine loop.
 */
export interface Trigger {
  id: string;
  type: string;
  setup?: (context: TriggerContext) => Promise<void>;
  poll: (context: TriggerContext) => Promise<WorkItem | null>;
}

// ── Routine ───────────────────────────────────────────────────────

/**
 * State machine states for the routine loop.
 */
export type RoutineStatus = 'init' | 'ready' | 'running' | 'stopping';

/**
 * A routine — a tick-based execution loop with pluggable triggers.
 */
export interface Routine {
  readonly status: RoutineStatus;
  start(): void;
  stop(): Promise<void>;
  /** Optional callback for work item output. Set before start() to capture results. */
  onOutput?: (text: string) => void;
  /** Update the context used for command execution within the routine. */
  setContext(context: CommandContext): void;
}

// ── Process Management ────────────────────────────────────────────

/**
 * A handle to a running or completed process.
 */
export interface ProcessHandle {
  label: string;
  status: 'running' | 'succeeded' | 'failed';
  kill(): void;
}

/**
 * Manages bounded shell command execution.
 */
export interface ProcessManager {
  run(
    command: string,
    opts?: { label?: string; timeout?: number },
  ): Promise<{ success: boolean; output: string }>;
  list(): ProcessHandle[];
}

// ── Services ──────────────────────────────────────────────────────

/**
 * A named readiness pattern for multi-pattern readiness detection.
 * The service becomes ready when ALL patterns have matched.
 */
export interface ReadinessPattern {
  name: string;
  pattern: RegExp;
  captures?: Record<string, number>;
}

/**
 * Readiness configuration for a service.
 *
 * Supports two forms:
 * - Single pattern: `{ pattern, captures?, timeout, wait? }`
 * - Multiple patterns: `{ patterns, timeout, wait? }` — ready when ALL match
 */
export interface ReadinessConfig {
  /** Single readiness pattern (mutually exclusive with `patterns`). */
  pattern?: RegExp;
  /** Captures for the single pattern. Maps endpoint name → capture group index. */
  captures?: Record<string, number>;
  /** Multiple named readiness patterns — service is ready when ALL have matched. */
  patterns?: ReadinessPattern[];
  /** Max time (ms) to wait for all patterns to match before marking failed. */
  timeout: number;
  /** Block until ready (default true). When false, mark ready immediately after spawn. */
  wait?: boolean;
}

/**
 * Definition for a long-running background service.
 * Services are spawned as detached processes that survive CLI exit.
 */
export interface ServiceDefinition<TConfig = Record<string, unknown>> {
  id: string;
  label: string;
  command: string;
  env?: (config: TConfig) => Record<string, string>;
  readiness?: ReadinessConfig;
  shutdown?: { signal: NodeJS.Signals; timeout: number };
  restart?: { enabled: boolean; maxRetries: number; delay: number };
}

/**
 * Runtime status of a service.
 */
export interface ServiceStatus {
  id: string;
  label: string;
  status: 'idle' | 'starting' | 'ready' | 'failed' | 'stopping';
  pid?: number;
  endpoints?: Record<string, string>;
  error?: string;
  restartAttempt?: number;
}

/**
 * Manager for long-running background services.
 */
export interface ServiceManager {
  start(id: string): Promise<void>;
  stop(id: string): Promise<void>;
  list(): ServiceStatus[];
  /** Get the static definition for a service. */
  getDefinition(id: string): ServiceDefinition | undefined;
  logs(id: string, lines?: number): string;
  /** Watch a service's log file for new lines. Returns cleanup function. */
  watchLogs(id: string, onLine: (line: string) => void): () => void;
}

// ── Event Bus ─────────────────────────────────────────────────────

/**
 * A central event bus for decoupled communication.
 */
export interface EventBus {
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data?: unknown) => void): void;
  off(event: string, handler: (data?: unknown) => void): void;
}

// ── Routine Config ────────────────────────────────────────────────

/**
 * Configuration for the routine loop.
 */
export interface RoutineConfig {
  tickInterval?: number;
  idleInterval?: number;
}

// ── Resolvable ────────────────────────────────────────────────────

/**
 * A value that can be provided directly or resolved lazily from context.
 * Used for settings that may depend on runtime state (workdir, config).
 * TConfig is inferred from the CLI's configSchema when used inside defineCli().
 */
export type Resolvable<T, TConfig = Record<string, unknown>> = T | ((ctx: { workdir: string; config: TConfig }) => T);

// ── Agent Context ─────────────────────────────────────────────────

/**
 * Context passed to agent factory callbacks.
 * Provides everything the factory needs to construct an agent.
 * TConfig is inferred from the CLI's configSchema.
 */
export interface AgentContext<TConfig = Record<string, unknown>> {
  workdir: string;
  config: TConfig;
  cliName: string;
  cliVersion: string;
  context: CommandContext;
  commands: Command<any, any, any>[];
}

// ── Agent Loader ──────────────────────────────────────────────────

/**
 * A loader that dynamically imports and constructs the agent.
 * Receives the full AgentContext (including auto-injected commands)
 * and should return a configured AgentProvider.
 */
export type AgentLoader<TConfig = Record<string, unknown>> =
  (ctx: AgentContext<TConfig>) => Promise<AgentProvider>;

// ── CLI ───────────────────────────────────────────────────────────

/**
 * Options for defineCli().
 *
 * Generic over TSchema — inferred from `configSchema`. This propagates the
 * resolved config type into `Resolvable` callbacks, `AgentContext`, and
 * `InteractiveConfig`, so `ctx.config` is fully typed without casts.
 */
export interface CliOptions<TSchema extends z.ZodType = z.ZodType<Record<string, unknown>>> {
  name: string;
  version: string;
  description: Resolvable<string, z.infer<TSchema>>;
  commands: Command<any, any, any>[];
  configSchema?: TSchema;
  interactive?: InteractiveConfig<z.infer<TSchema>>;
  triggers?: Trigger[];
  routine?: RoutineConfig;
  integrations?: Integration[];
  /** Service definitions for the ServiceManager. */
  services?: ServiceDefinition<z.infer<TSchema>>[];
  /** Event handlers registered on the event bus. */
  events?: Record<string, (data: any) => void>;
  /**
   * Implementation-level workdir override. When set, the --workdir/-w CLI flag
   * is hidden — the implementation owns the decision of where the workspace is.
   * When omitted, the user can set it via --workdir or it defaults to cwd.
   */
  workdir?: string;
  /**
   * Implementation-level config defaults. These form layer 5 of the 6-layer
   * config resolution (above hardcoded schema defaults, below user/local config).
   */
  configDefaults?: Record<string, unknown>;
}

/**
 * Output handlers for run(). Defaults to process.exit/console.log/process.stderr.
 *
 * For interactive mode testing, `interactiveInput` provides a headless REPL
 * that reads from the iterable instead of rendering Ink.
 */
export interface RunOptions {
  exit?: (code: number) => void;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
  /** Headless interactive mode: lines are read from this iterable instead of Ink. */
  interactiveInput?: AsyncIterable<string>;
  /** Resume a previous agent conversation by thread ID. */
  resume?: string;
  /** Override workdir for testing (replaces cwd fallback). */
  workdir?: string;
  /** Path to a config file (--config flag value), relative to cwd. */
  configFile?: string;
}

/**
 * Environment variable mapping for a config field.
 */
export interface ConfigEnvVar {
  name: string;
  field: string;
  description: string;
}

/**
 * A CLI instance returned by defineCli().
 */
export interface Cli {
  name: string;
  version: string;
  description: string;
  configSchema?: z.ZodType;
  interactive?: InteractiveConfig<any> | ResolvedInteractiveConfig;
  /** True when an agent loader has been set. */
  hasAgent: boolean;
  /** Set the agent loader — called lazily when the agent is first needed. */
  setAgentLoader(loader: AgentLoader<any>): void;
  getCommand(id: string): Command | undefined;
  listCommands(): Command[];
  execute(
    commandId: string,
    args: Record<string, unknown>,
    context?: CommandContext,
  ): Promise<unknown>;
  parseArgs(commandId: string, argv: string[]): Record<string, unknown>;
  generateHelp(): string;
  generateCommandHelp(commandId: string): string;
  generateCompletion(shell: string): string;
  configEnvVars(): ConfigEnvVar[];
  run(argv: string[], options?: RunOptions): Promise<void>;
  stopRoutine?(): Promise<void>;
}
