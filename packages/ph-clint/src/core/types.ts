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
 * Provides access to workspace and resolved config.
 */
export interface CommandContext {
  workspace: Workspace;
  config: Record<string, unknown>;
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
  execute: (input: z.output<TInput>, context?: CommandContext) => Promise<TOutput>;
}

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
}

/**
 * Output handlers for run(). Defaults to process.exit/console.log/process.stderr.
 */
export interface RunOptions {
  exit?: (code: number) => void;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
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
}
