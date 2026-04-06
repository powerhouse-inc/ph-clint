import type { AgentProvider, StreamChunk } from 'ph-clint';

/**
 * A test/demo agent provider that echoes prompts and simulates tool usage.
 *
 * In a real project, this would be replaced with a Mastra agent via
 * createMastraAssistant(). This stub allows the example to work
 * without an API key or LLM dependency.
 */
export function createAssistant(): AgentProvider {
  const conversations = new Map<string, string[]>();

  return {
    id: 'assistant',
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

      // Check if the prompt mentions converting an image to ASCII
      if ((lower.includes('ascii') || lower.includes('image') || lower.includes('convert')) && tools?.has('ascii')) {
        const urlMatch = prompt.match(/https?:\/\/\S+/);
        const image = urlMatch ? urlMatch[0] : 'https://picsum.photos/200/200';

        yield { type: 'tool-call', toolName: 'ascii', args: { image, width: 40, height: 20, fit: 'box' } } satisfies StreamChunk;

        const asciiCmd = tools.get('ascii')!;
        try {
          const result = await asciiCmd.execute({ image, width: 40, height: 20, fit: 'box' }, {
            workspace: { async read<T>(_k: string, f: T) { return f; }, write: async () => {} },
            config: {},
          });
          const resultText = typeof result === 'object' && result !== null && 'text' in result
            ? (result as Record<string, unknown>).text as string
            : String(result);

          yield { type: 'tool-result', toolName: 'ascii', result: resultText, isError: false } satisfies StreamChunk;
          yield { type: 'text-delta', text: `\nHere's the ASCII art:\n${resultText}` } satisfies StreamChunk;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          yield { type: 'tool-result', toolName: 'ascii', result: msg, isError: true } satisfies StreamChunk;
          yield { type: 'text-delta', text: `\nFailed to convert image: ${msg}` } satisfies StreamChunk;
        }
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
        text: `You said: "${prompt}". I'm a demo assistant — connect a real LLM for actual responses.`,
      } satisfies StreamChunk;
    },
  };
}
