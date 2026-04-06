import type { Cli, CommandContext } from '../core/types.js';

/**
 * Output from processing a REPL input line.
 */
export interface ReplOutput {
  text: string;
  type: 'result' | 'error' | 'help' | 'exit' | 'empty';
}

/**
 * Options for creating a REPL session.
 */
export interface ReplSessionOptions {
  cli: Cli;
  context: CommandContext;
}

/**
 * A REPL session — processes input lines and returns output.
 * The session is the testable logic layer, independent of Ink rendering.
 */
export interface ReplSession {
  processInput(input: string): Promise<ReplOutput>;
  getCompletions(partial: string): string[];
  /** Get the argument signature for placeholder text, or null if not applicable. */
  getCommandSignature(input: string): string | null;
  welcome: string | undefined;
}

/**
 * A single entry in the REPL history.
 */
export interface HistoryEntry {
  id: number;
  input: string;
  output: string;
  type: ReplOutput['type'];
}
