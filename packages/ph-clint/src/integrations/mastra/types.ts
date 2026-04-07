import type { Command } from '../../core/types.js';

/**
 * Configuration for a single Mastra-backed agent.
 */
export interface MastraAgentConfig {
  /** Unique agent identifier. Used in `agent:{id}` default command routing. */
  id: string;
  /** Display name for the agent. */
  name?: string;
  /** System instructions for the agent. */
  instructions: string;
  /** Model identifier (e.g. 'anthropic/claude-haiku-4-5'). */
  model?: string;
}

/**
 * Options for defineMastraIntegration().
 */
export interface MastraIntegrationOptions {
  /** Agent configurations to create. */
  agents: MastraAgentConfig[];
  /** ph-clint commands to expose as Mastra tools (agent can call them). */
  commands?: Command[];
  /**
   * Resolved workspace directory (absolute path).
   * Passed to Mastra as the LocalFilesystem root — agents operate on the
   * same files as the user.
   * The Mastra database lives at {workdir}/.ph/{cliName}/mastra/mastra.db.
   * When omitted, the agent runs without a workspace or persistent memory.
   */
  workdir?: string;
  /** CLI name, used to namespace the Mastra database under .ph/{cliName}/. */
  cliName?: string;
  /**
   * @deprecated Use workdir + cliName instead.
   * Legacy workspace path (e.g. '.ph/cli/assist').
   */
  workspacePath?: string;
}
