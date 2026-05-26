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

      case 'tool-error':
        // Mastra emits 'tool-error' (not 'tool-result' with isError) when a tool throws
        yield {
          type: 'tool-result',
          toolCallId: payloadOr(chunk, 'toolCallId') ?? undefined,
          toolName: payloadOr(chunk, 'toolName') ?? '',
          result: payloadOr(chunk, 'error') ?? 'Tool execution failed',
          isError: true,
        };
        break;

      case 'error':
        yield {
          type: 'error',
          error: String(payloadOr(chunk, 'error') ?? chunk),
        };
        break;

      case 'step-finish':
        yield {
          type: 'step-finish',
          usage: extractUsage(chunk),
          finishReason: extractFinishReason(chunk),
        };
        break;

      case 'finish':
        yield {
          type: 'finish',
          usage: extractUsage(chunk),
          finishReason: extractFinishReason(chunk),
        };
        break;

      // Log but skip start, raw, etc.
      default:
        break;
    }
  }
}

/** Extract a field from chunk.payload (Memory format) or chunk directly. */
function payloadOr(chunk: any, field: string): any {
  return chunk.payload?.[field] ?? chunk[field];
}

/**
 * Pull token usage out of a Mastra step-finish / finish chunk. The
 * canonical location (verified empirically against `@mastra/core` 1.32)
 * is `chunk.payload.output.usage`, with the fields already flattened to
 * the AI-SDK names: `inputTokens`, `outputTokens`, `totalTokens`,
 * `cachedInputTokens`, `cacheCreationInputTokens`, `reasoningTokens`.
 * Anthropic's raw `cache_creation_input_tokens` is at
 * `usage.raw.raw.cache_creation_input_tokens` if ever needed.
 */
const USAGE_KEYS = [
  'inputTokens',
  'outputTokens',
  'totalTokens',
  'cachedInputTokens',
  'cacheCreationInputTokens',
  'reasoningTokens',
] as const;

function extractUsage(chunk: any): import('../../core/types.js').StreamUsage | undefined {
  const usage = chunk?.payload?.output?.usage;
  if (!usage || typeof usage !== 'object') return undefined;
  const out: Record<string, number> = {};
  for (const key of USAGE_KEYS) {
    const v = (usage as Record<string, unknown>)[key];
    if (typeof v === 'number') out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function extractFinishReason(chunk: any): string | undefined {
  const reason = chunk?.payload?.stepResult?.reason;
  return typeof reason === 'string' ? reason : undefined;
}
