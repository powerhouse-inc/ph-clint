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
   * CLI workspace root path (e.g. '.ph/cli/assist').
   * The Mastra workspace nests inside at `{workspacePath}/mastra/workspace/`
   * and the database at `{workspacePath}/mastra/db/mastra.db`.
   * When omitted, the agent runs without a workspace or persistent memory.
   */
  workspacePath?: string;
}
