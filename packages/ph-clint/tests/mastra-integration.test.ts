import { describe, it, expect, afterAll, afterEach } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { createMastraHelpers } from '../src/integrations/mastra/index.js';
import { commandsToMastraTools } from '../src/integrations/mastra/tools.js';
import { mapMastraStream } from '../src/integrations/mastra/stream.js';
import { createMemoryWorkdirStore } from '../src/core/store.js';
import type { AgentSetupContext, ServiceInstanceStatus, ServiceManager } from '../src/core/types.js';

const testWorkspace = join(tmpdir(), `ph-clint-mastra-test-${randomBytes(4).toString('hex')}`);

afterAll(async () => {
  try { await rm(testWorkspace, { recursive: true }); } catch {}
});

const echoCommand = defineCommand({
  id: 'echo',
  description: 'Echo input back',
  inputSchema: z.object({ text: z.string() }),
  execute: async (input) => ({ text: input.text }),
});

function makeAgentSetupContext(overrides?: Partial<AgentSetupContext>): AgentSetupContext {
  const workdir = overrides?.workdir ?? testWorkspace;
  return {
    workdir,
    config: {},
    cliName: 'test-cli',
    cliVersion: '1.0.0',
    context: { workdir, workspace: createMemoryWorkdirStore(), config: {}, stdout: () => {} },
    commands: [echoCommand],
    skills: [],
    ...overrides,
  };
}

