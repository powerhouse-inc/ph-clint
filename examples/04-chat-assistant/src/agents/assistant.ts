import type { AgentProvider, StreamChunk } from 'ph-clint';

/**
 * A test/demo agent provider that echoes prompts and simulates tool usage.
 *
 * In a real project, this would be replaced with a Mastra agent via
 * defineMastraIntegration(). This stub allows the example to work
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

      // Check if the prompt mentions searching
      const tools = opts?.tools;
      if (prompt.toLowerCase().includes('search') && tools?.has('search')) {
        const query = prompt.replace(/.*search\s*(for\s*)?/i, '').trim() || prompt;

        yield { type: 'tool-call', toolName: 'search', args: { query, limit: 3 } } satisfies StreamChunk;

        // Actually execute the tool if available
        const searchCmd = tools.get('search')!;
        const result = await searchCmd.execute({ query, limit: 3 }, {
          workspace: { async read<T>(_k: string, f: T) { return f; }, write: async () => {} },
          config: {},
        });
        const resultText = typeof result === 'object' && result !== null && 'text' in result
          ? (result as Record<string, unknown>).text as string
          : String(result);

        yield { type: 'tool-result', toolName: 'search', result: resultText, isError: false } satisfies StreamChunk;
        yield { type: 'text-delta', text: `\nBased on the search results:\n${resultText}` } satisfies StreamChunk;
        return;
      }

      // Check if the prompt mentions summarizing
      if (prompt.toLowerCase().includes('summarize') && tools?.has('summarize')) {
        const urlMatch = prompt.match(/https?:\/\/\S+/);
        const url = urlMatch ? urlMatch[0] : 'https://example.com';

        yield { type: 'tool-call', toolName: 'summarize', args: { url } } satisfies StreamChunk;

        const summarizeCmd = tools.get('summarize')!;
        const result = await summarizeCmd.execute({ url }, {
          workspace: { async read<T>(_k: string, f: T) { return f; }, write: async () => {} },
          config: {},
        });
        const resultText = typeof result === 'object' && result !== null && 'text' in result
          ? (result as Record<string, unknown>).text as string
          : String(result);

        yield { type: 'tool-result', toolName: 'summarize', result: resultText, isError: false } satisfies StreamChunk;
        yield { type: 'text-delta', text: `\n${resultText}` } satisfies StreamChunk;
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
