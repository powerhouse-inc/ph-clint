/**
 * Builds `src/agents/agent.ts` — a minimal Mastra agent factory.
 *
 * Emitted only when `features.mastra.enabled`. The generated agent falls back
 * to a deterministic echo-style demo provider when no API key is configured,
 * so `pnpm dev` works immediately out of the box.
 */
import { type ClintProjectSpec } from '../../spec/types.js';

export function buildAgentTs(spec: ClintProjectSpec): string {
  const id = spec.name;
  return [
    "import type { AgentProvider, AgentSetupContext, StreamChunk } from 'ph-clint';",
    "import type { Config } from '../framework.js';",
    '',
    '/**',
    ' * Demo agent — deterministic echo responses. Replace with a real Mastra',
    " * `Agent` once you've wired your model + tools.",
    ' */',
    'function createDemoAgent(): AgentProvider {',
    '  return {',
    `    id: '${id}',`,
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
