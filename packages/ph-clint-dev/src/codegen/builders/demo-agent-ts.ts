/**
 * Builds `src/agents/demo-agent.ts` — a deterministic echo agent fallback.
 *
 * Generated when `features.mastra.enabled` with full agent config so the real
 * agent factory can fall back to demo mode when no API key is configured.
 */
import { type ClintProjectSpec } from '../../spec/types.js';
import { DEMO_PROVIDER } from './provider-utils.js';

export function buildDemoAgentTs(spec: ClintProjectSpec): string | null {
  const { mastra } = spec.features;
  const realModels = mastra.models.filter(
    (m) => m.id.split(/[:/]/)[0] !== DEMO_PROVIDER,
  );
  if (!mastra.enabled || !mastra.mainAgent || realModels.length === 0) return null;

  const main = mastra.mainAgent;
  return [
    "import type { AgentProvider, StreamChunk } from '@powerhousedao/ph-clint';",
    '',
    '/**',
    ' * Demo agent — deterministic echo responses without an API key.',
    ' *',
    ' * Echoes user prompts with conversation tracking per thread.',
    ' */',
    'export function createDemoAgent(): AgentProvider {',
    '  const conversations = new Map<string, string[]>();',
    '',
    '  return {',
    `    id: '${main.id}',`,
    `    name: '${main.name}',`,
    ...(main.description ? [`    description: ${JSON.stringify(main.description)},`] : []),
    ...(main.image ? [`    image: ${JSON.stringify(main.image)},`] : []),
    '    async *stream(prompt, opts) {',
    '      const text = typeof prompt === \'string\'',
    '        ? prompt',
    '        : prompt.filter(p => p.type === \'text\').map(p => p.text).join(\'\\n\');',
    "      const threadId = opts?.threadId ?? 'default';",
    '      if (!conversations.has(threadId)) {',
    '        conversations.set(threadId, []);',
    '      }',
    '      const history = conversations.get(threadId)!;',
    '      history.push(text);',
    '',
    '      const turnCount = history.length;',
    '      if (turnCount > 1) {',
    '        yield {',
    "          type: 'text-delta',",
    '          text: `I understand you\'re continuing our conversation (turn ${turnCount}). `,',
    '        } satisfies StreamChunk;',
    '      }',
    '      yield {',
    "        type: 'text-delta',",
    '        text: `You said: "${text}". I\'m the demo agent — set an API key for real LLM responses.`,',
    '      } satisfies StreamChunk;',
    '    },',
    '  };',
    '}',
    '',
  ].join('\n');
}
