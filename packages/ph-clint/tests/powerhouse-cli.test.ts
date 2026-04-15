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
  it('does NOT call setup() for plain subcommands (lazy initialization)', async () => {
    const setupFn = jest.fn<(ctx: CommandContext) => Promise<void>>();
    const integration: Integration = {
      id: 'test',
      setup: setupFn,
    };

    const cli = createTestCli([integration]);
    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'noop'], out);

    // Subcommands don't trigger integration setup — it's lazy
    expect(setupFn).not.toHaveBeenCalled();
  });

  it('does NOT call teardown() for plain subcommands', async () => {
    const teardownFn = jest.fn<() => Promise<void>>();
    const integration: Integration = {
      id: 'test',
      teardown: teardownFn,
    };

    const cli = createTestCli([integration]);
    const out = captureOutput();
    await cli.run(['node', 'test-ph', 'noop'], out);

    expect(teardownFn).not.toHaveBeenCalled();
  });

  it('calls setup in interactive mode and teardown on exit', async () => {
    const order: string[] = [];
    const integration: Integration = {
      id: 'test',
      async setup() { order.push('setup'); },
      async teardown() { order.push('teardown'); },
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

    expect(order).toEqual(['setup', 'teardown']);
  });

  it('calls multiple integrations in order (setup) and reverse (teardown) in interactive mode', async () => {
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

    const cli = defineCli({
      name: 'test-ph',
      version: '0.0.1',
      description: 'Test CLI',
      commands: [noopCommand],
      integrations: [int1, int2],
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

    expect(order).toEqual(['setup-1', 'setup-2', 'teardown-2', 'teardown-1']);
  });

  it('integration can mutate context.powerhouse in setup() (visible in interactive mode)', async () => {
    let capturedContext: CommandContext | undefined;

    const integration: Integration = {
      id: 'powerhouse',
      async setup(ctx) {
        ctx.powerhouse = { client: { fake: true }, driveId: 'test-drive', async shutdown() {} };
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
      interactive: { welcome: 'hi' },
    });

    const out = captureOutput();
    async function* inputGen() {
      yield '/check';
      yield '/exit';
    }
    await cli.run(['node', 'test-ph', '-i'], {
      ...out,
      interactiveInput: inputGen(),
    });

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
});
