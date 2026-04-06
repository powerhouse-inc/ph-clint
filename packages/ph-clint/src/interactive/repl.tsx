import React, { useState, useCallback, useRef } from 'react';
import { Box, Text, Static, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import type { ReplSession, HistoryEntry } from './types.js';
import { renderMarkdown } from './markdown.js';

interface ReplProps {
  session: ReplSession;
}

/**
 * Main REPL component for interactive mode.
 *
 * Uses Ink's React component model:
 * - <Static> for immutable history entries
 * - TextInput for user input with Tab completion
 * - Spinner during command execution
 * - useInput for keyboard shortcuts (Escape, Tab)
 */
export function Repl({ session }: ReplProps) {
  const { exit } = useApp();
  const [phase, setPhase] = useState<'idle' | 'executing'>('idle');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const nextId = useRef(0);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      setInput('');
      setSuggestions([]);
      setPhase('executing');
      setStreamingText('');

      const result = await session.processInput(trimmed);

      if (result.type === 'exit') {
        setHistory((h) => [
          ...h,
          { id: nextId.current++, input: trimmed, output: result.text, type: result.type },
        ]);
        exit();
        return;
      }

      setHistory((h) => [
        ...h,
        { id: nextId.current++, input: trimmed, output: result.text, type: result.type },
      ]);
      setPhase('idle');
    },
    [session, exit],
  );

  // Handle Tab for completion, Escape for cancel
  useInput(
    (ch, key) => {
      if (key.tab && phase === 'idle') {
        const completions = session.getCompletions(input);
        if (completions.length === 1) {
          setInput(completions[0]! + ' ');
          setSuggestions([]);
        } else if (completions.length > 1) {
          setSuggestions(completions);
        }
      }
      if (key.escape && phase === 'executing') {
        // TODO: cancel current execution via AbortController
        setPhase('idle');
      }
    },
    { isActive: true },
  );

  // Compute placeholder signature for the current input
  const signature = phase === 'idle' ? session.getCommandSignature(input) : null;

  // Update suggestions as user types
  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      if (value.startsWith('/') && !value.includes(' ')) {
        const completions = session.getCompletions(value);
        setSuggestions(completions.length > 1 ? completions : []);
      } else {
        setSuggestions([]);
      }
    },
    [session],
  );

  return (
    <Box flexDirection="column">
      {/* Welcome message — shown only if there's no history yet */}
      {history.length === 0 && session.welcome && (
        <Box marginBottom={1}>
          <Text bold>{session.welcome}</Text>
        </Box>
      )}

      {/* Immutable history */}
      <Static items={history}>
        {(entry) => (
          <Box key={entry.id} flexDirection="column" marginBottom={0}>
            <Text dimColor>{'> '}{entry.input}</Text>
            {entry.output ? (
              <Text
                color={entry.type === 'error' ? 'red' : undefined}
              >
                {entry.output}
              </Text>
            ) : null}
          </Box>
        )}
      </Static>

      {/* Current execution or input */}
      {phase === 'executing' ? (
        <Box>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text> Working...</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box>
            <Text color="green">{'> '}</Text>
            <TextInput
              value={input}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
            {signature && (
              <Text dimColor>{' '}{signature}</Text>
            )}
          </Box>
          {suggestions.length > 0 && (
            <Box marginLeft={2}>
              <Text dimColor>{suggestions.join('  ')}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
