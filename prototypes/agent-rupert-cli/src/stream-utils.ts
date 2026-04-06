const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREEN_DIM = '\x1b[32;2m';

/**
 * Iterate over a Mastra agent fullStream and yield formatted strings
 * that include tool-call / tool-result / error activity alongside text.
 */
export async function* iterateFullStream(
  fullStream: AsyncIterable<any>,
): AsyncGenerator<string, void, unknown> {
  let lastChunkWasText = false;

  for await (const chunk of fullStream) {
    switch (chunk.type) {
      case 'text-delta':
        if (!lastChunkWasText) {
          yield '\n';
          lastChunkWasText = true;
        }
        yield chunk.payload.text;
        break;

      case 'tool-call':
        lastChunkWasText = false;
        yield `\n${DIM}${GREEN_DIM}▶ ${chunk.payload.toolName}${RESET}${DIM}(${truncateArgs(chunk.payload.args)})${RESET}\n`;
        break;

      case 'tool-result':
        lastChunkWasText = false;
        if (chunk.payload.isError) {
          yield `${RED}✗ ${chunk.payload.toolName} error: ${formatResult(chunk.payload.result)}${RESET}\n`;
        } else {
          yield `${DIM}${GREEN_DIM}✓ ${chunk.payload.toolName}${RESET}${DIM} → ${truncateResult(chunk.payload.result)}${RESET}\n`;
        }
        break;

      case 'tool-error':
        lastChunkWasText = false;
        yield `${RED}✗ ${chunk.payload.toolName}: ${chunk.payload.error}${RESET}\n`;
        break;

      case 'error':
        lastChunkWasText = false;
        yield `${RED}Error: ${chunk.payload.error}${RESET}\n`;
        break;

      case 'step-finish':
        // silent — useful for debugging but noisy for users
        break;

      // Ignore other chunk types (start, finish, raw, etc.)
      default:
        break;
    }
  }
}

function truncateArgs(args: Record<string, any>): string {
  const json = JSON.stringify(args);
  return json.length > 120 ? json.slice(0, 120) + '…' : json;
}

function truncateResult(result: any): string {
  const str = formatResult(result);
  return str.length > 200 ? str.slice(0, 200) + '…' : str;
}

function formatResult(result: any): string {
  if (result === undefined || result === null) return 'ok';
  if (typeof result === 'string') return result;
  return JSON.stringify(result);
}
