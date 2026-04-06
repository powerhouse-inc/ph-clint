import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { defineCommand, getCompletions, getCommandSignature, applyCompletion } from '../src/index.js';

describe('getCompletions', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone',
    inputSchema: z.object({
      name: z.string().describe('Name'),
      loud: z.boolean().default(false).describe('Shout'),
    }),
    execute: async ({ name, loud }) => (loud ? `HELLO, ${name}!` : `Hello, ${name}!`),
  });

  const list = defineCommand({
    id: 'list',
    description: 'List items',
    inputSchema: z.object({
      filter: z.enum(['all', 'open', 'done']).default('open').describe('Filter'),
    }),
    execute: async () => 'items',
  });

  const commands = [greet, list];

  describe('command name completion', () => {
    it('completes partial command name', () => {
      expect(getCompletions('/gr', commands)).toEqual(['/greet']);
    });

    it('completes with all matches', () => {
      const result = getCompletions('/l', commands);
      expect(result).toContain('/list');
    });

    it('completes / with all commands and builtins', () => {
      const result = getCompletions('/', commands);
      expect(result).toContain('/greet');
      expect(result).toContain('/list');
      expect(result).toContain('/help');
      expect(result).toContain('/exit');
    });

    it('returns empty for no match', () => {
      expect(getCompletions('/xyz', commands)).toEqual([]);
    });

    it('returns empty for non-/ input', () => {
      expect(getCompletions('hello', commands)).toEqual([]);
    });
  });

  describe('flag name completion', () => {
    it('completes flag names for a command', () => {
      expect(getCompletions('/greet --na', commands)).toEqual(['--name']);
    });

    it('completes all flags for --', () => {
      const result = getCompletions('/greet --', commands);
      expect(result).toContain('--name');
      expect(result).toContain('--loud');
    });
  });

  describe('enum value completion', () => {
    it('completes enum values for a flag', () => {
      expect(getCompletions('/list --filter d', commands)).toEqual(['done']);
    });

    it('completes all enum values for empty prefix', () => {
      const result = getCompletions('/list --filter ', commands);
      expect(result).toContain('all');
      expect(result).toContain('open');
      expect(result).toContain('done');
    });

    it('returns empty for non-enum field', () => {
      expect(getCompletions('/greet --name A', commands)).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('returns empty for unknown command args', () => {
      expect(getCompletions('/unknown --foo', commands)).toEqual([]);
    });

    it('returns empty for bare value after command (no -- prefix)', () => {
      expect(getCompletions('/greet foo', commands)).toEqual([]);
    });

    it('returns empty for unknown field in enum lookup', () => {
      expect(getCompletions('/list --nonexistent x', commands)).toEqual([]);
    });

    it('returns empty for empty input', () => {
      expect(getCompletions('', commands)).toEqual([]);
    });

    it('returns empty when completing value after non-flag arg', () => {
      // e.g. "/greet Alice --" — prevPart is "Alice" (not --flag), lastPart is "--"
      // This exercises the prevPart branch when it doesn't start with --
      expect(getCompletions('/greet Alice', commands)).toEqual([]);
    });

    it('handles completion with only two parts (command + partial flag)', () => {
      // Two parts: command + flag prefix
      expect(getCompletions('/greet --n', commands)).toEqual(['--name']);
    });
  });
});

describe('applyCompletion', () => {
  it('replaces entire input for command completion', () => {
    expect(applyCompletion('/gr', '/greet')).toBe('/greet');
  });

  it('replaces last token for flag completion', () => {
    expect(applyCompletion('/greet --na', '--name')).toBe('/greet --name');
  });

  it('replaces last token for enum value completion', () => {
    expect(applyCompletion('/list --filter d', 'done')).toBe('/list --filter done');
  });

  it('replaces when input has trailing partial after space', () => {
    expect(applyCompletion('/list --filter ', 'open')).toBe('/list --filter open');
  });

  it('handles single slash', () => {
    expect(applyCompletion('/', '/help')).toBe('/help');
  });

  it('preserves leading content for multi-token input', () => {
    expect(applyCompletion('/greet --name Alice --lo', '--loud')).toBe('/greet --name Alice --loud');
  });
});

describe('getCommandSignature', () => {
  const greet = defineCommand({
    id: 'greet',
    description: 'Greet someone',
    inputSchema: z.object({
      name: z.string().describe('Name'),
      loud: z.boolean().default(false).describe('Shout'),
    }),
    execute: async () => 'hi',
  });

  const list = defineCommand({
    id: 'list',
    description: 'List items',
    inputSchema: z.object({
      filter: z.enum(['all', 'open', 'done']).default('open').describe('Filter'),
    }),
    execute: async () => 'items',
  });

  const noop = defineCommand({
    id: 'noop',
    description: 'No-op',
    inputSchema: z.object({}),
    execute: async () => null,
  });

  const multi = defineCommand({
    id: 'multi',
    description: 'Multi',
    inputSchema: z.object({
      required: z.string().describe('Required field'),
      optional: z.string().optional().describe('Optional field'),
      withDefault: z.string().default('x').describe('Defaulted field'),
    }),
    execute: async () => null,
  });

  const commands = [greet, list, noop, multi];

  it('shows required string args without brackets', () => {
    const sig = getCommandSignature('/greet', commands);
    expect(sig).toContain('--name <name>');
  });

  it('shows optional/defaulted boolean args in brackets', () => {
    const sig = getCommandSignature('/greet', commands);
    expect(sig).toContain('[--loud]');
  });

  it('shows defaulted value args in brackets', () => {
    const sig = getCommandSignature('/list', commands);
    expect(sig).toBe('[--filter <filter>]');
  });

  it('shows mixed required and optional args', () => {
    const sig = getCommandSignature('/multi', commands);
    expect(sig).toBe('--required <required> [--optional <optional>] [--withDefault <withDefault>]');
  });

  it('returns null when args are already present', () => {
    expect(getCommandSignature('/greet --name', commands)).toBeNull();
  });

  it('returns null for unknown command', () => {
    expect(getCommandSignature('/unknown', commands)).toBeNull();
  });

  it('returns null for non-command input', () => {
    expect(getCommandSignature('hello', commands)).toBeNull();
  });

  it('returns null for command with no args', () => {
    expect(getCommandSignature('/noop', commands)).toBeNull();
  });

  it('handles trailing space after command name', () => {
    // Trailing space should not count as having args
    // (the split would produce ['', ''] but trimEnd removes it)
    const sig = getCommandSignature('/greet ', commands);
    // After trimEnd, input is '/greet' — should show signature
    expect(sig).toContain('--name <name>');
  });
});
