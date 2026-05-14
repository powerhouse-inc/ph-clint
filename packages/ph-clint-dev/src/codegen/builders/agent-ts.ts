/**
 * Builds `src/agents/agent.ts` — a Mastra agent factory.
 *
 * Emitted only when `features.mastra.enabled`. When the spec includes a main
 * agent with a real model, generates a Mastra supervisor `Agent` plus one
 * `new Agent({})` per sub-agent. Sub-agents are passed in as `agents: { … }`
 * on the main agent so Mastra exposes them to the model as tools named
 * `agent-<key>`. Otherwise falls back to a deterministic echo demo provider.
 */
import {
  type ClintProjectSpec,
  type MainAgent,
  type SubAgent,
  getAgent,
  getAgentProfiles,
} from '../../spec/types.js';
import { DEMO_PROVIDER } from './provider-utils.js';

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

/** camelCase a kebab-case identifier — used to derive JS variable names from agent ids. */
function camelCase(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** TS string literal for an agent's tool-pattern include list. Returns null if no `include` should be emitted. */
function toolPatternsExpr(agent: MainAgent | SubAgent, isMain: boolean): string | null {
  if (agent.toolPatterns.length === 0) {
    return isMain ? null : '[]';
  }
  return JSON.stringify(agent.toolPatterns);
}

function buildDemoAgent(spec: ClintProjectSpec): string {
  const main = spec.features.mastra.mainAgent;
  const id = main?.id ?? spec.name;
  const name = main?.name ?? id;
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
  const main = spec.features.mastra.mainAgent!;
  const subs = spec.features.mastra.subAgents;

  // The main agent's runtime-overridable provider drives `ctx.config.model` and
  // `ctx.config.<provider>ApiKey` (kept generic with the existing field name).
  const [mainProvider] = main.modelId.split(/[:/]/);
  const { pkg, fn } = providerImport(mainProvider);
  const mainApiKeyField = `${mainProvider}ApiKey`;
  void pkg;
  void fn;

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
  lines.push(' * Builds one Mastra Agent per sub-agent, then a main Agent that exposes them');
  lines.push(' * via the `agents: { … }` field (Mastra surfaces each as a tool named');
  lines.push(' * `agent-<key>`). Returns a demo agent when no API key is configured.');
  lines.push(' */');
  lines.push('export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {');
  lines.push(`  if (!ctx.config.${mainApiKeyField}) return createDemoAgent();`);
  lines.push('');
  lines.push('  const m = createMastraHelpers(ctx);');
  lines.push('  const memory = await m.createMemory();');
  lines.push('');

  // Emit each sub-agent
  for (const sub of subs) {
    const varName = camelCase(sub.id);
    const includeExpr = toolPatternsExpr(sub, false)!; // sub: always emits include (empty array = no tools)
    lines.push(`  const ${varName} = new Agent({`);
    lines.push(`    id: '${sub.id}',`);
    lines.push(`    name: ${JSON.stringify(sub.name)},`);
    lines.push(`    description: ${JSON.stringify(sub.description)},`);
    lines.push(`    instructions: m.getAgentInstructions('${sub.id}'),`);
    lines.push(`    model: ${JSON.stringify(sub.modelId)},`);
    lines.push('    tools: async () => {');
    lines.push(`      ctx.context.log?.debug(\`[agent ${sub.id}] resolving tools\`);`);
    lines.push(`      return m.getTools({ MCPClient, include: ${includeExpr} });`);
    lines.push('    },');
    lines.push('    memory,');
    lines.push('  });');
    lines.push('');
  }

  const mainInclude = toolPatternsExpr(main, true);
  const agentsField = subs.length > 0
    ? `    agents: { ${subs.map((s) => camelCase(s.id)).join(', ')} },`
    : '';

  lines.push(`  const main = new Agent({`);
  lines.push(`    id: '${main.id}',`);
  lines.push(`    name: ${JSON.stringify(main.name)},`);
  lines.push(`    instructions: m.getAgentInstructions('${main.id}'),`);
  lines.push(`    model: ctx.config.${mainApiKeyField}`);
  lines.push(`      ? { id: ctx.config.model as \`\${string}/\${string}\`, apiKey: ctx.config.${mainApiKeyField} }`);
  lines.push(`      : (ctx.config.model as \`\${string}/\${string}\`),`);
  lines.push('    tools: async () => {');
  lines.push("      ctx.context.log?.debug('[agent main] resolving tools');");
  if (mainInclude === null) {
    lines.push('      return m.getTools({ MCPClient });');
  } else {
    lines.push(`      return m.getTools({ MCPClient, include: ${mainInclude} });`);
  }
  lines.push('    },');
  lines.push('    workspace: await m.createWorkspace(),');
  lines.push('    memory,');
  if (agentsField) lines.push(agentsField);
  lines.push('  });');
  lines.push('');
  lines.push('  const store = createWorkdirStore(ctx.workdir, CLI_NAME);');
  lines.push('  const wrapOpts: WrapAgentOptions = {');
  lines.push('    maxSteps: 80,');
  lines.push('    enableLogging: ctx.config.agentLogging,');
  lines.push("    logDirectory: store.getStoreFolder('logs'),");
  lines.push('    cacheControl: true,');
  if (main.description) {
    lines.push(`    description: ${JSON.stringify(main.description)},`);
  }
  if (main.image) {
    lines.push(`    image: ${JSON.stringify(main.image)},`);
  }
  lines.push('  };');
  lines.push('  return m.wrapAgent(main, wrapOpts);');
  lines.push('}');
  lines.push('');

  // `getAgent` / `getAgentProfiles` aren't used at codegen time here but importing them
  // here keeps the IDE jump-to-definition responsive for downstream debugging.
  void getAgent;
  void getAgentProfiles;

  return lines.join('\n');
}

export function buildAgentTs(spec: ClintProjectSpec): string {
  const mastra = spec.features.mastra;
  if (!mastra.enabled || !mastra.mainAgent) return buildDemoAgent(spec);
  const realModels = mastra.models.filter(
    (m) => m.id.split(/[:/]/)[0] !== DEMO_PROVIDER,
  );
  if (realModels.length === 0) return buildDemoAgent(spec);
  return buildRealAgent(spec);
}
