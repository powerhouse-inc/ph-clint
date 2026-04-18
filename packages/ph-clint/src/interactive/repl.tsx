import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, Static, useInput, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import type { ReplSession, HistoryEntry } from './types.js';
import type { ServiceManager, StreamChunk } from '../core/types.js';
import { formatStreamChunk } from '../core/stream.js';
import { renderMarkdown } from './markdown.js';
import { applyCompletion } from './completions.js';
import { TextInput } from './text-input.js';
import { ServicePanel } from './service-panel.js';

interface ReplProps {
  session: ReplSession;
  services?: ServiceManager;
  workdir?: string;
  /** Called after Ink mounts, before user input is accepted. The `append` function adds a system message to the Repl's display. */
  onStart?: (append: (msg: string) => void) => Promise<void>;
  /** Subscribe to background messages (service events). Returns unsubscribe function. */
  onMessage?: (handler: (msg: string) => void) => (() => void);
}

/**
 * Interaction mode for the useInput handler.
 * - 'typing': normal text input
 * - 'tab-cycling': Tab/Shift+Tab cycling through completions
 * - 'command-cycling': Up/Down cycling through command matches
 * - 'history-cycling': Up/Down cycling through history
 */
type InteractionMode = 'typing' | 'tab-cycling' | 'history-cycling';

/** Default number of trailing lines shown in the rolling output window during streaming. */
const DEFAULT_OUTPUT_WINDOW = 6;

/** Prefix for the first line of indented tool output. */
const INDENT_FIRST = ' ⎿ ';
/** Prefix for continuation lines of indented tool output. */
const INDENT_REST = '   ';

/** Strip ANSI escape codes for visible-width measurement. */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Indent and truncate tool output lines for the rolling window.
 * First line gets ` ⎿ `, subsequent lines get `   `.
 * Lines are truncated to fit within `maxWidth` columns.
 */
function formatToolLines(lines: string[], maxWidth: number): string[] {
  return lines.map((line, i) => {
    const prefix = i === 0 ? INDENT_FIRST : INDENT_REST;
    const available = maxWidth - prefix.length;
    if (available <= 0) return prefix;
    const visible = stripAnsi(line);
    if (visible.length <= available) return prefix + line;
    // Truncate: find how many chars of the original string to keep
    // Walk the original string, tracking visible characters
    let visCount = 0;
    let cutIdx = line.length;
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '\x1b') {
        // Skip ANSI sequence
        const end = line.indexOf('m', j);
        if (end !== -1) { j = end; continue; }
      }
      visCount++;
      if (visCount >= available - 1) { // -1 for ellipsis
        cutIdx = j + 1;
        break;
      }
    }
    return prefix + line.slice(0, cutIdx) + '…';
  });
}

/** A logical segment of streaming output — either agent text or a tool call/result pair. */
interface StreamSegment {
  type: 'text' | 'tool';
  /** Formatted display lines accumulated in this segment. */
  lines: string[];
  /** Tool call ID for matching results to calls (from Vercel AI SDK). */
  toolCallId?: string;
  /** Tool name (for tool segments). */
  toolName?: string;
  /** Number of header lines (tool-call) pinned above the rolling window. */
  headerLines: number;
  /** Whether the tool segment has received its result. */
  complete: boolean;
}

