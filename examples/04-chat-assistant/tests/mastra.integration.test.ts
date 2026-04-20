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
  formatStreamChunk,
  createMemoryWorkdirStore,
} from '@powerhousedao/ph-clint';
import type { StreamChunk, AgentProvider, AgentSetupContext } from '@powerhousedao/ph-clint';
import { ascii } from '../src/commands/ascii.js';
import { saveImage } from '../src/commands/save-image.js';
import { listImages } from '../src/commands/list-images.js';

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
const commands = [ascii, saveImage, listImages];

const describeWithKey = apiKey ? describe : describe.skip;

describeWithKey('Mastra agent E2E', () => {
  let agentProvider: AgentProvider;

  beforeAll(async () => {
    const { createMastraHelpers } = await import('@powerhousedao/ph-clint/mastra');
    const { Agent } = await import('@mastra/core/agent');

    const ctx: AgentSetupContext = {
      workdir: '/tmp/ph-clint-test-e2e',
      config: {},
      cliName: 'assist',
      cliVersion: '1.0.0',
      context: { workdir: '/tmp/ph-clint-test-e2e', workspace: createMemoryWorkdirStore(), stdout: () => {}, config: {} },
      commands,
      skills: [],
    };
    const m = createMastraHelpers(ctx);

    agentProvider = m.wrapAgent(new Agent({
      id: 'assistant',
      name: 'Image Assistant',
      instructions: 'You are a helpful assistant with image tools. Keep responses concise.',
      model: 'anthropic/claude-haiku-4-5',
      tools: await m.getTools(),
      memory: await m.createMemory(),
    }));
  });

  it('streams a text response from the real LLM', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agentProvider.stream('Say hello in exactly 3 words.')) {
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

  it('agent calls the ascii tool when asked to convert an image', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agentProvider.stream(
      'Use the ascii tool to convert https://picsum.photos/100/100 to ASCII art. Just call the tool, nothing else.',
    )) {
      chunks.push(chunk);
    }

    const types = chunks.map((c) => c.type);
    console.log('Chunk types:', types);

    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');

    const toolCall = chunks.find((c) => c.type === 'tool-call') as {
      type: 'tool-call';
      toolName: string;
      args: unknown;
    };
    expect(toolCall.toolName).toBe('ascii');
  }, 60_000);

  it('formatStreamChunk renders tool calls and results', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of agentProvider.stream(
      'Use the ascii tool to convert https://picsum.photos/50/50 to ASCII. Just call the tool.',
    )) {
      chunks.push(chunk);
    }

    const formatted = chunks.map(formatStreamChunk).join('');
    console.log('Formatted output:\n', formatted);

    expect(formatted).toContain('▶');
    expect(formatted).toContain('ascii');
  }, 60_000);

  it('works end-to-end through defineCli + run()', async () => {
    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Test assistant',
      commands,
    });
    cli.configureAgent(async () => agentProvider);

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
      commands,
      interactive: { welcome: 'Hi!' },
    });
    cli.configureAgent(async () => agentProvider);

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

  it('remembers conversation context across turns with thread ID', async () => {
    const threadId = `test-memory-${Date.now()}`;

    // Turn 1: tell it something
    for await (const _ of agentProvider.stream('My favorite color is purple. Just acknowledge.', { threadId })) {}

    // Turn 2: ask it to recall
    const chunks: StreamChunk[] = [];
    for await (const chunk of agentProvider.stream('What is my favorite color?', { threadId })) {
      chunks.push(chunk);
    }
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => (c as { type: 'text-delta'; text: string }).text)
      .join('');
    console.log('Turn 2:', text);

    expect(text.toLowerCase()).toContain('purple');
  }, 60_000);
});
