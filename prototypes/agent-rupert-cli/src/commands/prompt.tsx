import React, { useState, useEffect } from 'react';
import { render, Text } from 'ink';
import Spinner from 'ink-spinner';
import { randomUUID } from 'node:crypto';
import { Markdown } from '../components/Markdown.js';

function PromptRunner({ prompt, threadId }: { prompt: string; threadId: string }) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { mastra, defaultAgentId } = await import('../mastra/index.js');
      const agent = mastra.getAgentById(defaultAgentId as any);
      const { iterateFullStream } = await import('../stream-utils.js');
      const stream = await agent.stream(prompt, {
        maxSteps: 200,
        memory: {
          thread: threadId,
          resource: 'cli-user',
        },
      });

      for await (const chunk of iterateFullStream(stream.fullStream)) {
        if (cancelled) break;
        setText((prev) => prev + chunk);
      }

      if (!cancelled) setDone(true);
    })();

    return () => { cancelled = true; };
  }, [prompt, threadId]);

  if (!done && text === '') {
    return <Text><Spinner type="dots" /> Working…</Text>;
  }

  if (done) {
    return (
      <>
        <Markdown>{text}</Markdown>
        <Text dimColor>Resume with: rupert --resume {threadId}</Text>
      </>
    );
  }

  return <Markdown>{text}</Markdown>;
}

export async function runPrompt(prompt: string, resumeId?: string) {
  const threadId = resumeId || randomUUID();
  const app = render(<PromptRunner prompt={prompt} threadId={threadId} />);
  await app.waitUntilExit();
}
