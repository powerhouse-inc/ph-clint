import { describe, it, expect, afterAll } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { createMastraHelpers } from '../src/integrations/mastra/index.js';
import { commandsToMastraTools } from '../src/integrations/mastra/tools.js';
import { createMemoryWorkspace } from '../src/core/workspace.js';
import type { AgentContext } from '../src/core/types.js';

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

function makeAgentContext(overrides?: Partial<AgentContext>): AgentContext {
  const workdir = overrides?.workdir ?? testWorkspace;
  return {
    workdir,
    config: {},
    cliName: 'test-cli',
    cliVersion: '1.0.0',
    context: { workdir, workspace: createMemoryWorkspace(), config: {}, stdout: () => {} },
    commands: [echoCommand],
    ...overrides,
  };
}

describe('createMastraHelpers', () => {
  it('returns an object with getTools, createWorkspace, createMemory, wrapAgent', () => {
    const helpers = createMastraHelpers(makeAgentContext());
    expect(typeof helpers.getTools).toBe('function');
    expect(typeof helpers.createWorkspace).toBe('function');
    expect(typeof helpers.createMemory).toBe('function');
    expect(typeof helpers.wrapAgent).toBe('function');
  });

  it('getTools converts commands to Mastra tools', async () => {
    const helpers = createMastraHelpers(makeAgentContext());
    const tools = await helpers.getTools();
    expect(Object.keys(tools)).toEqual(['echo']);
    expect(tools.echo).toBeDefined();
  });

  it('getTools returns empty object when no commands', async () => {
    const helpers = createMastraHelpers(makeAgentContext({ commands: [] }));
    const tools = await helpers.getTools();
    expect(tools).toEqual({});
  });

  it('createWorkspace returns a Mastra Workspace', async () => {
    const helpers = createMastraHelpers(makeAgentContext());
    const workspace = await helpers.createWorkspace();
    expect(workspace).toBeDefined();
  });

  it('createMemory creates LibSQL-backed memory and db directory', async () => {
    const helpers = createMastraHelpers(makeAgentContext());
    const memory = await helpers.createMemory();
    expect(memory).toBeDefined();
    // Verify the database directory was created
    expect(existsSync(join(testWorkspace, '.ph', 'test-cli', 'mastra'))).toBe(true);
  });

  it('wrapAgent wraps a mock agent as AgentProvider', () => {
    const helpers = createMastraHelpers(makeAgentContext());
    const mockAgent = { id: 'mock-agent' };
    const provider = helpers.wrapAgent(mockAgent);
    expect(provider.id).toBe('mock-agent');
    expect(typeof provider.stream).toBe('function');
  });

  it('wrapAgent defaults id to "default" when agent has no id', () => {
    const helpers = createMastraHelpers(makeAgentContext());
    const provider = helpers.wrapAgent({});
    expect(provider.id).toBe('default');
  });
});

describe('commandsToMastraTools', () => {
  it('converts ph-clint commands to Mastra tools', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} },
    );
    expect(Object.keys(tools)).toEqual(['echo']);
    expect(tools.echo).toBeDefined();
  });

  it('returns empty object for empty commands', async () => {
    const tools = await commandsToMastraTools(
      [],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} },
    );
    expect(tools).toEqual({});
  });

  it('tool execute calls the original command', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '', stdout: () => {} },
    );
    const tool = tools.echo as { execute: (input: unknown) => Promise<unknown> };
    const result = await tool.execute({ text: 'hello' });
    expect(result).toEqual({ text: 'hello' });
  });
});
