/**
 * Builds `src/agents/agent.ts` — a Mastra agent factory.
 *
 * Emitted only when `features.mastra.enabled`. When the spec includes agent
 * config (agentId, models, profiles), generates a real `@mastra/core` Agent.
 * Otherwise falls back to a deterministic echo-style demo provider.
 */
import { type ClintProjectSpec } from '../../spec/types.js';

/** Map provider prefix to AI SDK package. */
function providerImport(provider: string): { pkg: string; fn: string } {
  switch (provider) {
    case 'anthropic':
      return { pkg: '@ai-sdk/anthropic', fn: 'anthropic' };
    case 'openai':
      return { pkg: '@ai-sdk/openai', fn: 'openai' };
    case 'google':
      return { pkg: '@ai-sdk/google', fn: 'google' };
    default:
      return { pkg: `@ai-sdk/${provider}`, fn: provider };
  }
}

function buildDemoAgent(spec: ClintProjectSpec): string {
  const mastra = spec.features.mastra;
  const id = mastra.agentId ?? spec.name;
  const name = mastra.agentName ?? id;
  return [
    "import type { AgentProvider, AgentSetupContext, StreamChunk } from '@powerhousedao/ph-clint';",
    "import type { Config } from '../framework.js';",
    '',
    '/**',
    ' * Demo agent — deterministic echo responses. Replace with a real Mastra',
    " * `Agent` once you've wired your model + tools.",
    ' */',
    'function createDemoAgent(): AgentProvider {',
    '  return {',
    `    id: '${id}',`,
    `    name: '${name}',`,
    '    async *stream(prompt) {',
    '      yield {',
    "        type: 'text-delta',",
    "        text: `You said: ${prompt}\\n(demo mode — set an API key and replace createDemoAgent with a Mastra Agent)`,",
    '      } satisfies StreamChunk;',
    '    },',
    '  };',
    '}',
    '',
    '/**',
    ' * Agent factory invoked by `cli.configureAgent`. Receives the resolved',
    ' * config and workdir; return an AgentProvider.',
    ' */',
    'export async function createAgent(',
    '  _ctx: AgentSetupContext<Config>,',
    '): Promise<AgentProvider> {',
    '  return createDemoAgent();',
    '}',
    '',
  ].join('\n');
}

function buildRealAgent(spec: ClintProjectSpec): string {
  const mastra = spec.features.mastra;
  const agentId = mastra.agentId!;
  const agentName = mastra.agentName!;
  const defaultModel = mastra.models.find(m => m.isDefault) ?? mastra.models[0];
  const modelId = defaultModel?.id ?? 'anthropic/claude-sonnet-4-5';
  const [provider] = modelId.split(/[:/]/);
  const { pkg, fn } = providerImport(provider);
  const apiKeyField = `${provider}ApiKey`;

  const lines: string[] = [];
  lines.push("import { Agent } from '@mastra/core/agent';");
  lines.push("import { MCPClient } from '@mastra/mcp';");
  lines.push("import { createMastraHelpers } from '@powerhousedao/ph-clint/mastra';");
  lines.push("import { createWorkdirStore } from '@powerhousedao/ph-clint';");
  lines.push("import type { AgentSetupContext, AgentProvider } from '@powerhousedao/ph-clint';");
  lines.push("import type { WrapAgentOptions } from '@powerhousedao/ph-clint/mastra';");
  lines.push("import { CLI_NAME } from '../config.js';");
  lines.push("import type { Config } from '../framework.js';");
  lines.push("import { createDemoAgent } from './demo-agent.js';");
  lines.push('');
  lines.push('/**');
  lines.push(' * Agent factory for the CLI.');
  lines.push(' *');
  lines.push(' * Returns a demo agent when no API key is configured, or wraps the full');
  lines.push(' * agent as a ph-clint AgentProvider.');
  lines.push(' */');
  lines.push('export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {');
  lines.push(`  if (!ctx.config.${apiKeyField}) return createDemoAgent();`);
  lines.push('');
  lines.push('  const m = createMastraHelpers(ctx);');
  lines.push('');
  lines.push('  const agent = new Agent({');
  lines.push(`    id: '${agentId}',`);
  lines.push(`    name: '${agentName}',`);
  lines.push(`    instructions: m.getAgentInstructions('${agentId}'),`);
  lines.push(`    model: ctx.config.${apiKeyField}`);
  lines.push(`      ? { id: ctx.config.model as \`\${string}/\${string}\`, apiKey: ctx.config.${apiKeyField} }`);
  lines.push(`      : (ctx.config.model as \`\${string}/\${string}\`),`);
  lines.push('    tools: async () => {');
  lines.push("      ctx.context.log?.debug('[agent] tools callback invoked');");
  lines.push('      const tools = await m.getTools({ MCPClient });');
  lines.push("      ctx.context.log?.debug(`[agent] tools resolved: ${Object.keys(tools).length} tools`);");
  lines.push('      return tools;');
  lines.push('    },');
  lines.push('    workspace: await m.createWorkspace(),');
  lines.push('    memory: await m.createMemory(),');
  lines.push('  });');
  lines.push('');
  lines.push('  const store = createWorkdirStore(ctx.workdir, CLI_NAME);');
  lines.push('  const wrapOpts: WrapAgentOptions = {');
  lines.push('    maxSteps: 80,');
  lines.push('    enableLogging: ctx.config.agentLogging,');
  lines.push("    logDirectory: store.getStoreFolder('logs'),");
  lines.push('    cacheControl: true,');
  if (mastra.agentDescription) {
    lines.push(`    description: ${JSON.stringify(mastra.agentDescription)},`);
  }
  if (mastra.agentImage) {
    lines.push(`    image: ${JSON.stringify(mastra.agentImage)},`);
  }
  lines.push('  };');
  lines.push('  return m.wrapAgent(agent, wrapOpts);');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

export function buildAgentTs(spec: ClintProjectSpec): string {
  const mastra = spec.features.mastra;
  // Generate real agent when we have full config, demo otherwise
  if (mastra.agentId && mastra.models.length > 0) {
    return buildRealAgent(spec);
  }
  return buildDemoAgent(spec);
}
