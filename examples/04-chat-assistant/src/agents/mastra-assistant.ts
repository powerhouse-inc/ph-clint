import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { createTool } from '@mastra/core/tools';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { AgentProvider, StreamChunk, Command } from 'ph-clint';
import { z } from 'zod';

/**
 * Create a Mastra-backed AgentProvider with persistent conversation memory.
 *
 * This wraps a real Mastra Agent and maps its fullStream chunks
 * to ph-clint StreamChunk types. Memory is stored in a LibSQL database
 * at the specified path (defaults to .ph/cli/assist/mastra/mastra.db).
 */
export function createMastraAssistant(options: {
  model?: string;
  commands?: Command[];
  dbPath?: string;
}): AgentProvider {
  const model = options.model ?? 'anthropic/claude-haiku-4-5';
  const dbPath = options.dbPath ?? '.ph/cli/assist/mastra/mastra.db';

  // Ensure the database directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  // Persistent storage for conversation memory
  const store = new LibSQLStore({ id: 'assist-storage', url: `file:${dbPath}` });
  const memory = new Memory({ storage: store });

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
    name: 'Image Assistant',
    instructions: `You are a helpful assistant with access to an image-to-ASCII art converter.

When the user asks you to convert an image, show an image, or provides an image URL, use the ascii tool.
You can suggest interesting images to convert if the user doesn't provide one.

Keep responses concise. After showing ASCII art, briefly describe what you see.`,
    model,
    tools: mastraTools,
    memory,
  });

  return {
    id: 'assistant',
    async *stream(prompt, opts) {
      const streamOpts: Record<string, unknown> = {
        maxSteps: 10,
      };

      // Pass memory options for thread-based conversation persistence
      if (opts?.threadId) {
        streamOpts.memory = {
          thread: opts.threadId,
          resource: 'cli-user',
        };
      }

      const streamResult = await agent.stream(prompt, streamOpts);

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
