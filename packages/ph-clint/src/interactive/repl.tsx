import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, Static, useInput, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import type { ReplSession, HistoryEntry } from './types.js';
import { renderMarkdown } from './markdown.js';
import { applyCompletion } from './completions.js';
import { TextInput } from './text-input.js';

interface ReplProps {
  session: ReplSession;
}

/**
 * Interaction mode for the useInput handler.
 * - 'typing': normal text input
 * - 'tab-cycling': Tab/Shift+Tab cycling through completions
 * - 'command-cycling': Up/Down cycling through command matches
 * - 'history-cycling': Up/Down cycling through history
 */
type InteractionMode = 'typing' | 'tab-cycling' | 'history-cycling';

/**
 * Main REPL component for interactive mode.
 */
export function Repl({ session }: ReplProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal focus tracking (DECSET 1004) — only on real TTYs
  const isTTY = 'isTTY' in stdout && stdout.isTTY;
  const [terminalFocused, setTerminalFocused] = useState(true);
  useEffect(() => {
    if (!isTTY) return;
    stdout.write('\x1b[?1004h');
    return () => { stdout.write('\x1b[?1004l'); };
  }, [stdout, isTTY]);

  const [phase, setPhase] = useState<'idle' | 'executing'>('idle');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [cursorOffset, setCursorOffset] = useState<number | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const nextId = useRef(0);

  // Interaction mode tracking
  const [mode, setMode] = useState<InteractionMode>('typing');

  // Tab completion state
  const [tabIndex, setTabIndex] = useState<number | null>(null);
  const tabCompletionsRef = useRef<string[]>([]);

  // History cycling state
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState('');

  // Reset to typing mode
  const resetToTyping = useCallback(() => {
    setMode('typing');
    setTabIndex(null);
    tabCompletionsRef.current = [];
    setHistoryIndex(null);
    setSavedInput('');
  }, []);

  // Set input and move cursor to end
  const setInputWithCursor = useCallback((value: string) => {
    setInput(value);
    setCursorOffset(value.length);
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      setInput('');
      setCursorOffset(0);
      setSuggestions([]);
      resetToTyping();
      setPhase('executing');

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
    [session, exit, resetToTyping],
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
      // Terminal focus reporting (DECSET 1004): \x1b[I = focus, \x1b[O = blur
      if (key.escape || ch === '[I' || ch === '[O') {
        if (ch === 'I' || ch === '[I') { setTerminalFocused(true); return; }
        if (ch === 'O' || ch === '[O') { setTerminalFocused(false); return; }
      }

      if (phase !== 'idle') {
        if (key.escape) {
          setPhase('idle');
        }
        return;
      }

      // --- Tab/Shift+Tab: tab completion cycling ---
      if (key.tab) {
        // If currently cycling history, Tab accepts the recalled entry
        if (mode === 'history-cycling') {
          resetToTyping();
          return;
        }

        const completions = mode === 'tab-cycling'
          ? tabCompletionsRef.current
          : session.getCompletions(input);

        if (completions.length === 0) return;

        tabCompletionsRef.current = completions;
        setMode('tab-cycling');

        const nextIndex = tabIndex === null
          ? 0
          : key.shift
            ? (tabIndex - 1 + completions.length) % completions.length
            : (tabIndex + 1) % completions.length;

        setTabIndex(nextIndex);
        const completed = applyCompletion(input, completions[nextIndex]!);
        setInputWithCursor(completed);
        setSuggestions(completions);
        return;
      }

      // --- Up/Down arrow ---
      if (key.upArrow || key.downArrow) {
        // If already cycling history, continue in history mode
        if (mode === 'history-cycling') {
          const uniqueHistory = getUniqueHistory();
          if (uniqueHistory.length === 0) return;

          if (key.upArrow) {
            if (historyIndex !== null && historyIndex < uniqueHistory.length - 1) {
              const next = historyIndex + 1;
              setHistoryIndex(next);
              setInputWithCursor(uniqueHistory[next]!);
            }
          } else {
            if (historyIndex !== null && historyIndex > 0) {
              const next = historyIndex - 1;
              setHistoryIndex(next);
              setInputWithCursor(uniqueHistory[next]!);
            } else if (historyIndex === 0) {
              setHistoryIndex(null);
              setInputWithCursor(savedInput);
              setMode('typing');
            }
          }
          return;
        }

        // If already tab-cycling, Up/Down cycles through the same list
        if (mode === 'tab-cycling') {
          const completions = tabCompletionsRef.current;
          if (completions.length === 0) return;

          const idx = tabIndex ?? 0;
          const nextIndex = key.upArrow
            ? (idx - 1 + completions.length) % completions.length
            : (idx + 1) % completions.length;

          setTabIndex(nextIndex);
          const completed = applyCompletion(input, completions[nextIndex]!);
          setInputWithCursor(completed);
          setSuggestions(completions);
          return;
        }

        // Entering cycling mode from typing
        const isCommandPrefix = input.startsWith('/') && !input.includes(' ');

        if (isCommandPrefix) {
          // Enter tab-cycling mode (same as Tab)
          const completions = session.getCompletions(input);
          if (completions.length === 0) return;

          tabCompletionsRef.current = completions;
          setMode('tab-cycling');

          const nextIndex = key.upArrow ? completions.length - 1 : 0;
          setTabIndex(nextIndex);
          const completed = applyCompletion(input, completions[nextIndex]!);
          setInputWithCursor(completed);
          setSuggestions(completions);
          return;
        }

        // Enter history cycling mode
        if (key.upArrow) {
          const uniqueHistory = getUniqueHistory();
          if (uniqueHistory.length === 0) return;

          setMode('history-cycling');
          setSavedInput(input);
          setHistoryIndex(0);
          setInputWithCursor(uniqueHistory[0]!);
          setSuggestions([]);
          setTabIndex(null);
          tabCompletionsRef.current = [];
        }
        return;
      }

      // --- Escape: cancel current cycling or do nothing ---
      if (key.escape) {
        if (mode === 'history-cycling') {
          setInputWithCursor(savedInput);
          resetToTyping();
          return;
        }
        if (mode === 'tab-cycling') {
          resetToTyping();
          return;
        }
        return;
      }
    },
    { isActive: true },
  );

  // Compute placeholder signature and inline suggestion for the current input
  const signature = phase === 'idle' ? session.getCommandSignature(input) : null;
  const inlineSuggestion = mode === 'typing' && suggestions.length > 0 ? suggestions[0]! : '';

  // Update suggestions as user types (resets to typing mode)
  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      setCursorOffset(undefined);
      resetToTyping();
      if (value.startsWith('/') && !value.includes(' ')) {
        const completions = session.getCompletions(value);
        setSuggestions(completions);
      } else {
        setSuggestions([]);
      }
    },
    [session, resetToTyping],
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
              cursorOffset={cursorOffset}
              focus={terminalFocused}
              suggestion={inlineSuggestion}
            />
            {signature && (
              <Text dimColor>{' '}{signature}</Text>
            )}
          </Box>
          {suggestions.length > 1 && (
            <Box marginLeft={2}>
              <Text dimColor>{suggestions.join('  ')}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
