import type { AgentProvider, StreamChunk } from '@powerhousedao/ph-clint';

/**
 * A demo agent provider that simulates the GTM strategist without an API key.
 *
 * Echoes prompts with conversation tracking per thread, and guides users
 * through the GTM workflow.
 */
export function createDemoAgent(): AgentProvider {
  const conversations = new Map<string, string[]>();

  return {
    id: 'mara',
    async *stream(prompt, opts) {
      const threadId = opts?.threadId ?? 'default';
      if (!conversations.has(threadId)) {
        conversations.set(threadId, []);
      }
      const history = conversations.get(threadId)!;
      history.push(prompt);

      const lower = prompt.toLowerCase();

      // Guide users through the workflow
      if (lower.includes('help') || lower.includes('workflow') || lower.includes('how')) {
        yield {
          type: 'text-delta',
          text: 'The GTM workflow follows 6 skills in order:\n\n' +
                '1. `/01-research` — Discover audience, analyze product, map concerns\n' +
                '2. `/02-messaging` — Draft and iterate site messaging\n' +
                '3. `/03-design-system` — Define visual identity and components\n' +
                '4. `/04-site-prototype` — Build serveable HTML site\n' +
                '5. `/05-presentation` — Produce slide deck\n' +
                '6. `/06-visual-qa` — Screenshot and fix visual issues\n\n' +
                'Start with `/init-project --name <project>` to create a workspace.',
        } satisfies StreamChunk;
        return;
      }

      // Default: echo with context
      const turnCount = history.length;
      if (turnCount > 1) {
        yield {
          type: 'text-delta',
          text: `I understand you're continuing our conversation (turn ${turnCount}). `,
        } satisfies StreamChunk;
      }
      yield {
        type: 'text-delta',
        text: `You said: "${prompt}". I'm the Mara demo agent — set PH_MARA_API_KEY for real LLM responses.`,
      } satisfies StreamChunk;
    },
  };
}
