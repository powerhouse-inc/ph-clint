import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

// Create a dedicated Marked instance with terminal rendering.
// This avoids mutating the global marked instance.
const marked = new Marked();
marked.use(markedTerminal() as any);

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
  // Trim trailing whitespace that marked/marked-terminal adds
  return rendered.trimEnd();
}
