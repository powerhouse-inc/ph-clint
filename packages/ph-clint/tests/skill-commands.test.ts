import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { createSkillCommands, isSkillInvocation } from '../src/core/skill-commands.js';
import type { SkillInfo } from '../src/core/skills.js';
import { createMemoryWorkdirStore } from '../src/core/store.js';
import { getSchemaFields } from '../src/core/schema.js';

const mockSkills: SkillInfo[] = [
  { name: 'document-modeling', description: 'Design document model schemas', skillMdPath: '/skills/document-modeling/SKILL.md' },
  { name: 'fusion-development', description: 'Build Fusion UI pages', skillMdPath: '/skills/fusion-development/SKILL.md' },
];

describe('createSkillCommands', () => {
  it('creates a command for each skill', () => {
    const cmds = createSkillCommands(mockSkills);
    expect(cmds).toHaveLength(2);
    expect(cmds[0]!.id).toBe('document-modeling');
    expect(cmds[1]!.id).toBe('fusion-development');
  });

  it('uses skill description as command description', () => {
    const cmds = createSkillCommands(mockSkills);
    expect(cmds[0]!.description).toBe('Design document model schemas');
  });

  it('uses fallback description when skill has none', () => {
    const cmds = createSkillCommands([{ name: 'empty', description: '', skillMdPath: '/s/empty/SKILL.md' }]);
    expect(cmds[0]!.description).toBe('Use the empty skill');
  });

  it('execute returns a SkillInvocation', async () => {
    const cmds = createSkillCommands(mockSkills);
    const ctx = { workdir: '/tmp', workspace: createMemoryWorkdirStore(), config: {}, stdout: () => {} };
    const result = await cmds[0]!.execute({}, ctx);
    expect(result).toMatchObject({
      type: 'skill-invocation',
      skillName: 'document-modeling',
      userMessage: undefined,
    });
    expect(result.inputValues).toEqual({});
  });

  it('execute passes prompt as userMessage', async () => {
    const cmds = createSkillCommands(mockSkills);
    const ctx = { workdir: '/tmp', workspace: createMemoryWorkdirStore(), config: {}, stdout: () => {} };
    const result = await cmds[0]!.execute({ prompt: 'Create an invoice model' }, ctx);
    expect(result).toMatchObject({
      type: 'skill-invocation',
      skillName: 'document-modeling',
      userMessage: 'Create an invoice model',
    });
  });

  it('returns empty array for empty skills', () => {
    const cmds = createSkillCommands([]);
    expect(cmds).toEqual([]);
  });

  it('uses SkillConfig description over SKILL.md description', () => {
    const cmds = createSkillCommands(mockSkills, {
      'document-modeling': { description: 'Custom description' },
    });
    expect(cmds[0]!.description).toBe('Custom description');
    expect(cmds[1]!.description).toBe('Build Fusion UI pages'); // unchanged
  });

  it('accepts plain string as SkillConfig shorthand', () => {
    const cmds = createSkillCommands(mockSkills, {
      'document-modeling': 'Short description',
    });
    expect(cmds[0]!.description).toBe('Short description');
  });

  it('passes instructionTemplate through to SkillInvocation', async () => {
    const cmds = createSkillCommands(mockSkills, {
      'document-modeling': {
        description: 'Custom',
        instructionTemplate: 'Do {{skillId}}: {{prompt}}',
      },
    });
    const ctx = { workdir: '/tmp', workspace: createMemoryWorkdirStore(), config: {}, stdout: () => {} };
    const result = await cmds[0]!.execute({ prompt: 'test' }, ctx);
    expect(result.instructionTemplate).toBe('Do {{skillId}}: {{prompt}}');
  });

  it('merges custom inputSchema fields with base prompt field', () => {
    const cmds = createSkillCommands(mockSkills, {
      'document-modeling': {
        description: 'Custom',
        inputSchema: z.object({
          mode: z.string().default('conversational').describe('Execution mode'),
        }),
      },
    });
    // Should have both prompt and mode fields
    const fields = getSchemaFields(cmds[0]!.inputSchema);
    const fieldNames = fields.map(f => f.key);
    expect(fieldNames).toContain('prompt');
    expect(fieldNames).toContain('mode');
  });

  it('includes extra input values in SkillInvocation', async () => {
    const cmds = createSkillCommands(mockSkills, {
      'document-modeling': {
        description: 'Custom',
        inputSchema: z.object({
          mode: z.string().default('one-shot').describe('Mode'),
        }),
      },
    });
    const ctx = { workdir: '/tmp', workspace: createMemoryWorkdirStore(), config: {}, stdout: () => {} };
    const result = await cmds[0]!.execute({ prompt: 'test', mode: 'one-shot' }, ctx);
    expect(result.inputValues).toEqual({ prompt: 'test', mode: 'one-shot' });
  });
});

describe('isSkillInvocation', () => {
  it('returns true for valid SkillInvocation objects', () => {
    expect(isSkillInvocation({ type: 'skill-invocation', skillName: 'test' })).toBe(true);
    expect(isSkillInvocation({ type: 'skill-invocation', skillName: 'test', userMessage: 'hi' })).toBe(true);
  });

  it('returns false for non-SkillInvocation values', () => {
    expect(isSkillInvocation(null)).toBe(false);
    expect(isSkillInvocation(undefined)).toBe(false);
    expect(isSkillInvocation('string')).toBe(false);
    expect(isSkillInvocation(42)).toBe(false);
    expect(isSkillInvocation({ type: 'other' })).toBe(false);
    expect(isSkillInvocation({})).toBe(false);
  });
});
