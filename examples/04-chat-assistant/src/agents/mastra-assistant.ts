import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import type { AgentProvider, StreamChunk, Command } from 'ph-clint';
import { z } from 'zod';

/**
 * Create a Mastra-backed AgentProvider.
 *
 * This wraps a real Mastra Agent and maps its fullStream chunks
 * to ph-clint StreamChunk types.
 */
export function createMastraAssistant(options: {
  model?: string;
  commands?: Command[];
}): AgentProvider {
  const model = options.model ?? 'anthropic/claude-haiku-4-5';

  // Convert ph-clint commands to Mastra tools
  const mastraTools: Record<string, ReturnType<typeof createTool>> = {};
  for (const cmd of options.commands ?? []) {
    mastraTools[cmd.id] = createTool({
      id: cmd.id,
      description: cmd.description,
      inputSchema: cmd.inputSchema,
      execute: async (input) => {
        const result = await cmd.execute(input, {
          workspace: { async read<T>(_k: string, f: T) { return f; }, write: async () => {} },
          config: {},
        });
        return result;
      },
    });
  }

  const agent = new Agent({
    id: 'assistant',
    name: 'Research Assistant',
    instructions: 'You are a helpful research assistant. Use the available tools when the user asks you to search or summarize. Keep responses concise.',
    model,
    tools: mastraTools,
  });

  return {
    id: 'assistant',
    async *stream(prompt, opts) {
      const streamResult = await agent.stream(prompt, {
        maxSteps: 10,
      });

      for await (const chunk of streamResult.fullStream) {
        switch (chunk.type) {
          case 'text-delta':
            yield {
              type: 'text-delta',
              text: (chunk as any).payload?.text ?? (chunk as any).textDelta ?? '',
            } satisfies StreamChunk;
            break;

          case 'tool-call':
            yield {
              type: 'tool-call',
              toolName: (chunk as any).payload?.toolName ?? (chunk as any).toolName ?? '',
              args: (chunk as any).payload?.args ?? (chunk as any).args ?? {},
            } satisfies StreamChunk;
            break;

          case 'tool-result':
            yield {
              type: 'tool-result',
              toolName: (chunk as any).payload?.toolName ?? (chunk as any).toolName ?? '',
              result: (chunk as any).payload?.result ?? (chunk as any).result ?? null,
              isError: (chunk as any).payload?.isError ?? (chunk as any).isError ?? false,
            } satisfies StreamChunk;
            break;

          case 'error':
            yield {
              type: 'error',
              error: String((chunk as any).payload?.error ?? (chunk as any).error ?? chunk),
            } satisfies StreamChunk;
            break;

          // Ignore step-finish, start, finish, raw, etc.
          default:
            break;
        }
      }
    },
  };
}
