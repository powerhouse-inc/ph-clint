import React, { useState } from 'react';
import { render, Text, Box } from 'ink';
import TextInput from 'ink-text-input';
import { CommandRunner } from '../repl/CommandRunner.js';
import { getCommand } from './registry.js';

function CityPrompt({ onSubmit }: { onSubmit: (city: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <Box>
      <Text>Which city? </Text>
      <TextInput value={value} onChange={setValue} onSubmit={onSubmit} />
    </Box>
  );
}

function WeatherApp({ initialCity }: { initialCity?: string }) {
  const [city, setCity] = useState(initialCity);

  if (!city) {
    return <CityPrompt onSubmit={setCity} />;
  }

  return <CommandRunner command={getCommand('weather')!} args={city} />;
}

export function run(arg?: string) {
  render(<WeatherApp initialCity={arg} />);
}
