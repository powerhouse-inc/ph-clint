import type { z } from 'zod';
import type {
  ReactorContext,
  DocumentRegistry,
  AnyRegistry,
} from '../integrations/powerhouse/types.js';

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

// ── Logging ───────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  level: LogLevel;
}

/**
 * A key-value store for CLI-managed state.
 * Backed by `{workdir}/.ph/{cli-name}/` on disk, or in-memory for testing.
 */
export interface WorkdirStore {
  /** Resolved absolute working directory. */
  getWorkdir(): string;
  /** Path to the local config file: `{workdir}/.ph/{cliName}.config.local.json`. */
  getLocalConfigPath(): string;
  /** Absolute path to `{workdir}/.ph/{cliName}/{path}`. When path is omitted, returns the store root. */
  getStoreFolder(path?: string): string;
  /** Load a JSON file from the store. Throws if filename doesn't end with `.json`. */
  loadJsonObject<T>(filename: string, fallback: T): Promise<T>;
  /** Write a JSON file to the store (atomic write with temp file). */
  storeJsonObject(filename: string, value: unknown): Promise<void>;
  /** Shorthand for loadJsonObject on the local config file. */
  loadLocalConfig<T>(fallback: T): Promise<T>;
  /** Shorthand for storeJsonObject on the local config file. */
  storeLocalConfig(value: unknown): Promise<void>;
}

// ── Framework events ──────────────────────────────────────────────

/**
 * Payload map for framework-emitted events. Registry generic narrows
 * `powerhouse:*` payloads to registered document types.
 *
 * User code registered via declaration merging can extend this interface
 * (or just emit/on with arbitrary string keys; those fall through to the
 * `unknown` overload).
 */
export interface PhClintEvents<R extends DocumentRegistry = AnyRegistry> {
  'powerhouse:ready': { driveId: string };
  'powerhouse:document:changed': {
    changeType: 'updated';
    documents: Array<R[keyof R & string]['document']>;
  };
  'powerhouse:document:created': {
    documentId: string;
    documentType: keyof R & string;
  };
  'powerhouse:document:deleted': { documentId: string };
}

/**
 * Overloaded emit function: typed for framework-emitted events, fallback
 * `unknown` payload for any other event string.
 */
export type EmitFn<R extends DocumentRegistry = AnyRegistry> = {
  <K extends keyof PhClintEvents<R>>(event: K, data: PhClintEvents<R>[K]): void;
  (event: string, data?: unknown): void;
};

/**
 * Overloaded listener registration: typed handler for framework events,
 * fallback `unknown` payload for any other event string.
 */
export type OnFn<R extends DocumentRegistry = AnyRegistry> = {
  <K extends keyof PhClintEvents<R>>(
    event: K,
    handler: (data: PhClintEvents<R>[K]) => void,
  ): void;
  (event: string, handler: (data?: unknown) => void): void;
};

/**
 * Context passed to command execute functions.
 * Provides access to workdir, workspace, resolved config, and optional runtime services.
 */
export interface CommandContext<
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  /** The resolved working directory — where the user/agent collaborate on data. */
  workdir: string;
  /** Key-value store for CLI-managed state at {workdir}/.ph/{cli-name}/. */
  workspace: WorkdirStore;
  config: TConfig;
  /** Write progressive output during command execution (raw — no trailing newline added). */
  stdout: (text: string) => void;
  /** Structured logger — level controlled by --verbose flag or RunOptions.logLevel. */
  log?: Logger;
  routine?: Routine;
  processes?: ProcessManager;
  services?: ServiceManager;
  emit?: EmitFn<R>;
  on?: OnFn<R>;
  /** Lazy reactor accessor — returns the ReactorContext or undefined if not configured. */
  reactor?: () => Promise<ReactorContext<R> | undefined>;
  /** Lazy agent accessor — returns the AgentProvider or undefined if not configured. */
  agent?: () => Promise<AgentProvider | undefined>;
}

/**
 * CommandContext without the reactor/agent accessors.
 * Used as TriggerContext.context to avoid duplicate access paths.
 */
