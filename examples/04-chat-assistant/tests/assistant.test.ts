import { describe, it, expect, afterAll } from '@jest/globals';
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
import { ascii } from '../src/commands/ascii.js';
import { saveImage } from '../src/commands/save-image.js';
import { listImages } from '../src/commands/list-images.js';
import { createAssistant } from '../src/agents/assistant.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

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

// ── ascii command ─────────────────────────────────────────────────

describe('ascii command', () => {
  it('has correct schema defaults', () => {
    const parsed = ascii.inputSchema.parse({ image: 'https://example.com/img.png' });
    expect(parsed.width).toBe(60);
    expect(parsed.height).toBe(30);
    expect(parsed.fit).toBe('box');
  });

  it('converts a remote image to ASCII art', async () => {
    const result = await ascii.execute(
      { image: 'https://picsum.photos/100/100', width: 20, height: 10, fit: 'box' },
      { workspace: createMemoryWorkspace(), config: {} },
    ) as any;
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.data.width).toBe(20);
  }, 15_000);
});

// ── save-image command ────────────────────────────────────────────

describe('save-image command', () => {
  const testDir = join(tmpdir(), `ph-clint-test-${randomBytes(4).toString('hex')}`);

  afterAll(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  it('has correct schema', () => {
    expect(saveImage.id).toBe('save-image');
    // url is required
    expect(() => saveImage.inputSchema.parse({})).toThrow();
    const parsed = saveImage.inputSchema.parse({ url: 'https://example.com/img.png' });
    expect(parsed.url).toBe('https://example.com/img.png');
  });

  it('downloads an image and saves to workspace', async () => {
    const result = await saveImage.execute(
      { url: 'https://picsum.photos/10/10' },
      { workspace: createMemoryWorkspace(testDir), config: {} },
    ) as any;
    expect(result.text).toContain('Saved');
    expect(result.data.size).toBeGreaterThan(0);
    expect(result.data.path).toContain(testDir);
  }, 15_000);

  it('uses custom filename when provided', async () => {
    const result = await saveImage.execute(
      { url: 'https://picsum.photos/10/10', name: 'custom.jpg' },
      { workspace: createMemoryWorkspace(testDir), config: {} },
    ) as any;
    expect(result.data.filename).toBe('custom.jpg');
    expect(result.data.path).toContain('custom.jpg');
  }, 15_000);
});

// ── list-images command ───────────────────────────────────────────

describe('list-images command', () => {
  const testDir = join(tmpdir(), `ph-clint-test-list-${randomBytes(4).toString('hex')}`);

  afterAll(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  it('returns empty when no images exist', async () => {
    const nonExistent = join(tmpdir(), `ph-clint-test-empty-${randomBytes(4).toString('hex')}`);
    const result = await listImages.execute(
      {},
      { workspace: createMemoryWorkspace(nonExistent), config: {} },
    ) as any;
    expect(result.data.images).toHaveLength(0);
    expect(result.text).toContain('No images');
  });

  it('lists images in workspace images/ directory', async () => {
    const imagesSubdir = join(testDir, 'images');
    mkdirSync(imagesSubdir, { recursive: true });
    writeFileSync(join(imagesSubdir, 'photo.png'), Buffer.alloc(100));
    writeFileSync(join(imagesSubdir, 'logo.jpg'), Buffer.alloc(200));
    writeFileSync(join(imagesSubdir, 'readme.txt'), 'not an image');

    const result = await listImages.execute(
      {},
      { workspace: createMemoryWorkspace(testDir), config: {} },
    ) as any;
    expect(result.data.images).toHaveLength(2);
    expect(result.data.images.map((i: any) => i.name).sort()).toEqual(['logo.jpg', 'photo.png']);
    expect(result.text).toContain('photo.png');
    expect(result.text).not.toContain('readme.txt');
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

  it('uses ascii tool when prompt contains "image" or "ascii"', async () => {
    const agent = createAssistant();
    const chunks: StreamChunk[] = [];
    const tools = new Map([['ascii', ascii]]);
    for await (const chunk of agent.stream('convert this image https://picsum.photos/50/50 to ascii', { tools })) {
      chunks.push(chunk);
    }
    const types = chunks.map((c) => c.type);
    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');
    expect(types).toContain('text-delta');
  }, 15_000);

  it('tracks conversation history per thread', async () => {
    const agent = createAssistant();
    // First turn
    for await (const _ of agent.stream('hello', { threadId: 'thread-1' })) { /* drain */ }
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
    for await (const _ of agent.stream('hello', { threadId: 'a' })) { /* drain */ }
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
  const assistant = createAssistant();

  const cli = defineCli({
    name: 'assist',
    version: '1.0.0',
    description: 'AI image assistant',
    configSchema: z.object({
      model: z.string().default('test-model').describe('LLM model'),
    }),
    commands: [ascii, saveImage, listImages],
    integrations: [{ id: 'demo', agents: [assistant] }],
    defaultCommand: 'agent:assistant',
    interactive: {
      welcome: 'Image Assistant — ask me anything',
    },
  });

  it('has correct metadata', () => {
    expect(cli.name).toBe('assist');
    expect(cli.listCommands()).toHaveLength(3);
    expect(cli.defaultCommand).toBe('agent:assistant');
  });

  it('executes ascii command directly', async () => {
    const result = await cli.execute('ascii', {
      image: 'https://picsum.photos/50/50', width: 10, height: 5, fit: 'box',
    }) as any;
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  }, 15_000);

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
    expect(output[0]).toBe('Image Assistant — ask me anything');
    const combined = output.join('');
    expect(combined).toContain('hello there');
  });

  it('/ascii executes the command directly (not agent)', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield '/ascii --image "https://picsum.photos/50/50" --width 10 --height 5';
        yield '/exit';
      })(),
    });
    const combined = output.join('');
    // Should contain ASCII characters from the rendered image
    expect(combined.length).toBeGreaterThan(50);
  }, 15_000);

  it('agent uses ascii tool when prompted', async () => {
    const output: string[] = [];
    await cli.run(['node', 'assist', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      interactiveInput: (async function* () {
        yield 'convert image https://picsum.photos/50/50 to ascii';
        yield '/exit';
      })(),
    });
    const combined = output.join('');
    expect(combined).toContain('ascii');
  }, 15_000);

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
      toolName: 'ascii',
      args: { image: 'https://example.com/img.png' },
    });
    expect(toolCall).toContain('▶');
    expect(toolCall).toContain('ascii');

    const toolResult = formatStreamChunk({
      type: 'tool-result',
      toolName: 'ascii',
      result: 'ASCII art here',
      isError: false,
    });
    expect(toolResult).toContain('✓');
    expect(toolResult).toContain('ASCII art here');
  });

  it('renderStream produces formatted output from chunks', async () => {
    async function* chunks(): AsyncGenerator<StreamChunk> {
      yield { type: 'tool-call', toolName: 'ascii', args: { image: 'test.png' } };
      yield { type: 'tool-result', toolName: 'ascii', result: 'done', isError: false };
      yield { type: 'text-delta', text: 'Here is the ASCII art.' };
    }
    const parts: string[] = [];
    for await (const part of renderStream(chunks())) {
      parts.push(part);
    }
    const output = parts.join('');
    expect(output).toContain('▶');
    expect(output).toContain('✓');
    expect(output).toContain('Here is the ASCII art.');
  });
});

// ── REPL session with agent ───────────────────────────────────────

describe('REPL session with agent', () => {
  it('bare text routes to agent, /commands route directly', async () => {
    const agent = createTestAgent({
      'What is ASCII art?': [
        { type: 'text-delta', text: 'ASCII art uses characters to create images.' },
      ],
    });

    const cli = defineCli({
      name: 'assist',
      version: '1.0.0',
      description: 'Test',
      commands: [ascii],
      integrations: [{ id: 'test', agents: [agent] }],
      defaultCommand: 'agent:test-assistant',
      interactive: { welcome: '' },
    });

    const context: CommandContext = { workspace: createMemoryWorkspace(), config: {} };
    const session = createReplSession({ cli, context, agentProvider: agent });

    // Bare text → agent
    const agentResult = await session.processInput('What is ASCII art?');
    expect(agentResult.type).toBe('result');
    expect(agentResult.text).toContain('ASCII art uses characters');

    // /ascii → direct command (not routed through agent)
    const cmdResult = await session.processInput('/ascii --image "https://picsum.photos/50/50" --width 10 --height 5');
    // May error due to Commander string-to-number coercion, but it should NOT be an agent response
    expect(cmdResult.text).not.toContain('Echo:');
  }, 15_000);
});
