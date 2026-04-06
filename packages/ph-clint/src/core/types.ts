import type { z } from 'zod';

/**
 * A workspace provides file-based persistence for CLI state.
 * Backed by `.ph/cli/{cli-name}/` on disk, or in-memory for testing.
 */
export interface Workspace {
  read<T>(key: string, fallback: T): Promise<T>;
  write(key: string, value: unknown): Promise<void>;
}

/**
 * Context passed to command execute functions.
 * Provides access to workspace, resolved config, and optional runtime services.
 */
export interface CommandContext {
  workspace: Workspace;
  config: Record<string, unknown>;
  routine?: Routine;
  processes?: ProcessManager;
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
 */
export interface InteractiveConfig {
  welcome: string;
}

/**
 * A command definition — the atomic unit of ph-clint.
 * Compatible with Mastra createTool() shape.
 */
export interface Command<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
> {
  id: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: z.ZodType<TOutput>;
  prompt?: PromptConfig;
  execute: (input: z.output<TInput>, context: CommandContext) => Promise<TOutput>;
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

// ── CLI ───────────────────────────────────────────────────────────

/**
 * Options for defineCli().
 */
export interface CliOptions {
  name: string;
  version: string;
  description: string;
  commands: Command[];
  configSchema?: z.ZodType;
  interactive?: InteractiveConfig;
  triggers?: Trigger[];
  routine?: RoutineConfig;
  integrations?: Integration[];
  /** Route bare text to an agent. Format: 'agent:<agent-id>' */
  defaultCommand?: string;
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
  /** Signal to stop --wait mode. In production, connected to SIGINT/SIGTERM. */
  signal?: AbortSignal;
  /** Resume a previous agent conversation by thread ID. */
  resume?: string;
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
  interactive?: InteractiveConfig;
  defaultCommand?: string;
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
