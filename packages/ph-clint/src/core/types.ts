import type { z } from 'zod';

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
  execute: (input: z.output<TInput>) => Promise<TOutput>;
}

/**
 * Options for defineCli().
 */
export interface CliOptions {
  name: string;
  version: string;
  description: string;
  commands: Command[];
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
 * A CLI instance returned by defineCli().
 */
export interface Cli {
  name: string;
  version: string;
  description: string;
  getCommand(id: string): Command | undefined;
  listCommands(): Command[];
  execute(commandId: string, args: Record<string, unknown>): Promise<unknown>;
  parseArgs(commandId: string, argv: string[]): Record<string, unknown>;
  generateHelp(): string;
  generateCommandHelp(commandId: string): string;
  generateCompletion(shell: string): string;
  run(argv: string[], options?: RunOptions): Promise<void>;
}
