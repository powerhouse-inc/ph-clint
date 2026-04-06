import { createMemoryWorkspace } from 'ph-clint';
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
      const dummyCtx = { workspace: createMemoryWorkspace(), config: {} };

      // Handle list-images
      if ((lower.includes('list') || lower.includes('saved') || lower.includes('my images')) && tools?.has('list-images')) {
        yield { type: 'tool-call', toolName: 'list-images', args: {} } satisfies StreamChunk;
        try {
          const result = await tools.get('list-images')!.execute({}, dummyCtx);
          const text = typeof result === 'object' && result !== null && 'text' in result
            ? (result as Record<string, unknown>).text as string
            : String(result);
          yield { type: 'tool-result', toolName: 'list-images', result: text, isError: false } satisfies StreamChunk;
          yield { type: 'text-delta', text: `\n${text}` } satisfies StreamChunk;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          yield { type: 'tool-result', toolName: 'list-images', result: msg, isError: true } satisfies StreamChunk;
        }
        return;
      }

      // Handle save-image
      if ((lower.includes('save') || lower.includes('download')) && tools?.has('save-image')) {
        const urlMatch = prompt.match(/https?:\/\/\S+/);
        if (urlMatch) {
          const url = urlMatch[0];
          yield { type: 'tool-call', toolName: 'save-image', args: { url } } satisfies StreamChunk;
          try {
            const result = await tools.get('save-image')!.execute({ url }, dummyCtx);
            const text = typeof result === 'object' && result !== null && 'text' in result
              ? (result as Record<string, unknown>).text as string
              : String(result);
            yield { type: 'tool-result', toolName: 'save-image', result: text, isError: false } satisfies StreamChunk;
            yield { type: 'text-delta', text: `\n${text}` } satisfies StreamChunk;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            yield { type: 'tool-result', toolName: 'save-image', result: msg, isError: true } satisfies StreamChunk;
          }
          return;
        }
      }

      // Handle ascii conversion
      if ((lower.includes('ascii') || lower.includes('image') || lower.includes('convert')) && tools?.has('ascii')) {
        const urlMatch = prompt.match(/https?:\/\/\S+/);
        const image = urlMatch ? urlMatch[0] : 'https://picsum.photos/200/200';

        yield { type: 'tool-call', toolName: 'ascii', args: { image, width: 40, height: 20, fit: 'box' } } satisfies StreamChunk;

        try {
          const result = await tools.get('ascii')!.execute({ image, width: 40, height: 20, fit: 'box' }, dummyCtx);
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
