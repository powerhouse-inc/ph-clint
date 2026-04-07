import type { AgentProvider } from '../../core/types.js';

/**
 * Helpers returned by createMastraHelpers().
 * All Mastra imports happen inside these functions (lazy loading).
 */
export interface MastraHelpers {
  /** Convert CLI commands to Mastra createTool() format. */
  getTools(): Promise<Record<string, any>>;
  /** Create a Mastra Workspace rooted at ctx.workdir. */
  createWorkspace(): Promise<any>;
  /** Create Memory with LibSQL at .ph/{cliName}/mastra/mastra.db. */
  createMemory(): Promise<any>;
  /** Wrap a Mastra Agent as an AgentProvider (handles stream mapping). */
  wrapAgent(agent: any): AgentProvider;
}
