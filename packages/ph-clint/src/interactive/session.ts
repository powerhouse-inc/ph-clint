import type { ReplOutput, ReplSession, ReplSessionOptions } from './types.js';
import { parseReplInput } from './router.js';
import { getCompletions, getCommandSignature } from './completions.js';
import { renderMarkdown } from './markdown.js';

/**
 * Format a command result for display.
 * If the result has a `.text` string property, use that.
 * Otherwise, convert to string.
 */
function formatResult(result: unknown): string {
  if (result === undefined || result === null) return '';
  if (
    typeof result === 'object' &&
    result !== null &&
    'text' in result &&
    typeof (result as Record<string, unknown>).text === 'string'
  ) {
    return (result as Record<string, unknown>).text as string;
  }
  return String(result);
}

/**
 * Create a REPL session — the testable logic layer for interactive mode.
 *
 * The session processes input lines (e.g. `/greet --name Alice`),
 * dispatches them to commands, and returns formatted output.
 * It is independent of Ink rendering.
 */
export function createReplSession(opts: ReplSessionOptions): ReplSession {
  const { cli, context } = opts;
  const commands = cli.listCommands();
  const commandIds = commands.map((c) => c.id);

  function generateHelp(): string {
    const lines = ['Available commands:'];
    for (const cmd of commands) {
      lines.push(`  /${cmd.id.padEnd(16)} ${cmd.description}`);
    }
    lines.push('');
    lines.push('  /help             Show this help');
    lines.push('  /exit             Exit the REPL');
    return lines.join('\n');
  }

  async function processInput(input: string): Promise<ReplOutput> {
    const parsed = parseReplInput(input, commandIds);

    switch (parsed.type) {
      case 'empty':
        return { text: '', type: 'empty' };

      case 'help':
        return { text: generateHelp(), type: 'help' };

      case 'exit':
        return { text: 'Goodbye!', type: 'exit' };

      case 'unknown':
        if (parsed.commandId) {
          return {
            text: `Unknown command: /${parsed.commandId}. Type /help for available commands.`,
            type: 'error',
          };
        }
        return {
          text: 'Commands start with /. Type /help for available commands.',
          type: 'error',
        };

      case 'command': {
        try {
          const args = cli.parseArgs(parsed.commandId!, parsed.args!);
          const result = await cli.execute(parsed.commandId!, args, context);
          const text = formatResult(result);
          return { text: renderMarkdown(text), type: 'result' };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { text: msg, type: 'error' };
        }
      }
    }
  }

  return {
    processInput,
    getCompletions: (partial: string) => getCompletions(partial, commands),
    getCommandSignature: (input: string) => getCommandSignature(input, commands),
    welcome: cli.interactive?.welcome,
  };
}