describe('createMastraHelpers', () => {
  it('returns an object with getTools, createWorkspace, createMemory, wrapAgent', () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    expect(typeof helpers.getTools).toBe('function');
    expect(typeof helpers.createWorkspace).toBe('function');
    expect(typeof helpers.createMemory).toBe('function');
    expect(typeof helpers.wrapAgent).toBe('function');
  });

  it('getTools converts commands to Mastra tools', async () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const tools = await helpers.getTools();
    expect(Object.keys(tools)).toEqual(['echo']);
    expect(tools.echo).toBeDefined();
  });

  it('getTools returns empty object when no commands', async () => {
    const helpers = createMastraHelpers(makeAgentSetupContext({ commands: [] }));
    const tools = await helpers.getTools();
    expect(tools).toEqual({});
  });

  it('createWorkspace returns a Mastra Workspace', async () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const workspace = await helpers.createWorkspace();
    expect(workspace).toBeDefined();
  });

  it('createMemory creates LibSQL-backed memory and db directory', async () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const memory = await helpers.createMemory();
    expect(memory).toBeDefined();
    // Verify the database directory was created
    expect(existsSync(join(testWorkspace, '.ph', 'test-cli', '.mastra', 'db'))).toBe(true);
  });

  it('wrapAgent wraps a mock agent as AgentProvider', () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const mockAgent = { id: 'mock-agent' };
    const provider = helpers.wrapAgent(mockAgent);
    expect(provider.id).toBe('mock-agent');
    expect(typeof provider.stream).toBe('function');
  });

  it('wrapAgent defaults id to "default" when agent has no id', () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const provider = helpers.wrapAgent({});
    expect(provider.id).toBe('default');
  });

  describe('wrapAgent with logging', () => {
    let logDir: string;

    afterEach(async () => {
      if (logDir) {
        try { await rm(logDir, { recursive: true }); } catch {}
      }
    });

    function createStreamingAgent(chunks: Array<{ type: string; [key: string]: unknown }>, opts?: { instructions?: string; getInstructions?: () => Promise<string> }) {
      return {
        id: 'log-agent',
        name: 'Log Agent',
        instructions: opts?.instructions,
        getInstructions: opts?.getInstructions,
        async stream(_prompt: string, _opts?: unknown) {
          return {
            fullStream: (async function* () {
              for (const chunk of chunks) yield chunk;
            })(),
          };
        },
      };
    }

    it('logs session with instructions from agent.instructions', async () => {
      logDir = join(tmpdir(), `ph-clint-log-test-${randomBytes(4).toString('hex')}`);
      const helpers = createMastraHelpers(makeAgentSetupContext());
      const agent = createStreamingAgent(
        [{ type: 'text-delta', textDelta: 'hello' }],
        { instructions: 'You are a helpful assistant' },
      );
      const provider = helpers.wrapAgent(agent, {
        enableLogging: true,
        logDirectory: logDir,
      });

      const chunks: any[] = [];
      for await (const chunk of provider.stream('test prompt', { threadId: 'log-thread' })) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('text-delta');

      // Log file should have been created
      const files = await readdir(logDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('logs session with getInstructions() function', async () => {
      logDir = join(tmpdir(), `ph-clint-log-test-${randomBytes(4).toString('hex')}`);
      const helpers = createMastraHelpers(makeAgentSetupContext());
      const agent = createStreamingAgent(
        [{ type: 'text-delta', textDelta: 'response' }],
        { getInstructions: async () => 'dynamic instructions' },
      );
      const provider = helpers.wrapAgent(agent, {
        enableLogging: true,
        logDirectory: logDir,
      });

      const chunks: any[] = [];
      for await (const chunk of provider.stream('hello')) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(1);
    });

    it('handles getInstructions() throwing gracefully', async () => {
      logDir = join(tmpdir(), `ph-clint-log-test-${randomBytes(4).toString('hex')}`);
      const helpers = createMastraHelpers(makeAgentSetupContext());
      const agent = createStreamingAgent(
        [{ type: 'text-delta', textDelta: 'ok' }],
        { getInstructions: async () => { throw new Error('no instructions'); } },
      );
      const provider = helpers.wrapAgent(agent, {
        enableLogging: true,
        logDirectory: logDir,
      });

      const chunks: any[] = [];
      for await (const chunk of provider.stream('hello')) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(1);
    });

    it('logs error when stream throws', async () => {
      logDir = join(tmpdir(), `ph-clint-log-test-${randomBytes(4).toString('hex')}`);
      const helpers = createMastraHelpers(makeAgentSetupContext());
      const errorAgent = {
        id: 'err-agent',
        name: 'Error Agent',
        async stream() {
          return {
            fullStream: (async function* () {
              yield { type: 'text-delta', textDelta: 'partial' };
              throw new Error('stream exploded');
            })(),
          };
        },
      };
      const provider = helpers.wrapAgent(errorAgent, {
        enableLogging: true,
        logDirectory: logDir,
      });

      const chunks: any[] = [];
      await expect(async () => {
        for await (const chunk of provider.stream('hello')) {
          chunks.push(chunk);
        }
      }).rejects.toThrow('stream exploded');

      // Should have collected the partial chunk before the error
      expect(chunks).toHaveLength(1);
    });
  });
});

describe('mapMastraStream', () => {
  it('maps error chunks', async () => {
    async function* fakeStream() {
      yield { type: 'error', error: 'API rate limit' };
    }
    const chunks: any[] = [];
    for await (const chunk of mapMastraStream(fakeStream())) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0].type).toBe('error');
    expect(chunks[0].error).toContain('API rate limit');
  });

  it('maps error chunk with payload format', async () => {
    async function* fakeStream() {
      yield { type: 'error', payload: { error: 'wrapped error' } };
    }
    const chunks: any[] = [];
    for await (const chunk of mapMastraStream(fakeStream())) {
      chunks.push(chunk);
    }
    expect(chunks[0].error).toContain('wrapped error');
  });

  it('falls back to stringifying chunk when error field is missing', async () => {
    async function* fakeStream() {
      yield { type: 'error' };
    }
    const chunks: any[] = [];
    for await (const chunk of mapMastraStream(fakeStream())) {
      chunks.push(chunk);
    }
    expect(chunks[0].type).toBe('error');
    expect(chunks[0].error).toContain('object');
  });

  it('ignores unknown chunk types', async () => {
    async function* fakeStream() {
      yield { type: 'step-finish', data: {} };
      yield { type: 'text-delta', textDelta: 'hello' };
    }
    const chunks: any[] = [];
    for await (const chunk of mapMastraStream(fakeStream())) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('hello');
  });
});