/** Reducer: append a new StreamChunk to the segment list. */
function updateSegments(prev: StreamSegment[], chunk: StreamChunk): StreamSegment[] {
  const next = prev.map(s => ({ ...s, lines: [...s.lines] }));

  switch (chunk.type) {
    case 'text-delta': {
      const last = next[next.length - 1];
      if (last && last.type === 'text') {
        // Append to existing text segment (join with \n to preserve line breaks)
        const text = last.lines.join('\n') + chunk.text;
        last.lines = text.split('\n');
      } else {
        // Start a new text segment
        next.push({ type: 'text', lines: chunk.text.split('\n'), headerLines: 0, complete: false });
      }
      break;
    }
    case 'tool-call': {
      // Strip leading/trailing \n from formatStreamChunk, keep only content lines
      const headerLines = formatStreamChunk(chunk).split('\n').filter(l => l !== '');
      next.push({
        type: 'tool',
        lines: headerLines,
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        headerLines: headerLines.length,
        complete: false,
      });
      break;
    }
    case 'tool-result': {
      // Strip empty lines from leading/trailing \n
      const resultLines = formatStreamChunk(chunk).split('\n').filter(l => l !== '');
      // Match by toolCallId (exact), then toolName (FIFO), then any incomplete
      const toolSeg = (chunk.toolCallId
          ? next.find(s => s.type === 'tool' && !s.complete && s.toolCallId === chunk.toolCallId)
          : undefined)
        ?? next.find(s => s.type === 'tool' && !s.complete && s.toolName === chunk.toolName)
        ?? next.find(s => s.type === 'tool' && !s.complete);
      if (toolSeg) {
        toolSeg.lines.push(...resultLines);
        toolSeg.complete = true;
      } else {
        next.push({ type: 'tool', lines: resultLines, toolCallId: chunk.toolCallId, toolName: chunk.toolName, headerLines: 0, complete: true });
      }
      break;
    }
    case 'tool-output': {
      const toolSeg = [...next].reverse().find(s => s.type === 'tool' && !s.complete);
      if (toolSeg) {
        const outputLines = chunk.text.split('\n').filter(l => l !== '');
        toolSeg.lines.push(...outputLines);
      }
      break;
    }
    case 'error': {
      const errorLines = formatStreamChunk(chunk).split('\n').filter(l => l !== '');
      const last = next[next.length - 1];
      if (last) {
        last.lines.push(...errorLines);
      } else {
        next.push({ type: 'text', lines: errorLines, headerLines: 0, complete: false });
      }
      break;
    }
  }

  return next;
}

/**
 * Main REPL component for interactive mode.
 */
