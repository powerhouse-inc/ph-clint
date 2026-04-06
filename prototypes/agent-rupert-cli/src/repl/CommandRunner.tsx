import { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { Markdown } from '../components/Markdown.js';
import type { CommandDef } from '../commands/registry.js';

interface Props {
  command: CommandDef;
  args: string;
  /** Show a spinner while waiting for the first output chunk. Default: true */
  spinner?: boolean;
}

export function CommandRunner({ command, args, spinner = true }: Props) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      for await (const chunk of command.execute(args)) {
        if (cancelled) break;
        setText((prev) => prev + chunk);
      }
      if (!cancelled) setDone(true);
    })();

    return () => { cancelled = true; };
  }, [command, args]);

  if (!done && text === '') {
    if (!spinner) return null;
    return (
      <Text>
        <Spinner type="dots" /> Working…
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Markdown>{text}</Markdown>
    </Box>
  );
}