describe('getTools with MCP discovery', () => {
  function makeMockServiceManager(instances: ServiceInstanceStatus[]): ServiceManager {
    return {
      start: async () => '',
      stop: async () => {},
      list: () => instances,
      getDefinition: () => undefined,
      logs: () => '',
      watchLogs: () => () => {},
      scanProjects: () => [],
      purgeStoppedInstances: () => {},
    };
  }

  it('getTools({ includeMcp: false }) returns only CLI tools', async () => {
    const ctx = makeAgentSetupContext();
    // Add a mock service manager with an api-mcp endpoint
    ctx.context.services = makeMockServiceManager([{
      serviceId: 'test',
      instanceId: 'test',
      name: 'Test',
      status: 'ready',
      endpoints: { 'mcp-server': 'http://localhost:4567/mcp' },
      endpointTypes: { 'mcp-server': 'api-mcp' },
    }]);

    const helpers = createMastraHelpers(ctx);
    const tools = await helpers.getTools({ includeMcp: false });
    // Should only have CLI tools, not MCP tools
    expect(Object.keys(tools)).toEqual(['echo']);
  });

  it('getTools() returns CLI tools when no services manager', async () => {
    const helpers = createMastraHelpers(makeAgentSetupContext());
    const tools = await helpers.getTools();
    expect(Object.keys(tools)).toEqual(['echo']);
  });

  it('getTools() returns CLI tools when services have no api-mcp endpoints', async () => {
    const ctx = makeAgentSetupContext();
    ctx.context.services = makeMockServiceManager([{
      serviceId: 'test',
      instanceId: 'test',
      name: 'Test',
      status: 'ready',
      endpoints: { 'web': 'http://localhost:3000' },
      endpointTypes: { 'web': 'website' },
    }]);

    const helpers = createMastraHelpers(ctx);
    const tools = await helpers.getTools();
    expect(Object.keys(tools)).toEqual(['echo']);
  });

  it('getTools() throws when api-mcp service is ready but no MCPClient provided', async () => {
    const ctx = makeAgentSetupContext();
    ctx.context.services = makeMockServiceManager([{
      serviceId: 'test',
      instanceId: 'test',
      name: 'Test',
      status: 'ready',
      endpoints: { 'mcp-server': 'http://localhost:4567/mcp' },
      endpointTypes: { 'mcp-server': 'api-mcp' },
    }]);

    const helpers = createMastraHelpers(ctx);
    await expect(helpers.getTools()).rejects.toThrow(/MCPClient/);
  });

  it('getTools({ includeMcp: false }) skips error even with api-mcp services', async () => {
    const ctx = makeAgentSetupContext();
    ctx.context.services = makeMockServiceManager([{
      serviceId: 'test',
      instanceId: 'test',
      name: 'Test',
      status: 'ready',
      endpoints: { 'mcp-server': 'http://localhost:4567/mcp' },
      endpointTypes: { 'mcp-server': 'api-mcp' },
    }]);

    const helpers = createMastraHelpers(ctx);
    const tools = await helpers.getTools({ includeMcp: false });
    expect(Object.keys(tools)).toEqual(['echo']);
  });

  it('getTools() returns CLI tools when services are not ready', async () => {
    const ctx = makeAgentSetupContext();
    ctx.context.services = makeMockServiceManager([{
      serviceId: 'test',
      instanceId: 'test',
      name: 'Test',
      status: 'starting',
      endpoints: { 'mcp-server': 'http://localhost:4567/mcp' },
      endpointTypes: { 'mcp-server': 'api-mcp' },
    }]);

    const helpers = createMastraHelpers(ctx);
    const tools = await helpers.getTools();
    expect(Object.keys(tools)).toEqual(['echo']);
  });
});

describe('commandsToMastraTools', () => {
  it('converts ph-clint commands to Mastra tools', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkdirStore(), config: {}, workdir: '', stdout: () => {} },
    );
    expect(Object.keys(tools)).toEqual(['echo']);
    expect(tools.echo).toBeDefined();
  });

  it('returns empty object for empty commands', async () => {
    const tools = await commandsToMastraTools(
      [],
      { workspace: createMemoryWorkdirStore(), config: {}, workdir: '', stdout: () => {} },
    );
    expect(tools).toEqual({});
  });

  it('tool execute calls the original command', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkdirStore(), config: {}, workdir: '', stdout: () => {} },
    );
    const tool = tools.echo;
    const result = await tool.execute!({ text: 'hello' }, {} as any);
    expect(result).toEqual({ text: 'hello' });
  });
});
