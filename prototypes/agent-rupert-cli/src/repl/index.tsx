import React from 'react';
import { render } from 'ink';
import { randomUUID } from 'node:crypto';
import { Repl } from './Repl.js';

export function startRepl(resumeThreadId?: string) {
  const threadId = resumeThreadId || randomUUID();

  const app = render(<Repl threadId={threadId} />, { exitOnCtrlC: false });

  return app.waitUntilExit();
}
