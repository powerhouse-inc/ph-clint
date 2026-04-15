import React from 'react';
import { render } from 'ink';
import { Repl } from './repl.js';
import type { ReplSession } from './types.js';
import type { ServiceManager } from '../core/types.js';

export interface StartInkReplOptions {
  services?: ServiceManager;
  workdir?: string;
  /** Called after Ink mounts, before user input is accepted. The `append` function adds a system message to the Repl's display. */
  onStart?: (append: (msg: string) => void) => Promise<void>;
  /** Subscribe to background messages (service events). Returns unsubscribe function. */
  onMessage?: (handler: (msg: string) => void) => (() => void);
}

/**
 * Start the Ink-based interactive REPL.
 * This function renders the Repl component and waits until the user exits.
 */
export async function startInkRepl(session: ReplSession, opts?: StartInkReplOptions): Promise<void> {
  const app = render(
    <Repl
      session={session}
      services={opts?.services}
      workdir={opts?.workdir}
      onStart={opts?.onStart}
      onMessage={opts?.onMessage}
    />,
    { exitOnCtrlC: false },
  );
  await app.waitUntilExit();
}
