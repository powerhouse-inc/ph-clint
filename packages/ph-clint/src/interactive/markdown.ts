import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

// Create a dedicated Marked instance with terminal rendering.
// This avoids mutating the global marked instance.
const marked = new Marked();
marked.use(markedTerminal() as any);
// Force all lists to render as "tight" (no extra newlines between items).
// Without this, a single blank line between top-level items makes marked
// set loose:true on the entire list, causing marked-terminal to add
// double newlines between ALL items including tight nested ones.
marked.use({
  walkTokens(token: { type: string; loose?: boolean }) {
    if (token.type === 'list' || token.type === 'list_item') {
      token.loose = false;
    }
  },
});

/**
 * Render a markdown string for terminal display.
 * Returns ANSI-formatted text suitable for terminal output.
 *
 * For plain text (no markdown), the output is the same as the input
 * (with a trailing newline trimmed).
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';
  const rendered = marked.parse(text);
  /* istanbul ignore next -- marked.parse() always returns string with sync config */
  if (typeof rendered !== 'string') {
    return text;
  }
  // marked-terminal inserts whitespace-only lines (with ANSI resets)
  // between list items as separators. Remove these but keep truly empty
  // lines which serve as paragraph breaks.
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
  return rendered
    .split('\n')
    .filter(line => line.length === 0 || stripAnsi(line).trim().length > 0)
    .join('\n')
    .trimEnd();
}
