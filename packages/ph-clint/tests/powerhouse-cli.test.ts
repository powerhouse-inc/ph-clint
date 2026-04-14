import { describe, it, expect, jest } from '@jest/globals';
import { defineCli } from '../src/core/cli.js';
import { defineCommand } from '../src/core/command.js';
import { z } from 'zod';
import type { Integration, CommandContext } from '../src/core/types.js';

const noopCommand = defineCommand({
  id: 'noop',
  description: 'Does nothing',
  inputSchema: z.object({}),
  execute: async () => undefined,
});

function createTestCli(integrations: Integration[]) {
  return defineCli({
    name: 'test-ph',
    version: '0.0.1',
    description: 'Test CLI',
    commands: [noopCommand],
    integrations,
  });
}

function captureOutput() {
  const lines: string[] = [];
  return {
    lines,
    stdout: (text: string) => lines.push(text),
    stderr: (text: string) => lines.push(`[err] ${text}`),
    exit: () => {},
  };
}

describe('integration lifecycle in cli.ts', () => {
  it('calls setup() on integration during run()', async () => {
    const setupFn = jest.fn<(ctx: CommandContext) => Promise<void>>();
    const integration: Integration = {
      id: 'test',
      setup: setupFn,
    };

    const cli = createTestCli([integration]);
    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'noop'], out);

    expect(setupFn).toHaveBeenCalledTimes(1);
    expect(setupFn.mock.calls[0][0]).toHaveProperty('workdir');
    expect(setupFn.mock.calls[0][0]).toHaveProperty('workspace');
    expect(setupFn.mock.calls[0][0]).toHaveProperty('config');
  });

  it('calls teardown() on integration after command execution', async () => {
    const teardownFn = jest.fn<() => Promise<void>>();
    const integration: Integration = {
      id: 'test',
      teardown: teardownFn,
    };

    const cli = createTestCli([integration]);
    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'noop'], out);

    expect(teardownFn).toHaveBeenCalledTimes(1);
  });

  it('calls setup before command execution and teardown after', async () => {
    const order: string[] = [];
    const integration: Integration = {
      id: 'test',
      async setup() { order.push('setup'); },
      async teardown() { order.push('teardown'); },
    };

    const cmd = defineCommand({
      id: 'track',
      description: 'Tracks order',
      inputSchema: z.object({}),
      execute: async () => { order.push('execute'); return undefined; },
    });

    const cli = defineCli({
      name: 'test-ph',
      version: '0.0.1',
      description: 'Test CLI',
      commands: [cmd],
      integrations: [integration],
    });

    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'track'], out);

    expect(order).toEqual(['setup', 'execute', 'teardown']);
  });

  it('calls multiple integrations in order (setup) and reverse (teardown)', async () => {
    const order: string[] = [];
    const int1: Integration = {
      id: 'first',
      async setup() { order.push('setup-1'); },
      async teardown() { order.push('teardown-1'); },
    };
    const int2: Integration = {
      id: 'second',
      async setup() { order.push('setup-2'); },
      async teardown() { order.push('teardown-2'); },
    };

    const cli = createTestCli([int1, int2]);
    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'noop'], out);

    expect(order).toEqual(['setup-1', 'setup-2', 'teardown-2', 'teardown-1']);
  });

  it('integration can mutate context.powerhouse in setup()', async () => {
    let capturedContext: CommandContext | undefined;

    const integration: Integration = {
      id: 'powerhouse',
      async setup(ctx) {
        ctx.powerhouse = { client: { fake: true }, driveId: 'test-drive' };
      },
    };

    const cmd = defineCommand({
      id: 'check',
      description: 'Check context',
      inputSchema: z.object({}),
      execute: async (_input, ctx) => {
        capturedContext = ctx;
        return undefined;
      },
    });

    const cli = defineCli({
      name: 'test-ph',
      version: '0.0.1',
      description: 'Test CLI',
      commands: [cmd],
      integrations: [integration],
    });

    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'check'], out);

    expect(capturedContext?.powerhouse).toBeDefined();
    expect(capturedContext?.powerhouse?.driveId).toBe('test-drive');
    expect(capturedContext?.powerhouse?.client).toEqual({ fake: true });
  });

  it('hasReactor is true when powerhouse integration is present', () => {
    const integration: Integration = { id: 'powerhouse' };
    const cli = createTestCli([integration]);
    const meta = cli.getMetadata();
    expect(meta.hasReactor).toBe(true);
  });

  it('hasReactor is false when no powerhouse integration', () => {
    const cli = createTestCli([]);
    const meta = cli.getMetadata();
    expect(meta.hasReactor).toBe(false);
  });

  it('hasReactor is false when integration has different id', () => {
    const integration: Integration = { id: 'other' };
    const cli = createTestCli([integration]);
    const meta = cli.getMetadata();
    expect(meta.hasReactor).toBe(false);
  });

  it('handles integration without setup/teardown gracefully', async () => {
    const integration: Integration = { id: 'minimal' };
    const cli = createTestCli([integration]);
    const out = captureOutput();
    // Should not throw
    await cli.run(['node', 'test-ph', 'noop'], out);
  });

  it('teardown runs in interactive mode exit path', async () => {
    const teardownFn = jest.fn<() => Promise<void>>();
    const integration: Integration = {
      id: 'test',
      teardown: teardownFn,
    };

    const cli = defineCli({
      name: 'test-ph',
      version: '0.0.1',
      description: 'Test CLI',
      commands: [noopCommand],
      integrations: [integration],
      interactive: { welcome: 'hi' },
    });

    const out = captureOutput();
    async function* inputGen() {
      yield '/exit';
    }
    await cli.run(['node', 'test-ph', '-i'], {
      ...out,
      interactiveInput: inputGen(),
    });

    expect(teardownFn).toHaveBeenCalledTimes(1);
  });
});
