import type { StreamChunk } from './types.js';

/**
 * Format a single StreamChunk into a display string.
 *
 * This is the framework-level formatter. The Mastra integration maps
 * Mastra's fullStream chunks to StreamChunk first, then this renders them.
 */
export function formatStreamChunk(chunk: StreamChunk): string {
  switch (chunk.type) {
    case 'text-delta':
      return chunk.text;

    case 'tool-call':
      return `\n▶ ${chunk.toolName}(${truncateArgs(chunk.args)})\n`;

    case 'tool-result':
      if (chunk.isError) {
        return `✗ ${chunk.toolName} error: ${formatResult(chunk.result)}\n`;
      }
      return `✓ ${chunk.toolName} → ${truncateResult(chunk.result)}\n`;

    case 'error':
      return `Error: ${chunk.error}\n`;
  }
}

/**
 * Consume a stream of StreamChunks and yield formatted display strings.
 * This is the main entry point for rendering agent/streaming output.
 */
export async function* renderStream(
  stream: AsyncGenerator<StreamChunk>,
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    yield formatStreamChunk(chunk);
  }
}

function truncateArgs(args: unknown): string {
  const json = JSON.stringify(args);
  return json.length > 120 ? json.slice(0, 120) + '…' : json;
}

function truncateResult(result: unknown): string {
  const str = formatResult(result);
  return str.length > 200 ? str.slice(0, 200) + '…' : str;
}

function formatResult(result: unknown): string {
  if (result === undefined || result === null) return 'ok';
  if (typeof result === 'string') return result;
  return JSON.stringify(result);
}
