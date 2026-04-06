/**
 * E2E integration test — calls a real Mastra agent via the Anthropic API.
 *
 * Requires ANTHROPIC_API_KEY in .env or environment.
 * These tests make real LLM calls and may take 5-15s each.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  defineCli,
  createReplSession,
  createMemoryWorkspace,
  formatStreamChunk,
} from 'ph-clint';
import type { StreamChunk, CommandContext } from 'ph-clint';
import { search } from '../src/commands/search.js';
import { summarize } from '../src/commands/summarize.js';
import { createMastraAssistant } from '../src/agents/mastra-assistant.js';

// Load .env from the example directory (no dotenv dependency)
try {
  const envPath = resolve(import.meta.dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env file not found — rely on environment variables
}

const apiKey = process.env.ANTHROPIC_API_KEY;

const describeWithKey = apiKey ? describe : describe.skip;

describeWithKey('Mastra agent E2E', () => {
  let agent: ReturnType<typeof createMastraAssistant>;

  beforeAll(() => {
    agent = createMastraAssistant({
      model: 'anthropic/claude-haiku-4-5',
      commands: [search, summarize],
    });
  });

  it('streams a text response from the real LLM', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('Say hello in exactly 3 words.')) {
      chunks.push(chunk);
    }

    const textChunks = chunks.filter((c) => c.type === 'text-delta');
    expect(textChunks.length).toBeGreaterThan(0);

    const fullText = textChunks
      .map((c) => (c as { type: 'text-delta'; text: string }).text)
      .join('');
    expect(fullText.length).toBeGreaterThan(0);
    console.log('Agent response:', fullText);
  }, 30_000);

  it('agent calls the search tool when asked to search', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream(
      'Use the search tool to search for "TypeScript". Just call the tool, nothing else.',
    )) {
      chunks.push(chunk);
    }

    const types = chunks.map((c) => c.type);
    console.log('Chunk types:', types);

    // Agent should have called the search tool
    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');

    const toolCall = chunks.find((c) => c.type === 'tool-call') as {
      type: 'tool-call';
      toolName: string;
      args: unknown;
    };
    expect(toolCall.toolName).toBe('search');

    // Should also have text output after the tool result
    const textChunks = chunks.filter((c) => c.type === 'text-delta');
    const fullText = textChunks
      .map((c) => (c as { type: 'text-delta'; text: string }).text)
      .join('');
    console.log('Agent response after tool:', fullText);
  }, 30_000);

  it('formatStreamChunk renders tool calls and results', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream(
      'Use the summarize tool to summarize https://example.com. Just call the tool.',
    )) {
      chunks.push(chunk);
    }

    // Format all chunks to display strings
    const formatted = chunks.map(formatStreamChunk).join('');
    console.log('Formatted output:\n', formatted);

    expect(formatted).toContain('▶'); // tool call indicator
    expect(formatted).toContain('summarize');
  }, 30_000);

  it('works end-to-end through defineCli + run()', async () => {
    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Test assistant',
      commands: [search, summarize],
      integrations: [{ id: 'mastra', agents: [agent] }],
      defaultCommand: 'agent:assistant',
    });

    const output: string[] = [];
    await cli.run(['node', 'assist', 'Say "hello world" and nothing else.'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
    });

    const combined = output.join('');
    console.log('CLI output:', combined);
    expect(combined.toLowerCase()).toContain('hello');
  }, 30_000);

  it('works through REPL session with agent routing', async () => {
    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Test assistant',
      commands: [search, summarize],
      integrations: [{ id: 'mastra', agents: [agent] }],
      defaultCommand: 'agent:assistant',
      interactive: { welcome: 'Hi!' },
    });

    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'Say "pong" and nothing else.';
        yield '/exit';
      })(),
    });

    const combined = output.join('');
    console.log('REPL output:', combined);
    expect(combined).toContain('Hi!');
    expect(combined.toLowerCase()).toContain('pong');
  }, 30_000);
});