export function Repl({ session, services, workdir, onStart, onMessage }: ReplProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 80;

  // Terminal focus tracking (DECSET 1004) — only on real TTYs
  const isTTY = 'isTTY' in stdout && stdout.isTTY;
  const [terminalFocused, setTerminalFocused] = useState(true);
  useEffect(() => {
    if (!isTTY) return;
    stdout.write('\x1b[?1004h');
    return () => { stdout.write('\x1b[?1004l'); };
  }, [stdout, isTTY]);

  const [phase, setPhase] = useState<'starting' | 'idle' | 'executing' | 'panel'>(onStart ? 'starting' : 'idle');
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  // Run onStart callback after mount — shows spinner + system messages, then transitions to idle
  useEffect(() => {
    if (!onStart) return;
    const append = (msg: string) => setSystemMessages((prev) => [...prev, msg]);
    onStart(append).then(
      () => setPhase('idle'),
      (err) => {
        append(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setPhase('idle');
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to background messages (service events) — rolling 3-line window
  useEffect(() => {
    if (!onMessage) return;
    const handler = (msg: string) => {
      setStatusLines((prev) => [...prev.slice(-2), msg]);
    };
    const unsub = onMessage(handler);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [cursorOffset, setCursorOffset] = useState<number | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [promptLabel, setPromptLabel] = useState<string | null>(null);
  const [segments, setSegments] = useState<StreamSegment[]>([]);
  const streamingFullRef = useRef('');
  const [currentInput, setCurrentInput] = useState('');
  const nextId = useRef(0);
  const interruptedRef = useRef(false);

  // Interaction mode tracking
  const [mode, setMode] = useState<InteractionMode>('typing');

  // Tab completion state
  const [tabIndex, setTabIndex] = useState<number | null>(null);
  const tabCompletionsRef = useRef<string[]>([]);
  const tabBaseInputRef = useRef('');

  // History cycling state
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState('');

  // Reset to typing mode
  const resetToTyping = useCallback(() => {
    setMode('typing');
    setTabIndex(null);
    tabCompletionsRef.current = [];
    tabBaseInputRef.current = '';
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
      // Allow empty submit during prompting (to accept defaults)
      if (!trimmed && !session.isPrompting) return;

      setInput('');
      setCursorOffset(0);
      setSuggestions([]);
      resetToTyping();
      setPhase('executing');
      setSegments([]);
      streamingFullRef.current = '';
      setCurrentInput(trimmed);
      interruptedRef.current = false;

      // Wire up streaming callback so chunks appear incrementally
      session.onStreamChunk = (chunk, fullText) => {
        streamingFullRef.current = fullText;
        setSegments(prev => updateSegments(prev, chunk));
      };

      const result = await session.processInput(trimmed);

      // Clear streaming callback
      session.onStreamChunk = undefined;
      setSegments([]);
      streamingFullRef.current = '';

      // If the user pressed Escape during execution, the partial output
      // was already captured into history — skip adding a duplicate.
      if (interruptedRef.current) {
        interruptedRef.current = false;
        return;
      }

      if (result.type === 'exit') {
        setHistory((h) => [
          ...h,
          { id: nextId.current++, input: trimmed, output: result.text, type: result.type },
        ]);
        // Print goodbye directly — Ink tears down before React can render the state update
        if (result.text) {
          stdout.write(result.text + '\n\n');
        }
        exit();
        return;
      }

      if (result.type === 'panel') {
        setHistory((h) => [
          ...h,
          { id: nextId.current++, input: trimmed, output: '', type: 'empty' },
        ]);
        setActivePanelId(result.panelId ?? null);
        setPhase('panel');
        return;
      }

      if (result.type === 'prompt') {
        // Show the user's input in history (if they typed something)
        if (trimmed) {
          setHistory((h) => [
            ...h,
            { id: nextId.current++, input: trimmed, output: '', type: 'empty' },
          ]);
        }
        setPromptLabel(result.promptLabel ?? null);
        setPhase('idle');
        return;
      }

      // Clear prompt label when command completes
      setPromptLabel(null);

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

      // Ctrl+C: print exit/resume message and quit
      if (key.ctrl && ch === 'c') {
        stdout.write('\n' + session.exitMessage + '\n\n');
        exit();
        return;
      }

      if (phase !== 'idle') {
        if (key.escape) {
          // Preserve any accumulated streaming output in history
          if (phase === 'executing') {
            interruptedRef.current = true;
            setHistory((h) => [
              ...h,
              {
                id: nextId.current++,
                input: currentInput,
                output: streamingFullRef.current || '(interrupted)',
                type: 'result' as const,
              },
            ]);
            setSegments([]);
            streamingFullRef.current = '';
          }
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

        const baseInput = mode === 'tab-cycling' ? tabBaseInputRef.current : input;
        const completions = mode === 'tab-cycling'
          ? tabCompletionsRef.current
          : session.getCompletions(baseInput);

        if (completions.length === 0) {
          // No completions — but if there's a ghost suggestion (e.g. closing quote), apply it
          const ghost = session.getGhostSuggestion(input);
          if (ghost) {
            setInputWithCursor(ghost);
          }
          return;
        }

        if (mode !== 'tab-cycling') {
          tabBaseInputRef.current = input;
          tabCompletionsRef.current = completions;
          setMode('tab-cycling');
        }

        const nextIndex = tabIndex === null
          ? 0
          : key.shift
            ? (tabIndex - 1 + completions.length) % completions.length
            : (tabIndex + 1) % completions.length;

        setTabIndex(nextIndex);
        const completed = applyCompletion(baseInput, completions[nextIndex]!) + session.getCompletionSuffix(completions[nextIndex]!, baseInput);
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
          const baseInput = tabBaseInputRef.current;
          const completions = tabCompletionsRef.current;
          if (completions.length === 0) return;

          const idx = tabIndex ?? 0;
          const nextIndex = key.upArrow
            ? (idx - 1 + completions.length) % completions.length
            : (idx + 1) % completions.length;

          setTabIndex(nextIndex);
          const completed = applyCompletion(baseInput, completions[nextIndex]!) + session.getCompletionSuffix(completions[nextIndex]!, baseInput);
          setInputWithCursor(completed);
          setSuggestions(completions);
          return;
        }

        // Entering cycling mode from typing — try completions first
        if (input.startsWith('/')) {
          const completions = session.getCompletions(input);
          if (completions.length > 0) {
            tabBaseInputRef.current = input;
            tabCompletionsRef.current = completions;
            setMode('tab-cycling');

            const nextIndex = key.upArrow ? completions.length - 1 : 0;
            setTabIndex(nextIndex);
            const completed = applyCompletion(input, completions[nextIndex]!) + session.getCompletionSuffix(completions[nextIndex]!, input);
            setInputWithCursor(completed);
            setSuggestions(completions);
            return;
          }
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

  // Compute inline ghost suggestion for the current input
  const inlineSuggestion = mode === 'typing' && phase === 'idle'
    ? (session.getGhostSuggestion(input) ?? '')
    : '';

  // Update suggestions as user types (resets to typing mode)
  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      setCursorOffset(undefined);
      resetToTyping();
      if (value.startsWith('/')) {
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
        <Box marginTop={1} marginBottom={1}>
          <Text bold>{session.welcome}</Text>
        </Box>
      )}

      {/* System messages from onStart (e.g. "Reactor ready", "Switchboard ready") */}
      {systemMessages.length > 0 && (
        <Box flexDirection="column">
          {systemMessages.map((msg, i) => (
            <Text key={i} dimColor>{msg}</Text>
          ))}
        </Box>
      )}

      {/* Immutable history */}
      <Static items={history}>
        {(entry) => (
          <Box key={entry.id} flexDirection="column" marginBottom={1}>
            <Text>{' '}</Text>
            <Text backgroundColor="#333333" color="#eeeeee">{' > '}{entry.input}{' '}</Text>
            <Text>{' '}</Text>
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

      {/* Current execution, panel, starting, or input */}
      {phase === 'starting' ? (
        <Box>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text> Starting…</Text>
        </Box>
      ) : phase === 'panel' && activePanelId?.startsWith('services:') && services ? (
        <ServicePanel
          services={services}
          serviceId={activePanelId.split(':')[1]}
          workdir={workdir}
          onExit={() => {
            setActivePanelId(null);
            setPhase('idle');
          }}
        />
      ) : phase === 'executing' ? (
        <Box flexDirection="column">
          <Text>{' '}</Text>
          <Text backgroundColor="#333333" color="#eeeeee">{' > '}{currentInput}{' '}</Text>
          <Text>{' '}</Text>
          {segments.length > 0 ? (
            <Box flexDirection="column">
              {segments.map((seg, i) => {
                const isLast = i === segments.length - 1;
                const windowSize = session.outputWindow ?? DEFAULT_OUTPUT_WINDOW;

                if (seg.type === 'text') {
                  if (!isLast) {
                    // Earlier text block: first line only, dimmed
                    return <Text key={i} dimColor>{seg.lines[0]}</Text>;
                  }
                  // Active text segment: render markdown incrementally
                  const rawText = seg.lines.join('\n');
                  return <Text key={i}>{renderMarkdown(rawText) || rawText}</Text>;
                }

                // Tool segment: header unindented, body indented with ⎿
                const header = seg.lines.slice(0, seg.headerLines);
                const body = seg.lines.slice(seg.headerLines);
                const visibleBody = body.slice(-windowSize);
                const hiddenCount = body.length - visibleBody.length;

                const parts: string[] = [];
                parts.push(...header);
                if (hiddenCount > 0) {
                  // ⎿ on the indicator, continuation indent on visible lines
                  parts.push(INDENT_FIRST + `\x1b[2m... (${hiddenCount} more lines)\x1b[0m`);
                  parts.push(...visibleBody.map(l => INDENT_REST + l));
                } else {
                  // ⎿ on first body line, continuation indent on rest
                  parts.push(...formatToolLines(visibleBody, columns));
                }

                const dimmed = seg.complete && !isLast;
                const leading = '\n';
                const trailing = seg.complete && !isLast ? '\n' : '';
                return <Text key={i} dimColor={dimmed}>{leading}{parts.join('\n')}{trailing}</Text>;
              })}
            </Box>
          ) : (
            <Box>
              <Text color="yellow">
                <Spinner type="dots" />
              </Text>
              <Text> Working…</Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="column">
          {/* Status lines from background services */}
          {statusLines.length > 0 && (
            <Box flexDirection="column" marginBottom={0}>
              {statusLines.map((line, i) => (
                <Text key={i} dimColor>{line}</Text>
              ))}
            </Box>
          )}
          <Text color="green">{'─'.repeat(columns)}</Text>
          <Box>
            <Text color={promptLabel ? "cyan" : "green"}>
              {promptLabel ? `${promptLabel}: ` : '> '}
            </Text>
            <TextInput
              value={input}
              onChange={handleChange}
              onSubmit={handleSubmit}
              cursorOffset={cursorOffset}
              focus={terminalFocused}
              suggestion={inlineSuggestion}
            />
          </Box>
          <Text color="green">{'─'.repeat(columns)}</Text>
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
