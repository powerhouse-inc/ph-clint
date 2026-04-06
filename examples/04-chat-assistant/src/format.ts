import type { StreamChunk } from 'ph-clint';

// ANSI color codes
const green = '\x1b[32m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

/**
 * Format a StreamChunk with ANSI colors for terminal display.
 */
export function colorFormat(chunk: StreamChunk): string {
  switch (chunk.type) {
    case 'text-delta':
      return chunk.text;

    case 'tool-call':
      return `\n${green}▶ ${chunk.toolName}${dim}(${truncate(JSON.stringify(chunk.args), 120)})${reset}\n`;

    case 'tool-result':
      if (chunk.isError) {
        return `${red}✗ ${chunk.toolName} error: ${formatResult(chunk.result)}${reset}\n`;
      }
      return `${green}✓ ${chunk.toolName}${reset} ${dim}→ ${truncate(formatResult(chunk.result), 200)}${reset}\n`;

    case 'error':
      return `${red}Error: ${chunk.error}${reset}\n`;
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function formatResult(result: unknown): string {
  if (result === undefined || result === null) return 'ok';
  if (typeof result === 'string') return result.length > 200 ? result.slice(0, 80) + '…' : result;
  return JSON.stringify(result);
}
