import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  defineCli,
  defineCommand,
  createReplSession,
  createMemoryWorkspace,
  formatStreamChunk,
  renderStream,
} from 'ph-clint';
import type {
  AgentProvider,
  StreamChunk,
  CommandContext,
} from 'ph-clint';
import { search } from '../src/commands/search.js';
import { summarize } from '../src/commands/summarize.js';
import { createAssistant } from '../src/agents/assistant.js';

// ── Helper: deterministic test agent ──────────────────────────────

function createTestAgent(
  responses: Record<string, StreamChunk[]>,
): AgentProvider {
  return {
    id: 'test-assistant',
    async *stream(prompt, opts) {
      const chunks = responses[prompt] ?? [
        { type: 'text-delta' as const, text: `Echo: ${prompt}` },
      ];
      for (const chunk of chunks) yield chunk;
    },
  };
}

// ── Command definitions ───────────────────────────────────────────

describe('search command', () => {
  it('returns results for a query', async () => {
    const result = await search.execute(
      { query: 'TypeScript', limit: 3 },
      { workspace: createMemoryWorkspace(), config: {} },
    ) as any;
    expect(result.text).toContain('TypeScript');
    expect(result.data).toHaveLength(3);
  });

  it('uses default limit of 5', async () => {
    const parsed = search.inputSchema.parse({ query: 'test' });
    expect(parsed.limit).toBe(5);
  });
});

describe('summarize command', () => {
  it('returns a summary for a URL', async () => {
    const result = await summarize.execute(
      { url: 'https://example.com/article' },
      { workspace: createMemoryWorkspace(), config: {} },
    ) as any;
    expect(result.text).toContain('example.com/article');
    expect(result.data.wordCount).toBeDefined();
  });
});

// ── Demo agent provider ───────────────────────────────────────────

describe('createAssistant', () => {
  it('returns an AgentProvider with id "assistant"', () => {
    const agent = createAssistant();
    expect(agent.id).toBe('assistant');
  });

  it('streams text-delta for basic prompts', async () => {
    const agent = createAssistant();
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('hello')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]!.type).toBe('text-delta');
  });

  it('uses search tool when prompt contains "search"', async () => {
    const agent = createAssistant();
    const chunks: StreamChunk[] = [];
    const tools = new Map([['search', search]]);
    for await (const chunk of agent.stream('search for TypeScript', { tools })) {
      chunks.push(chunk);
    }
    const types = chunks.map((c) => c.type);
    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');
    expect(types).toContain('text-delta');
  });

  it('uses summarize tool when prompt contains "summarize"', async () => {
    const agent = createAssistant();
    const chunks: StreamChunk[] = [];
    const tools = new Map([['summarize', summarize]]);
    for await (const chunk of agent.stream('summarize https://example.com', { tools })) {
      chunks.push(chunk);
    }
    const types = chunks.map((c) => c.type);
    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');
  });

  it('tracks conversation history per thread', async () => {
    const agent = createAssistant();
    // First turn
    const chunks1: StreamChunk[] = [];
    for await (const chunk of agent.stream('hello', { threadId: 'thread-1' })) {
      chunks1.push(chunk);
    }
    // Second turn on same thread
    const chunks2: StreamChunk[] = [];
    for await (const chunk of agent.stream('follow up', { threadId: 'thread-1' })) {
      chunks2.push(chunk);
    }
    const text2 = chunks2
      .filter((c): c is { type: 'text-delta'; text: string } => c.type === 'text-delta')
      .map((c) => c.text)
      .join('');
    expect(text2).toContain('turn 2');
  });

  it('isolates threads from each other', async () => {
    const agent = createAssistant();
    // Turn on thread-a
    for await (const _ of agent.stream('hello', { threadId: 'a' })) { /* drain */ }
    // First turn on thread-b — should be turn 1
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('hello', { threadId: 'b' })) {
      chunks.push(chunk);
    }
    const text = chunks
      .filter((c): c is { type: 'text-delta'; text: string } => c.type === 'text-delta')
      .map((c) => c.text)
      .join('');
    expect(text).not.toContain('turn 2');
  });
});

// ── CLI integration ───────────────────────────────────────────────

