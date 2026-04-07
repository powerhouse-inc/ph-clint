import { describe, it, expect, afterAll } from '@jest/globals';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { defineMastraIntegration } from '../src/integrations/mastra/index.js';
import { commandsToMastraTools } from '../src/integrations/mastra/tools.js';
import { createMemoryWorkspace } from '../src/core/workspace.js';

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

describe('defineMastraIntegration', () => {
  it('returns an Integration with id "mastra"', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'test-agent', instructions: 'You are a test agent.' }],
    });
    expect(integration.id).toBe('mastra');
    expect(integration.agents).toHaveLength(1);
    expect(integration.agents![0]!.id).toBe('test-agent');
  });

  it('creates agents with correct IDs', async () => {
    const integration = await defineMastraIntegration({
      agents: [
        { id: 'agent-a', instructions: 'Agent A' },
        { id: 'agent-b', instructions: 'Agent B' },
      ],
    });
    const ids = integration.agents!.map((a) => a.id);
    expect(ids).toEqual(['agent-a', 'agent-b']);
  });

  it('works without commands', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'no-tools', instructions: 'No tools' }],
    });
    expect(integration.agents).toHaveLength(1);
  });

  it('accepts commands to expose as tools', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'with-tools', instructions: 'Has tools' }],
      commands: [echoCommand],
    });
    expect(integration.agents).toHaveLength(1);
  });

  it('creates workspace directories when workspacePath is provided', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'ws-agent', instructions: 'Workspace agent' }],
      workspacePath: testWorkspace,
    });
    expect(integration.agents).toHaveLength(1);
    // Verify the Mastra db directory was created
    expect(existsSync(join(testWorkspace, 'mastra', 'db'))).toBe(true);
  });

  it('works without workspacePath (no persistence)', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'ephemeral', instructions: 'No workspace' }],
    });
    expect(integration.agents).toHaveLength(1);
  });
});

describe('agent stream method', () => {
  it('agent provider has a stream generator', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'stream-test', instructions: 'Test' }],
      workspacePath: testWorkspace,
    });
    const agent = integration.agents![0]!;
    expect(typeof agent.stream).toBe('function');
    // The stream method is an async generator — verify it returns an iterable
    // (Actually calling it would require an API key, so we just test the shape)
  });

  it('creates cli workspace with basePath when workspacePath provided', async () => {
    const integration = await defineMastraIntegration({
      agents: [{ id: 'bp-test', instructions: 'Test' }],
      commands: [echoCommand],
      workspacePath: testWorkspace,
    });
    expect(integration.agents).toHaveLength(1);
  });
});

describe('commandsToMastraTools', () => {
  it('converts ph-clint commands to Mastra tools', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '' },
    );
    expect(Object.keys(tools)).toEqual(['echo']);
    expect(tools.echo).toBeDefined();
  });

  it('returns empty object for empty commands', async () => {
    const tools = await commandsToMastraTools(
      [],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '' },
    );
    expect(tools).toEqual({});
  });

  it('tool execute calls the original command', async () => {
    const tools = await commandsToMastraTools(
      [echoCommand],
      { workspace: createMemoryWorkspace(), config: {}, workdir: '' },
    );
    const tool = tools.echo as { execute: (input: unknown) => Promise<unknown> };
    const result = await tool.execute({ text: 'hello' });
    expect(result).toEqual({ text: 'hello' });
  });
});
