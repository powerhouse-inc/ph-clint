import type { AgentProvider, AgentSetupContext, StreamChunk } from 'ph-clint';
import type { Config } from '../config.js';

export const AGENT_ID = 'clint';

const instructions = `You are Clint — a ph-clint assistant that helps users scaffold, configure, and maintain ph-clint implementation projects.

## Behavior
- Be concise and practical.
- When the user asks about a project, inspect the ClintProjectSpecification document via the Powerhouse Reactor when available.
- Prefer small, incremental changes to the project's spec document over direct file edits.`;

/**
 * Agent factory for the ph-clint CLI.
 *
 * Demo mode echoes prompts; with an API key set via PH_CLINT_API_KEY, builds
 * a full Mastra agent. The Powerhouse integration is still in scope but the
 * agent does not yet write to any document model (document models land in
 * Phase 4).
 */
export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) return createDemoAgent();

  const { createMastraHelpers } = await import('ph-clint/mastra');
  const { Agent } = await import('@mastra/core/agent');
  const m = createMastraHelpers(ctx);

  const mastraAgent = new Agent({
    id: AGENT_ID,
    name: 'Clint',
    instructions,
    model: { id: ctx.config.model as `${string}/${string}`, apiKey: ctx.config.apiKey },
    tools: await m.getTools(),
    memory: await m.createMemory(),
  });

  return m.wrapAgent(mastraAgent, { maxSteps: 40 });
}

function createDemoAgent(): AgentProvider {
  return {
    id: AGENT_ID,
    async *stream(prompt: string): AsyncGenerator<StreamChunk> {
      yield {
        type: 'text-delta',
        text: `[Clint demo mode — set PH_CLINT_API_KEY for real LLM responses]\n\nYou said: "${prompt}"\n`,
      };
    },
  };
}
