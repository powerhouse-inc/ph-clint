import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { createMastraHelpers } from '@powerhousedao/ph-clint/mastra';
import { createWorkdirStore } from '@powerhousedao/ph-clint';
import type { AgentSetupContext, AgentProvider } from '@powerhousedao/ph-clint';
import type { WrapAgentOptions } from '@powerhousedao/ph-clint/mastra';
import { CLI_NAME } from '../config.js';
import type { Config } from '../framework.js';
import { createDemoAgent } from './demo-agent.js';

/**
 * Agent factory for the ph-clint CLI.
 *
 * Returns a demo agent when no API key is configured, or wraps the full
 * Rupert agent as a ph-clint AgentProvider.
 */
export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) return createDemoAgent();

  const m = createMastraHelpers(ctx);

  const agent = new Agent({
    id: 'rupert-dev-agent',
    name: 'Rupert Dev Agent',
    instructions: m.getAgentInstructions('rupert-dev-agent'),
    model: ctx.config.apiKey
      ? { id: ctx.config.model as `${string}/${string}`, apiKey: ctx.config.apiKey }
      : (ctx.config.model as `${string}/${string}`),
    tools: async () => {
      ctx.context.log?.debug('[agent-rupert] tools callback invoked');
      const tools = await m.getTools({ MCPClient });
      ctx.context.log?.debug(`[agent-rupert] tools resolved: ${Object.keys(tools).length} tools`);
      return tools;
    },
    workspace: await m.createWorkspace(),
    memory: await m.createMemory(),
  });

  const store = createWorkdirStore(ctx.workdir, CLI_NAME);
  const wrapOpts: WrapAgentOptions = {
    maxSteps: 80,
    enableLogging: ctx.config.agentLogging,
    logDirectory: store.getStoreFolder('logs'),
    cacheControl: true,
  };
  return m.wrapAgent(agent, wrapOpts);
}