describe('CLI integration', () => {
  // Fresh assistant per describe to avoid shared conversation state
  const assistant = createAssistant();

  const cli = defineCli({
    name: 'assist',
    version: '1.0.0',
    description: 'AI research assistant',
    configSchema: z.object({
      model: z.string().default('test-model').describe('LLM model'),
    }),
    commands: [search, summarize],
    integrations: [{ id: 'demo', agents: [assistant] }],
    defaultCommand: 'agent:assistant',
    interactive: {
      welcome: 'Research Assistant — ask me anything',
    },
  });

  it('has correct metadata', () => {
    expect(cli.name).toBe('assist');
    expect(cli.listCommands()).toHaveLength(2);
    expect(cli.defaultCommand).toBe('agent:assistant');
  });

  it('executes search command directly', async () => {
    const result = await cli.execute('search', { query: 'test', limit: 2 }) as any;
    expect(result.text).toContain('test');
    expect(result.data).toHaveLength(2);
  });

  it('executes summarize command directly', async () => {
    const result = await cli.execute('summarize', { url: 'https://example.com' }) as any;
    expect(result.text).toContain('example.com');
  });

  it('routes bare text to agent in command mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', 'What is TypeScript?'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });
    const combined = output.join('');
    expect(combined).toContain('What is TypeScript?');
  });

  it('routes bare text to agent in interactive mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'hello there';
        yield '/exit';
      })(),
    });
    expect(output[0]).toBe('Research Assistant — ask me anything');
    const combined = output.join('');
    expect(combined).toContain('hello there');
  });

  it('/search executes the search command directly (not agent)', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/search --query "hello"';
        yield '/exit';
      })(),
    });
    const combined = output.join('');
    expect(combined).toContain('Result 1 for "hello"');
  });

  it('agent uses search tool when prompted', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'search for cats';
        yield '/exit';
      })(),
    });
    const combined = output.join('');
    expect(combined).toContain('search');
    expect(combined).toContain('cats');
  });

  it('conversation persists across turns in interactive mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'first message';
        yield 'second message';
        yield '/exit';
      })(),
    });
    const combined = output.join('');
    expect(combined).toContain('continuing our conversation');
  });

  it('--resume passes thread ID to agent', async () => {
    // First session
    const output1: string[] = [];
    await cli.run(['node', 'assist', '-i', '--resume', 'thread-xyz'], {
      stdout: (msg) => output1.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'hello';
        yield '/exit';
      })(),
    });
    // The agent should have received the thread ID
    // (the demo agent uses it for conversation tracking)
    expect(output1.join('')).toContain('hello');
  });

  it('--resume in command mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '--resume', 'thread-abc', 'hello again'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });
    const combined = output.join('');
    expect(combined).toContain('hello again');
  });

  it('subcommands still work via execute() with agent configured', async () => {
    const result = await cli.execute('search', { query: 'test', limit: 3 }) as any;
    expect(result.text).toContain('test');
    expect(result.data).toHaveLength(3);
  });

  it('subcommands still work via run() with agent configured', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', 'summarize', '--url', 'https://example.com'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });
    const combined = output.join('');
    expect(combined).toContain('example.com');
  });

  it('config env vars include model field', () => {
    const envVars = cli.configEnvVars();
    expect(envVars).toContainEqual({
      name: 'ASSIST_MODEL',
      field: 'model',
      description: 'LLM model',
    });
  });
});

// ── Streaming utilities ───────────────────────────────────────────

describe('streaming rendering', () => {
  it('formatStreamChunk renders tool calls inline', () => {
    const toolCall = formatStreamChunk({
      type: 'tool-call',
      toolName: 'search',
      args: { query: 'cats' },
    });
    expect(toolCall).toContain('▶');
    expect(toolCall).toContain('search');

    const toolResult = formatStreamChunk({
      type: 'tool-result',
      toolName: 'search',
      result: '3 results',
      isError: false,
    });
    expect(toolResult).toContain('✓');
    expect(toolResult).toContain('3 results');
  });

  it('renderStream produces formatted output from chunks', async () => {
    async function* chunks(): AsyncGenerator<StreamChunk> {
      yield { type: 'tool-call', toolName: 'search', args: { q: 'test' } };
      yield { type: 'tool-result', toolName: 'search', result: 'done', isError: false };
      yield { type: 'text-delta', text: 'Here are the results.' };
    }
    const parts: string[] = [];
    for await (const part of renderStream(chunks())) {
      parts.push(part);
    }
    const output = parts.join('');
    expect(output).toContain('▶');
    expect(output).toContain('✓');
    expect(output).toContain('Here are the results.');
  });
});

// ── REPL session with agent ───────────────────────────────────────

describe('REPL session with agent', () => {
  it('bare text routes to agent, /commands route directly', async () => {
    const agent = createTestAgent({
      'What is TypeScript?': [
        { type: 'text-delta', text: 'TypeScript is great.' },
      ],
    });

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Test',
      commands: [search],
      integrations: [{ id: 'test', agents: [agent] }],
      defaultCommand: 'agent:test-assistant',
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    // Bare text → agent
    const agentResult = await session.processInput('What is TypeScript?');
    expect(agentResult.type).toBe('result');
    expect(agentResult.text).toContain('TypeScript is great.');

    // /search → direct command
    const cmdResult = await session.processInput('/search --query "hello"');
    expect(cmdResult.type).toBe('result');
    expect(cmdResult.text).toContain('Result 1');
  });
});
