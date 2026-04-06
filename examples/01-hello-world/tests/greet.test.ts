import { describe, it, expect } from '@jest/globals';
import { createMemoryWorkspace } from 'ph-clint';
import { greet } from '../src/commands/greet.js';

const ctx = { workspace: createMemoryWorkspace(), config: {} };

describe('greet command', () => {
  describe('definition', () => {
    it('has the correct id', () => {
      expect(greet.id).toBe('greet');
    });

    it('has a description', () => {
      expect(greet.description).toBe('Greet someone by name');
    });

    it('has an inputSchema with name and loud fields', () => {
      const shape = greet.inputSchema.shape;
      expect(shape).toHaveProperty('name');
      expect(shape).toHaveProperty('loud');
    });
  });

  describe('execute', () => {
    it('greets by name', async () => {
      const result = await greet.execute({ name: 'Alice', loud: false }, ctx);
      expect(result).toBe('Hello, Alice!');
    });

    it('greets loudly when loud is true', async () => {
      const result = await greet.execute({ name: 'Alice', loud: true }, ctx);
      expect(result).toBe('HELLO, ALICE!');
    });

    it('defaults loud to false', async () => {
      const parsed = greet.inputSchema.parse({ name: 'Bob' });
      const result = await greet.execute(parsed, ctx);
      expect(result).toBe('Hello, Bob!');
    });
  });
});
