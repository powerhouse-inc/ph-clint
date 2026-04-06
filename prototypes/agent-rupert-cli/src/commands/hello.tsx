import React, { useState } from 'react';
import { render, Text, Box } from 'ink';
import TextInput from 'ink-text-input';
import { CommandRunner } from '../repl/CommandRunner.js';
import { getCommand } from './registry.js';

function NamePrompt({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <Box>
      <Text>Who would you like to greet? </Text>
      <TextInput value={value} onChange={setValue} onSubmit={(v) => onSubmit(v || 'world')} />
    </Box>
  );
}

function HelloApp({ initialName, interactive }: { initialName?: string; interactive?: boolean }) {
  const [name, setName] = useState(initialName);

  if (!name && interactive) {
    return <NamePrompt onSubmit={setName} />;
  }

  return <CommandRunner command={getCommand('hello')!} args={name || 'world'} spinner={false} />;
}

export function run(arg?: string, interactive?: boolean) {
  render(<HelloApp initialName={arg} interactive={interactive} />);
}
