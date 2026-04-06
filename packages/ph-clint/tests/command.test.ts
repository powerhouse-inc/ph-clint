import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { defineCommand } from '../src/core/command.js';
import { createMemoryWorkspace } from '../src/core/workspace.js';

describe('defineCommand', () => {
  const cmd = defineCommand({
    id: 'test-cmd',
    description: 'A test command',
    inputSchema: z.object({
      name: z.string().describe('A name'),
      count: z.number().default(1).describe('Repeat count'),
    }),
    execute: async ({ name, count }) => `${name} x${count}`,
  });

  it('preserves id and description', () => {
    expect(cmd.id).toBe('test-cmd');
    expect(cmd.description).toBe('A test command');
  });

  it('preserves the input schema', () => {
    const shape = cmd.inputSchema.shape;
    expect(shape).toHaveProperty('name');
    expect(shape).toHaveProperty('count');
  });

  it('executes with parsed input', async () => {
    const ctx = { workspace: createMemoryWorkspace(), config: {} };
    const result = await cmd.execute({ name: 'Alice', count: 3 }, ctx);
    expect(result).toBe('Alice x3');
  });
});