export type CoreContext<
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> = Omit<CommandContext<TConfig, R>, 'reactor' | 'agent'>;

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
  /** Number of trailing lines to show in the output window for tool results. Default: 6. */
  outputWindow?: number;
}

/**
 * Resolved interactive config — all Resolvable values have been resolved.
 */
export interface ResolvedInteractiveConfig {
  welcome: string;
  /** Number of trailing lines to show in the output window for tool results. Default: 6. */
  outputWindow: number;
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
  toolCallId?: string;
  toolName: string;
  args: unknown;
}

export interface ToolResultChunk {
  type: 'tool-result';
  toolCallId?: string;
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
 * Provides core infrastructure via `context`, per-trigger state,
 * and lazy accessors for reactor and agent capabilities.
 */
export interface TriggerContext<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  /** Live reference to the core context (workdir, config, emit, services, etc.). */
  context: CoreContext<TConfig, R>;
  state: TState;
  /** Lazy reactor accessor — returns the ReactorContext or undefined if not configured. */
  reactor: () => Promise<ReactorContext<R> | undefined>;
  /** Lazy agent accessor — returns the AgentProvider or undefined if not configured. */
  agent: () => Promise<AgentProvider | undefined>;
}

/**
 * Options for defineTrigger().
 */
export interface TriggerOptions<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  id: string;
  type: 'condition';
  /** Optional initializer called once per trigger instance before setup()/poll(). */
  state?: () => TState;
  setup?: (context: TriggerContext<TState, TConfig, R>) => Promise<void>;
  teardown?: (context: TriggerContext<TState, TConfig, R>) => Promise<void>;
  poll: (context: TriggerContext<TState, TConfig, R>) => Promise<WorkItem | null>;
}

/**
 * A trigger instance — produces work items for the routine loop.
 */
export interface Trigger<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
  R extends DocumentRegistry = AnyRegistry,
