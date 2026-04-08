import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineCli, defineCommand, defineService, createServiceManager, createEventBus, createMemoryWorkdirStore, formatStreamChunk, renderStream } from 'ph-clint';
import type { ServiceDefinition, StreamChunk } from 'ph-clint';
import { z } from 'zod';
import { weather } from '../src/commands/weather.js';
import { createDemoAgent } from '../src/agents/demo-agent.js';

const FIXTURE = path.resolve(import.meta.dirname, 'fixtures/test-server.js');

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-vetra-mastra-'));
}

function safeKill(pid: number): void {
  try { process.kill(-pid, 'SIGKILL'); } catch { /* ignore */ }
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
}

function collectPids(servicesDir: string): number[] {
  const pids: number[] = [];
  try {
    for (const f of fs.readdirSync(servicesDir)) {
      if (f.endsWith('.json')) {
        try {
          const state = JSON.parse(fs.readFileSync(path.join(servicesDir, f), 'utf-8'));
          if (state.pid) pids.push(state.pid);
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  return pids;
}

// ── Vetra service definition using test fixture ─────────────────

const vetraDef: ServiceDefinition = defineService({
  id: 'vetra',
  label: 'Vetra Dev Server',
  command: `node ${FIXTURE}`,
  env: (config: any) => ({
    PORT: String(config.switchboardPort ?? 4001),
    TEST_SERVICE_MODE: 'vetra',
  }),
  readiness: {
    patterns: [
      {
        name: 'connect-port',
        pattern: /Local:\s*http:\/\/localhost:(\d+)/,
        captures: { 'connect-studio': 1 },
      },
      {
        name: 'drive-url',
        pattern: /Drive URL:\s*(https?:\/\/[^\s]+)/,
        captures: { 'drive-url': 1 },
      },
      {
        name: 'mcp-server',
        pattern: /MCP server available at (https?:\/\/[^\s]+)/,
        captures: { 'mcp-server': 1 },
      },
    ],
    timeout: 5000,
  },
  shutdown: { signal: 'SIGTERM', timeout: 3000 },
  restart: { enabled: true, maxRetries: 3, delay: 2000 },
});

// ── Weather command ─────────────────────────────────────────────

describe('weather command', () => {
  it('has correct schema', () => {
    expect(weather.id).toBe('weather');
    expect(weather.description).toBe('Get current weather for a location');
    const parsed = weather.inputSchema.parse({ location: 'Amsterdam' });
    expect(parsed.location).toBe('Amsterdam');
  });

  it('rejects missing location', () => {
    expect(() => weather.inputSchema.parse({})).toThrow();
  });
});

// ── Demo agent ──────────────────────────────────────────────────

describe('createDemoAgent', () => {
  it('returns an AgentProvider with id "rupert"', () => {
    const agent = createDemoAgent();
    expect(agent.id).toBe('rupert');
  });

  it('streams text-delta for basic prompts', async () => {
    const agent = createDemoAgent();
    const chunks: StreamChunk[] = [];
    for await (const chunk of agent.stream('hello')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]!.type).toBe('text-delta');
  });

  it('tracks conversation history per thread', async () => {
    const agent = createDemoAgent();
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
    const agent = createDemoAgent();
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

  it('routes weather queries to weather tool', async () => {
    const agent = createDemoAgent();
    const chunks: StreamChunk[] = [];
    const tools = new Map([['weather', weather]]);
    for await (const chunk of agent.stream('what is the weather in Amsterdam', { tools })) {
      chunks.push(chunk);
    }
    const types = chunks.map((c) => c.type);
    expect(types).toContain('tool-call');
    expect(types).toContain('tool-result');
    expect(types).toContain('text-delta');
  }, 15_000);
});

// ── CLI integration ─────────────────────────────────────────────

describe('CLI integration', () => {
  let tmpDir: string;
  let servicesDir: string;
  let trackedPids: number[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    servicesDir = path.join(tmpDir, '.ph', 'vetra-mastra', 'services');
    trackedPids = [];
  });

  afterEach(() => {
    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    const pids = [...trackedPids, ...collectPids(svcDir), ...collectPids(servicesDir)];
    for (const pid of pids) {
      safeKill(pid);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const demoAgent = createDemoAgent();

  const cli = defineCli({
    name: 'vetra-mastra',
    version: '1.0.0',
    description: 'Vetra Mastra test',
    configSchema: z.object({
      switchboardPort: z.number().default(4001),
    }),
    commands: [weather],
    services: [vetraDef],
    agent: {
      default: async () => demoAgent,
    },
    interactive: {
      welcome: 'Vetra Mastra — demo mode',
    },
  });

  it('has correct metadata', () => {
    expect(cli.name).toBe('vetra-mastra');
    expect(cli.hasAgent).toBe(true);
    const commands = cli.listCommands();
    expect(commands.map((c: any) => c.id)).toContain('weather');
  });

  it('executes weather command via CLI', async () => {
    const output: string[] = [];
    await cli.run(['node', 'vetra-mastra', 'weather', '--location', 'London'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });
    const combined = output.join('');
    // Weather command produces formatted text with city name and conditions
    expect(combined).toContain('Weather in London');
  }, 15_000);

  it('routes bare text to agent in command mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'vetra-mastra', 'Hello Rupert'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });
    const combined = output.join('');
    expect(combined).toContain('Hello Rupert');
  });

  it('routes bare text to agent in interactive mode', async () => {
    const output: string[] = [];
    await cli.run(['node', 'vetra-mastra', '-i'], {
      stdout: (msg) => output.push(msg),
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
      interactiveInput: (async function* () {
        yield 'hello there';
        yield '/exit';
      })(),
    });
    expect(output[0]).toBe('Vetra Mastra — demo mode');
    const combined = output.join('');
    expect(combined).toContain('hello there');
  });

  it('services are available in CommandContext', async () => {
    let hasServices = false;

    const checkCmd = defineCommand({
      id: 'check',
      description: 'Check context',
      inputSchema: z.object({}),
      execute: async (_, ctx) => {
        hasServices = ctx.services !== undefined;
        return { text: hasServices ? 'yes' : 'no' };
      },
    });

    const testCli = defineCli({
      name: 'vetra-mastra',
      version: '1.0.0',
      description: 'test',
      commands: [checkCmd],
      services: [vetraDef],
    });

    await testCli.run(['node', 'vetra-mastra', 'check'], {
      stdout: () => {},
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    expect(hasServices).toBe(true);
  });

  it('event handlers fire on service:ready and service:stopped', async () => {
    const events: string[] = [];

    const startCmd = defineCommand({
      id: 'start-svc',
      description: 'Start vetra',
      inputSchema: z.object({}),
      execute: async (_, { services }) => {
        await services!.start('vetra');
        return { text: 'started' };
      },
    });

    const stopCmd = defineCommand({
      id: 'stop-svc',
      description: 'Stop vetra',
      inputSchema: z.object({}),
      execute: async (_, { services }) => {
        await services!.stop('vetra');
        return { text: 'stopped' };
      },
    });

    const testCli = defineCli({
      name: 'vetra-mastra',
      version: '1.0.0',
      description: 'test',
      commands: [startCmd, stopCmd],
      services: [vetraDef],
      events: {
        'service:ready': () => events.push('ready'),
        'service:stopped': () => events.push('stopped'),
        'service:pattern-matched': (e) => events.push(`matched:${e.name}`),
      },
    });

    await testCli.run(['node', 'vetra-mastra', 'start-svc'], {
      stdout: () => {},
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    expect(events).toContain('ready');
    expect(events).toContain('matched:connect-port');
    expect(events).toContain('matched:drive-url');
    expect(events).toContain('matched:mcp-server');

    // Collect PIDs for cleanup
    const svcDir = path.join(tmpDir, '.ph', 'svc', 'services');
    trackedPids.push(...collectPids(svcDir));

    await testCli.run(['node', 'vetra-mastra', 'stop-svc'], {
      stdout: () => {},
      stderr: () => {},
      exit: () => {},
      workdir: tmpDir,
    });

    expect(events).toContain('stopped');
  });
});

// ── MCP client ──────────────────────────────────────────────────

describe('MCP client', () => {
  it('returns empty tools when disconnected', async () => {
    const { getMcpTools } = await import('../src/mcp/client.js');
    const tools = await getMcpTools();
    expect(tools).toEqual({});
  });
});
