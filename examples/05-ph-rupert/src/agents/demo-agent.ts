import type { AgentProvider, StreamChunk } from 'ph-clint';

/**
 * A demo agent provider that simulates the rupert dev agent without an API key.
 *
 * Echoes prompts with conversation tracking per thread, and guides users
 * to /svc for service management.
 */
export function createDemoAgent(): AgentProvider {
  const conversations = new Map<string, string[]>();

  return {
    id: 'rupert',
    async *stream(prompt, opts) {
      // Track conversation history per thread
      const threadId = opts?.threadId ?? 'default';
      if (!conversations.has(threadId)) {
        conversations.set(threadId, []);
      }
      const history = conversations.get(threadId)!;
      history.push(prompt);

      const tools = opts?.tools;
      const lower = prompt.toLowerCase();

      // Handle service queries
      if ((lower.includes('service') || lower.includes('vetra') || lower.includes('start') || lower.includes('status')) && tools?.has('svc')) {
        yield {
          type: 'text-delta',
          text: 'To manage the Vetra service, use the `/svc` command:\n' +
                '- `/svc` — view status\n' +
                '- `/svc --action up` — start\n' +
                '- `/svc --action down` — stop\n' +
                '- `/svc --manage` — open management panel',
        } satisfies StreamChunk;
        return;
      }

      // Default: echo with context awareness
      const turnCount = history.length;
      if (turnCount > 1) {
        yield {
          type: 'text-delta',
          text: `I understand you're continuing our conversation (turn ${turnCount}). `,
        } satisfies StreamChunk;
      }
      yield {
        type: 'text-delta',
        text: `You said: "${prompt}". I'm the Rupert demo agent — set VETRA_MASTRA_API_KEY for real LLM responses.`,
      } satisfies StreamChunk;
    },
  };
}
