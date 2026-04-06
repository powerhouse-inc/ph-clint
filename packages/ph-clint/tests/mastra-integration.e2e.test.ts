/**
 * E2E test for the Mastra integration — calls a real LLM.
 *
 * Requires ANTHROPIC_API_KEY in environment or examples/04-chat-assistant/.env.
 * Skipped automatically when no key is available.
 */
import { describe, it, expect, afterAll } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { defineMastraIntegration } from '../src/integrations/mastra/index.js';
import type { StreamChunk } from '../src/core/types.js';

// Load .env from example 04 (no dotenv dependency)
try {
  // Try both relative paths (running from packages/ph-clint/ or repo root)
  const candidates = [
    resolve(import.meta.dirname, '../../examples/04-chat-assistant/.env'),
    resolve(import.meta.dirname, '../../../examples/04-chat-assistant/.env'),
  ];
  const envPath = candidates.find((p) => { try { readFileSync(p); return true; } catch { return false; } })!;
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
  // .env not found — rely on environment
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const describeWithKey = apiKey ? describe : describe.skip;

const testWorkspace = join(tmpdir(), `ph-clint-e2e-${randomBytes(4).toString('hex')}`);

afterAll(async () => {
  try { await rm(testWorkspace, { recursive: true }); } catch {}
});

const echoCommand = defineCommand({
  id: 'echo',
  description: 'Echo the input text back',
  inputSchema: z.object({ text: z.string().describe('Text to echo') }),
  execute: async (input) => ({ text: input.text }),
});

describeWithKey('Mastra integration E2E', () => {
  it('streams a text response from the real LLM', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'e2e-agent', instructions: 'Reply in exactly 3 words.' }],
      commands: [echoCommand],
      workspacePath: testWorkspace,
    });

    const agent = integration.agents![0]!;
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('Say hello.')) {
      chunks.push(chunk);
    }

    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => (c as { type: 'text-delta'; text: string }).text)
      .join('');
    expect(text.length).toBeGreaterThan(0);
  }, 30_000);

  it('streams with threadId for memory persistence', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'memory-agent', instructions: 'Be concise.' }],
      workspacePath: testWorkspace,
    });

    const agent = integration.agents![0]!;
    const threadId = `e2e-${Date.now()}`;

    // Drain first turn
    for await (const _ of agent.stream('Hello.', { threadId })) {}

    // Second turn on same thread
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('What did I just say?', { threadId })) {
      chunks.push(chunk);
    }

    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => (c as { type: 'text-delta'; text: string }).text)
      .join('');
    expect(text.length).toBeGreaterThan(0);
  }, 30_000);
});
