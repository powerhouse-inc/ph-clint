import type { AgentProvider } from '../../core/types.js';

/**
 * Options for getTools().
 */
export interface GetToolsOptions {
  /** Include MCP tools from running services with api-mcp endpoints. Default: true */
  includeMcp?: boolean;
}

/**
 * Helpers returned by createMastraHelpers().
 * All Mastra imports happen inside these functions (lazy loading).
 */
/**
 * Options for wrapAgent().
 */
export interface WrapAgentOptions {
  /** Maximum number of tool-call steps per stream() invocation. Default: 30 */
  maxSteps?: number;
}

export interface MastraHelpers {
  /** Convert CLI commands to Mastra createTool() format, optionally including MCP tools from running services. */
  getTools(options?: GetToolsOptions): Promise<Record<string, any>>;
  /** Create a Mastra Workspace rooted at ctx.workdir. */
  createWorkspace(): Promise<any>;
  /** Create Memory with LibSQL at .ph/{cliName}/mastra/mastra.db. */
  createMemory(): Promise<any>;
  /** Wrap a Mastra Agent as an AgentProvider (handles stream mapping). */
  wrapAgent(agent: any, options?: WrapAgentOptions): AgentProvider;
}
