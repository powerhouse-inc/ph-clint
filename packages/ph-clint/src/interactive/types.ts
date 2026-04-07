import type { AgentProvider, Cli, CommandContext } from '../core/types.js';

/**
 * Output from processing a REPL input line.
 */
export interface ReplOutput {
  text: string;
  type: 'result' | 'error' | 'help' | 'exit' | 'empty' | 'prompt';
  /** When type is 'prompt', the label to show instead of '> ' (e.g. "priority"). */
  promptLabel?: string;
}

/**
 * Options for creating a REPL session.
 */
export interface ReplSessionOptions {
  cli: Cli;
  context: CommandContext;
  /** Agent provider for default command routing. Resolved by defineCli from integrations. */
  agentProvider?: AgentProvider;
  /** Thread ID for conversation memory (from --resume flag). */
  threadId?: string;
}

/**
 * A REPL session — processes input lines and returns output.
 * The session is the testable logic layer, independent of Ink rendering.
 */
export interface ReplSession {
  processInput(input: string): Promise<ReplOutput>;
  getCompletions(partial: string): string[];
  /** Get inline ghost suggestion (full input with first completion applied), or null. */
  getGhostSuggestion(input: string): string | null;
  /** Get suffix to append after applying a completion (e.g. ` "` for string flags). */
  getCompletionSuffix(completion: string, input: string): string;
  /** True when the session is waiting for a prompt answer. */
  readonly isPrompting: boolean;
  welcome: string | undefined;
  /** The exit message (includes resume hint when a threadId is set). */
  readonly exitMessage: string;
  /** Callback invoked for each formatted chunk during agent streaming. */
  onStreamChunk?: (text: string) => void;
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
