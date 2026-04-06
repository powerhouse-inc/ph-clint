import React from 'react';
import { render } from 'ink';
import { Repl } from './repl.js';
import type { ReplSession } from './types.js';

/**
 * Start the Ink-based interactive REPL.
 * This function renders the Repl component and waits until the user exits.
 */
export async function startInkRepl(session: ReplSession): Promise<void> {
  const app = render(<Repl session={session} />, { exitOnCtrlC: false });
  await app.waitUntilExit();
}
