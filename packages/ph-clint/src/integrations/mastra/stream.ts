import { mkdirSync, appendFileSync } from 'node:fs';
import type { StreamChunk } from '../../core/types.js';

const DEBUG_DIR = '/tmp/agent-logs';
const DEBUG_STREAM_FILE = `${DEBUG_DIR}/raw-stream-chunks.jsonl`;

function debugChunk(chunk: { type: string; [key: string]: unknown }): void {
  try {
    mkdirSync(DEBUG_DIR, { recursive: true });
    const summary: Record<string, unknown> = { ts: new Date().toISOString(), type: chunk.type };
    if (chunk.toolName) summary.toolName = chunk.toolName;
    if (chunk.toolCallId) summary.toolCallId = chunk.toolCallId;
    if (chunk.isError !== undefined) summary.isError = chunk.isError;
    if (chunk.payload) {
      const p = chunk.payload as Record<string, unknown>;
      if (p.toolName) summary['payload.toolName'] = p.toolName;
      if (p.toolCallId) summary['payload.toolCallId'] = p.toolCallId;
      if (p.isError !== undefined) summary['payload.isError'] = p.isError;
      if (p.type) summary['payload.type'] = p.type;
    }
    // For unknown types, capture all keys
    if (!['text-delta', 'tool-call', 'tool-result', 'error'].includes(chunk.type)) {
      summary.keys = Object.keys(chunk);
    }
    appendFileSync(DEBUG_STREAM_FILE, JSON.stringify(summary) + '\n');
  } catch { /* best-effort */ }
}

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
    debugChunk(chunk);

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

      // Log but skip step-finish, start, finish, raw, etc.
      default:
        break;
    }
  }
}

/** Extract a field from chunk.payload (Memory format) or chunk directly. */
function payloadOr(chunk: any, field: string): any {
  return chunk.payload?.[field] ?? chunk[field];
}
