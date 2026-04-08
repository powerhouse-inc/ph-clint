import React from 'react';
import { render } from 'ink';
import { Repl } from './repl.js';
import type { ReplSession } from './types.js';
import type { ServiceManager } from '../core/types.js';

export interface StartInkReplOptions {
  services?: ServiceManager;
}

/**
 * Start the Ink-based interactive REPL.
 * This function renders the Repl component and waits until the user exits.
 */
export async function startInkRepl(session: ReplSession, opts?: StartInkReplOptions): Promise<void> {
  const app = render(
    <Repl session={session} services={opts?.services} />,
    { exitOnCtrlC: false },
  );
  await app.waitUntilExit();
}