> {
  id: string;
  type: string;
  /** Optional initializer called once per trigger instance before setup()/poll(). */
  state?: () => TState;
  setup?: (context: TriggerContext<TState, TConfig, R>) => Promise<void>;
  teardown?: (context: TriggerContext<TState, TConfig, R>) => Promise<void>;
  poll: (context: TriggerContext<TState, TConfig, R>) => Promise<WorkItem | null>;
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
  readonly triggerIds: string[];
  readonly queueLength: number;
  start(): void;
  stop(): Promise<void>;
  /** Optional callback for work item output. Set before start() to capture results. */
  onOutput?: (text: string) => void;
  /** Update the context used for command execution within the routine. */
  setContext(context: CommandContext): void;
  /** Set lazy capability accessors (reactor, agent) for trigger contexts. */
  setCapabilities<R extends DocumentRegistry = AnyRegistry>(caps: {
    getReactor?: () => Promise<ReactorContext<R> | undefined>;
    getAgent?: () => Promise<AgentProvider | undefined>;
  }): void;
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
 * Endpoint type classification for captured service endpoints.
 * Used by integrations (e.g. Mastra) to auto-discover service capabilities.
 */
export type EndpointType = 'other' | 'api-mcp' | 'api-rest' | 'api-graphql' | 'website';

/**
 * A capture definition with a group index and optional endpoint type.
 * When only an index is needed, a plain `number` can be used instead.
 */
export interface CaptureDefinition {
  group: number;
  type?: EndpointType;
}

/**
 * A named readiness pattern for multi-pattern readiness detection.
 * The service becomes ready when ALL patterns have matched.
 *
 * Captures map endpoint names to either a plain group index (`number`)
 * or a `CaptureDefinition` with an optional endpoint type.
 */
export interface ReadinessPattern {
  name: string;
  pattern: RegExp;
  captures?: Record<string, number | CaptureDefinition>;
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
  /** Captures for the single pattern. Maps endpoint name → group index or CaptureDefinition. */
  captures?: Record<string, number | CaptureDefinition>;
  /** Multiple named readiness patterns — service is ready when ALL have matched. */
  patterns?: ReadinessPattern[];
  /** Max time (ms) to wait for all patterns to match before marking failed. */
  timeout: number;
  /** Block until ready (default true). When false, mark ready immediately after spawn. */
  wait?: boolean;
}

// ── Project Scanner ──────────────────────────────────────────────

/**
 * Pluggable project detection for a service.
 * When attached to a ServiceDefinition, enables auto-discovery of projects
 * and generation of a `{id}-ls` command.
 */
export interface ProjectScanner {
  isProjectFolder(folderPath: string): boolean;
  getProjectName?(folderPath: string): string;
  getProjectConfig?(folderPath: string): Record<string, unknown>;
}

/**
 * Result of scanning for projects in a directory tree.
 */
export interface ProjectScanResult {
  name: string;
  path: string;
  config?: Record<string, unknown>;
}

// ── Preflight checks ─────────────────────────────────────────────

/**
 * Result of a preflight check.
 * Return `{ ok: true }` if the check passes.
 * Return `{ ok: false, message, hint? }` if it fails.
 */
export type PreflightResult =
  | { ok: true }
  | { ok: false; message: string; hint?: string };

/**
 * Context passed to a preflight check before spawning.
 */
export interface PreflightContext<TConfig = Record<string, unknown>> {
  /** Resolved working directory where the process will spawn. */
  cwd: string;
  /** CLI config. */
  config: TConfig;
  /** Start params (from paramsSchema). */
  params?: Record<string, unknown>;
  /** Resolved command string that would be spawned. */
  command: string;
}

/**
 * A preflight check receives the resolved start context and returns pass/fail.
 */
export type PreflightCheck<TConfig = Record<string, unknown>> =
  (ctx: PreflightContext<TConfig>) => PreflightResult | Promise<PreflightResult>;

/**
 * Definition for a long-running background service.
 * Services are spawned as detached processes that survive CLI exit.
 */
export interface ServiceDefinition<TConfig = Record<string, unknown>> {
  id: string;
  /** Display name for this service. Defaults to slugToTitle(id) when omitted. */
  name?: string;
  /** Human-readable description of the service. */
  description?: string;
  command: string | ((params?: Record<string, unknown>) => string);
  env?: (config: TConfig, params?: Record<string, unknown>) => Record<string, string>;
  /** Zod schema for typed start parameters (merged into start command flags). */
  paramsSchema?: import('zod').ZodType;
  /** Maximum concurrent instances (default 1). */
  maxInstances?: number;
  /**
   * Checks to run before spawning the process.
   * All checks run in order. First failure aborts the start.
   * Use for fast, cheap validations (file existence, port checks, version checks).
   */
  preflight?: PreflightCheck<TConfig>[];
  readiness?: ReadinessConfig;
  shutdown?: { signal: NodeJS.Signals; timeout: number };
  restart?: { enabled: boolean; maxRetries: number; delay: number };
  /** Project scanner for auto-discovery. Enables `{id}-ls` command and panel integration. */
  projectScanner?: ProjectScanner;
}

/**
 * Options for starting a service instance.
 */
export interface ServiceStartOptions {
  /** Working directory for instance identity (affects instance ID via hash). */
  workdir?: string;
  /** Spawn cwd — where the process actually runs. Defaults to process.cwd(). */
  cwd?: string;
  params?: Record<string, unknown>;
  name?: string;
}

/**
 * Runtime status of a service instance.
 */
export interface ServiceInstanceStatus {
  serviceId: string;
  instanceId: string;
  name: string;
  status: 'idle' | 'starting' | 'ready' | 'failed' | 'stopping' | 'stopped';
  pid?: number;
  endpoints?: Record<string, string>;
  endpointTypes?: Record<string, EndpointType>;
  error?: string;
  restartAttempt?: number;
  workdir?: string;
  params?: Record<string, unknown>;
}

/**
 * Runtime status of a service (legacy single-instance view).
 */
export interface ServiceStatus {
  id: string;
  name: string;
  status: 'idle' | 'starting' | 'ready' | 'failed' | 'stopping' | 'stopped';
  pid?: number;
  endpoints?: Record<string, string>;
  error?: string;
  restartAttempt?: number;
}

/**
 * Manager for long-running background services.
 */
export interface ServiceManager {
  start(id: string, opts?: ServiceStartOptions): Promise<string>;
  stop(id: string, instanceId?: string): Promise<void>;
  list(serviceId?: string): ServiceInstanceStatus[];
  /** Get the static definition for a service. */
  getDefinition(id: string): ServiceDefinition | undefined;
  logs(id: string, instanceId?: string, lines?: number): string;
  /** Watch a service's log file for new lines. Returns cleanup function. */
  watchLogs(id: string, instanceId: string, onLine: (line: string) => void): () => void;
  /** Scan for projects using the service's projectScanner. */
  scanProjects(id: string, rootDir: string): import('./project-scanner.js').ProjectScanResult[];
  /** Remove all stopped instance state files (and their log files) for a service. */
  purgeStoppedInstances(id: string): void;
}

// ── Event Bus ─────────────────────────────────────────────────────

/**
 * A central event bus for decoupled communication. Typed for framework
 * events via PhClintEvents<R>; arbitrary string events fall through to
 * the `unknown` payload overload.
 */
export interface EventBus<R extends DocumentRegistry = AnyRegistry> {
  emit: EmitFn<R>;
  on: OnFn<R>;
  off: OnFn<R>;
}

// ── Routine Config ────────────────────────────────────────────────

/**
 * Configuration for the routine loop.
 */
export interface RoutineConfig {
  /** Service identity — when set, auto-injects service commands for the routine. */
  id?: string;
  /** Display name for auto-injected service commands. Defaults to slugToTitle(id) when omitted. */
  name?: string;
  tickInterval?: number;
  idleInterval?: number;
  /** Project scanner for auto-discovery. Enables `{id}-ls` command when `id` is set. */
  projectScanner?: ProjectScanner;
}

// ── Resolvable ────────────────────────────────────────────────────

/**
 * A value that can be provided directly or resolved lazily from context.
 * Used for settings that may depend on runtime state (workdir, config).
 * TConfig is inferred from the CLI's configSchema when used inside defineCli().
 */
export type Resolvable<T, TConfig = Record<string, unknown>> = T | ((ctx: { workdir: string; config: TConfig }) => T);

// ── Agent Setup Context ───────────────────────────────────────────

/**
 * Context passed to agent factory callbacks.
 * Provides everything the factory needs to construct an agent.
 * TConfig is inferred from the CLI's configSchema.
 */
export interface AgentSetupContext<TConfig = Record<string, unknown>> {
  workdir: string;
  config: TConfig;
  cliName: string;
  cliVersion: string;
  context: CommandContext;
  commands: Command<any, any, any>[];
  /** Skill metadata from PromptsConfig, filtered by agent assignment if configured. */
  skills: import('./skills.js').SkillInfo[];
}

// ── Agent Loader ──────────────────────────────────────────────────

/**
 * A loader that dynamically imports and constructs the agent.
 * Receives the full AgentSetupContext (including auto-injected commands)
 * and should return a configured AgentProvider.
 */
export type AgentLoader<TConfig = Record<string, unknown>> =
  (ctx: AgentSetupContext<TConfig>) => Promise<AgentProvider>;

// ── Prompts ──────────────────────────────────────────────────────

/**
 * Agent profile definition for build-time instruction generation.
 */
export interface AgentProfileConfig {
  /** Export name prefix in generated TS (e.g. 'RupertDevAgent' → rupertDevAgentInstructions). */
  name: string;
  /** Template filenames within the profiles directory, concatenated in order. */
  sections: string[];
  /** Skill IDs assigned to this agent. */
  skills: string[];
}

/**
 * Configuration for an individual skill.
 */
export interface SkillConfig {
  description: string;
  /** Zod schema for additional input fields beyond the base `prompt` field. */
  inputSchema?: import('zod').ZodType;
  /** Handlebars instruction template. Receives { skillId, description, prompt, ...extraInputFields }. */
  instructionTemplate?: string;
}

/**
 * Configuration for agent prompts, profiles, and skills.
 */
export interface PromptsConfig {
  /** Candidate directories containing built skill folders. First existing wins. */
  sources: string[];
  /** Agent profiles: build-time instruction sections + runtime skill assignments. Key = agent ID. */
  agents?: Record<string, AgentProfileConfig>;
  /** Skill configs: description + optional inputSchema + instructionTemplate. Key = skill folder name.
   *  A plain string is accepted as shorthand for `{ description: string }`. */
  skills?: Record<string, string | SkillConfig>;
}

// ── CLI Metadata ──────────────────────────────────────────────

/**
 * Static, JSON-serializable metadata about a CLI instance.
 * Returned by `Cli.getMetadata()` for use in build-time template contexts.
 */
/** Field metadata for config/command/service parameters in CLI metadata output. */
export interface MetadataField {
  id: string;
  description: string | undefined;
  optional: boolean;
  default?: unknown;
  type: string;
  sensitive: boolean;
}

/** Config field metadata — includes env var name. */
export type ConfigMetadataField = MetadataField & { env: string };

export interface CliMetadata {
  name: string;
  version: string;
  description: string;
  hasInteractive: boolean;
  hasAgent: boolean;
  /** Whether a Powerhouse reactor integration is configured. */
  hasReactor: boolean;
  config: Record<string, ConfigMetadataField> | null;
  commands: Record<string, {
    id: string;
    description: string;
    params: Record<string, MetadataField>;
  }>;
  services: Record<string, {
    id: string;
    name: string;
    description?: string;
    maxInstances?: number;
    params: Record<string, MetadataField>;
    shutdown?: { signal: string; timeout: number };
    restart?: { enabled: boolean; maxRetries: number; delay: number };
    readinessTimeout?: number;
    /** MCP tool prefix(es) derived from readiness captures with type 'api-mcp'.
     *  undefined = no MCP, string = single MCP endpoint, Record = multiple (keyed by capture name). */
    mcpPrefix?: string | Record<string, string>;
  }> | null;
  prompts: {
    sources: string[];
    agents: Record<string, { name: string; sections: string[]; skills: string[] }>;
    skills: Record<string, string | SkillConfig>;
    resolved: Record<string, { id: string; description: string }>;
  } | null;
}

// ── CLI ───────────────────────────────────────────────────────────

/**
 * Options for defineCli().
 *
 * Generic over TSchema — inferred from `configSchema`. This propagates the
 * resolved config type into `Resolvable` callbacks, `AgentContext`, and
 * `InteractiveConfig`, so `ctx.config` is fully typed without casts.
 */
export interface CliOptions<
  TSchema extends z.ZodType = z.ZodType<Record<string, unknown>>,
  TSecrets extends z.ZodType = z.ZodType<Record<string, unknown>>,
> {
  name: string;
  version: string;
  description: Resolvable<string, z.infer<TSchema> & z.infer<TSecrets>>;
  commands: Command<any, any, any>[];
  configSchema?: TSchema;
  /** Schema for sensitive config values. Merged into configSchema internally; values are censored in output. */
  secretsSchema?: TSecrets;
  interactive?: InteractiveConfig<z.infer<TSchema> & z.infer<TSecrets>>;
  triggers?: Trigger<any, any, any>[];
  routine?: RoutineConfig;
  /** Service definitions for the ServiceManager. */
  services?: ServiceDefinition<z.infer<TSchema> & z.infer<TSecrets>>[];
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
  /**
   * Prompts configuration: agent profiles, skill descriptions, and skill sources.
   * When set, skills are available as CLI commands and auto-installed on first run.
   */
  prompts?: PromptsConfig;
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
  /** Override log verbosity. Default: 'info'. */
  logLevel?: LogLevel;
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
  /** True when a reactor configuration has been set. */
  hasReactor: boolean;
  /** Configure the agent factory — called lazily when the agent is first needed. */
  configureAgent(loader: AgentLoader<any>): void;
  /** Configure the reactor capability — lazy-loaded on first reactor() access. */
  configureReactor<R extends DocumentRegistry = AnyRegistry>(
    config: import('../integrations/powerhouse/types.js').ReactorConfiguration<R>,
  ): void;
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
  /** Return static, JSON-serializable metadata about this CLI. */
  getMetadata(): CliMetadata;
  run(argv: string[], options?: RunOptions): Promise<void>;
  stopRoutine?(): Promise<void>;
}
