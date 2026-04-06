import React, { useState, useCallback, useRef } from 'react';
import { Box, Text, Static, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import type { ReplSession, HistoryEntry } from './types.js';
import { renderMarkdown } from './markdown.js';
import { applyCompletion } from './completions.js';

interface ReplProps {
  session: ReplSession;
}

/**
 * Main REPL component for interactive mode.
 *
 * Uses Ink's React component model:
 * - <Static> for immutable history entries
 * - TextInput for user input with Tab/Shift+Tab completion cycling
 * - Up/Down arrow for command match cycling (when typing `/`) or history cycling
 * - Spinner during command execution
 * - useInput for keyboard shortcuts (Escape, Tab, arrows)
 */
export function Repl({ session }: ReplProps) {
  const { exit } = useApp();
  const [phase, setPhase] = useState<'idle' | 'executing'>('idle');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const nextId = useRef(0);

  // Feature 1: Tab completion cycling
  const [tabIndex, setTabIndex] = useState<number | null>(null);
  const tabCompletionsRef = useRef<string[]>([]);

  // Feature 2: Command match cycling (up/down when typing `/`)
  const [commandCycleIndex, setCommandCycleIndex] = useState<number | null>(null);

  // Feature 3: History cycling (up/down when not typing a command)
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState('');

  // Reset all cycling state
  const resetCycleState = useCallback(() => {
    setTabIndex(null);
    tabCompletionsRef.current = [];
    setCommandCycleIndex(null);
    setHistoryIndex(null);
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      setInput('');
      setSuggestions([]);
      resetCycleState();
      setSavedInput('');
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
    [session, exit, resetCycleState],
  );

  // Get unique history inputs (skip consecutive duplicates), most recent first
  const getUniqueHistory = useCallback(() => {
    const inputs: string[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i]!.input;
      if (inputs.length === 0 || inputs[inputs.length - 1] !== h) {
        inputs.push(h);
      }
    }
    return inputs;
  }, [history]);

  useInput(
    (ch, key) => {
      if (phase !== 'idle') {
        if (key.escape) {
          // TODO: cancel current execution via AbortController
          setPhase('idle');
        }
        return;
      }

      // Feature 1: Tab/Shift+Tab cycles through completions inline
      if (key.tab) {
        const completions = tabIndex !== null
          ? tabCompletionsRef.current
          : session.getCompletions(input);

        if (completions.length === 0) return;

        tabCompletionsRef.current = completions;
        const nextIndex = tabIndex === null
          ? 0
          : key.shift
            ? (tabIndex - 1 + completions.length) % completions.length
            : (tabIndex + 1) % completions.length;

        setTabIndex(nextIndex);
        setInput(applyCompletion(input, completions[nextIndex]!));
        setSuggestions(completions.length > 1 ? completions : []);
        return;
      }

      // Feature 2: Up/Down cycles command matches when typing `/` prefix (no space)
      const isCommandPrefix = input.startsWith('/') && !input.includes(' ');

      if ((key.upArrow || key.downArrow) && isCommandPrefix) {
        const completions = session.getCompletions(input);
        if (completions.length === 0) return;

        const nextIndex = commandCycleIndex === null
          ? (key.upArrow ? completions.length - 1 : 0)
          : key.upArrow
            ? (commandCycleIndex - 1 + completions.length) % completions.length
            : (commandCycleIndex + 1) % completions.length;

        setCommandCycleIndex(nextIndex);
        setInput(completions[nextIndex]!);
        setSuggestions(completions);
        setTabIndex(null);
        tabCompletionsRef.current = [];
        setHistoryIndex(null);
        return;
      }

      // Feature 3: Up/Down cycles through history when not typing a command prefix
      if (key.upArrow || key.downArrow) {
        const uniqueHistory = getUniqueHistory();
        if (uniqueHistory.length === 0) return;

        if (key.upArrow) {
          if (historyIndex === null) {
            setSavedInput(input);
            setHistoryIndex(0);
            setInput(uniqueHistory[0]!);
          } else if (historyIndex < uniqueHistory.length - 1) {
            const next = historyIndex + 1;
            setHistoryIndex(next);
            setInput(uniqueHistory[next]!);
          }
        } else {
          // downArrow
          if (historyIndex === null) return;
          if (historyIndex > 0) {
            const next = historyIndex - 1;
            setHistoryIndex(next);
            setInput(uniqueHistory[next]!);
          } else {
            setHistoryIndex(null);
            setInput(savedInput);
          }
        }
        setTabIndex(null);
        tabCompletionsRef.current = [];
        setCommandCycleIndex(null);
        setSuggestions([]);
        return;
      }
    },
    { isActive: true },
  );

  // Compute placeholder signature for the current input
  const signature = phase === 'idle' ? session.getCommandSignature(input) : null;

  // Update suggestions as user types (resets cycling state)
  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      resetCycleState();
      setSavedInput('');
      if (value.startsWith('/') && !value.includes(' ')) {
        const completions = session.getCompletions(value);
        setSuggestions(completions.length > 1 ? completions : []);
      } else {
        setSuggestions([]);
      }
    },
    [session, resetCycleState],
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
