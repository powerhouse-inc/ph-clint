import { useState, useCallback, useRef } from 'react';
import { Text, Box, Static, useInput, useApp, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { Markdown } from '../components/Markdown.js';
import { getCommand, getAllCommands } from '../commands/registry.js';
import type { HistoryEntry } from './types.js';

type Phase = 'idle' | 'executing';

function HelpText() {
  const commands = getAllCommands();
  return (
    <Box flexDirection="column">
      <Text bold>Available commands:</Text>
      {commands.map((cmd) => (
        <Text key={cmd.name}>  <Text color="cyan">/{cmd.name} {cmd.args}</Text>  {cmd.description}</Text>
      ))}
      <Text>  <Text color="cyan">/help</Text>           Show this help</Text>
      <Text>  <Text color="cyan">/exit</Text>           Exit the session</Text>
      <Text />
      <Text dimColor>Type anything else to chat with the agent.</Text>
    </Box>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>{' '}</Text>
      <Text backgroundColor="#333333" color="#eeeeee"> &gt; {entry.input} </Text>
      <Text>{' '}</Text>
      {entry.output ? <Markdown>{entry.output}</Markdown> : null}
    </Box>
  );
}

async function* promptAgent(prompt: string, threadId: string): AsyncGenerator<string, void, unknown> {
  const { iterateFullStream } = await import('../stream-utils.js');
  const { mastra, defaultAgentId } = await import('../mastra/index.js');
  const agent = mastra.getAgentById(defaultAgentId as any);
  const stream = await agent.stream(prompt, {
    maxSteps: 200,
    memory: {
      thread: threadId,
      resource: 'cli-user',
    },
  });

  yield* iterateFullStream(stream.fullStream);
}

export function Repl({ threadId }: { threadId: string }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 80;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [showHelp, setShowHelp] = useState(true);
  const nextId = useRef(0);
  const streamingRef = useRef('');

  useInput((_input, key) => {
    if (key.ctrl && _input === 'c') {
      console.log(`\nTo resume this session:\n  rupert -i --resume ${threadId}\n`);
      exit();
    }
  });

  const executeGenerator = useCallback(async (
    inputText: string,
    generator: AsyncGenerator<string, void, unknown>,
  ) => {
    setPhase('executing');
    streamingRef.current = '';
    setStreamingText('');

    try {
      for await (const chunk of generator) {
        streamingRef.current += chunk;
        setStreamingText(streamingRef.current);
      }
    } catch (err) {
      streamingRef.current += `\n\nError: ${err instanceof Error ? err.message : String(err)}`;
      setStreamingText(streamingRef.current);
    }

    setHistory((prev) => [
      ...prev,
      { id: nextId.current++, input: inputText, output: streamingRef.current },
    ]);
    setStreamingText('');
    setPhase('idle');
  }, []);

  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setInput('');
    setCurrentInput(trimmed);
    setShowHelp(false);

    // Built-in commands
    if (trimmed === '/exit' || trimmed === '/quit') {
      console.log(`\nTo resume this session:\n  rupert -i --resume ${threadId}\n`);
      exit();
      return;
    }

    if (trimmed === '/help') {
      setShowHelp(true);
      return;
    }

    // Slash commands → dispatch to registry
    const match = trimmed.match(/^\/(\S+)\s*(.*)/);
    if (match) {
      const [, cmdName, args] = match;
      const command = getCommand(cmdName!);

      if (!command) {
        setHistory((prev) => [
          ...prev,
          { id: nextId.current++, input: trimmed, output: `Unknown command: /${cmdName}. Type /help for available commands.` },
        ]);
        return;
      }

      await executeGenerator(trimmed, command.execute(args!));
      return;
    }

    // Unprefixed text → forward to default agent with thread context
    await executeGenerator(trimmed, promptAgent(trimmed, threadId));
  }, [exit, threadId, executeGenerator]);

  return (
    <Box flexDirection="column">
      <Static items={history}>
        {(entry) => <HistoryItem key={`h-${entry.id}`} entry={entry} />}
      </Static>

      {showHelp && phase === 'idle' && <HelpText />}

      {phase === 'executing' && (
        <Box flexDirection="column" marginBottom={1}>
          <Text>{' '}</Text>
          <Text backgroundColor="#333333" color="#eeeeee"> &gt; {currentInput} </Text>
          <Text>{' '}</Text>
          {streamingText ? (
            <Markdown>{streamingText}</Markdown>
          ) : (
            <Text><Spinner type="dots" /> Working…</Text>
          )}
        </Box>
      )}

      {phase === 'idle' && (
        <Box flexDirection="column">
          <Text color="green">{'─'.repeat(columns)}</Text>
          <Box>
            <Text color="green">&gt; </Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} focus={true} />
          </Box>
          <Text color="green">{'─'.repeat(columns)}</Text>
        </Box>
      )}
    </Box>
  );
}
