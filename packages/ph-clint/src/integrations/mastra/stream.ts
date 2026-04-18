import type { StreamChunk } from '../../core/types.js';

/**
 * Map a Mastra Agent fullStream to ph-clint StreamChunks.
 *
 * Handles both the direct property format (chunk.textDelta, chunk.toolName)
 * and the payload-wrapped format (chunk.payload.text) that Mastra uses
 * when Memory is attached to the agent.
 */
export async function* mapMastraStream(
  fullStream: AsyncIterable<{ type: string; [key: string]: unknown }>,
): AsyncGenerator<StreamChunk> {
  for await (const chunk of fullStream) {
    switch (chunk.type) {
      case 'text-delta':
        yield {
          type: 'text-delta',
          text: payloadOr(chunk, 'text') ?? (chunk as any).textDelta ?? '',
        };
        break;

      case 'tool-call':
        yield {
          type: 'tool-call',
          toolCallId: payloadOr(chunk, 'toolCallId') ?? undefined,
          toolName: payloadOr(chunk, 'toolName') ?? '',
          args: payloadOr(chunk, 'args') ?? {},
        };
        break;

      case 'tool-result':
        yield {
          type: 'tool-result',
          toolCallId: payloadOr(chunk, 'toolCallId') ?? undefined,
          toolName: payloadOr(chunk, 'toolName') ?? '',
          result: payloadOr(chunk, 'result') ?? null,
          isError: payloadOr(chunk, 'isError') ?? false,
        };
        break;

      case 'error':
        yield {
          type: 'error',
          error: String(payloadOr(chunk, 'error') ?? chunk),
        };
        break;

      // Ignore step-finish, start, finish, raw, etc.
      default:
        break;
    }
  }
}

/** Extract a field from chunk.payload (Memory format) or chunk directly. */
function payloadOr(chunk: any, field: string): any {
  return chunk.payload?.[field] ?? chunk[field];
}
