import { z } from 'zod';
import type { Command } from './types.js';
import type { SkillInfo } from './skills.js';

/**
 * A skill invocation result — returned by skill commands to signal
 * that the dispatch layer should route to the agent with a skill prefix.
 */
export interface SkillInvocation {
  type: 'skill-invocation';
  skillName: string;
  userMessage?: string;
}

/**
 * Type guard for SkillInvocation.
 */
export function isSkillInvocation(v: unknown): v is SkillInvocation {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Record<string, unknown>).type === 'skill-invocation'
  );
}

/**
 * Input schema for skill commands — a single optional --prompt flag.
 */
const skillInputSchema = z.object({
  prompt: z.string().optional().describe('Instructions for the skill'),
});

/**
 * Create CLI commands from skill metadata.
 * Each skill becomes a thin command with a --prompt flag that returns a SkillInvocation.
 */
export function createSkillCommands(skills: SkillInfo[]): Command<typeof skillInputSchema, SkillInvocation>[] {
  return skills.map((skill) => ({
    id: skill.name,
    description: skill.description || `Use the ${skill.name} skill`,
    inputSchema: skillInputSchema,
    execute: async (input: { prompt?: string }) => ({
      type: 'skill-invocation' as const,
      skillName: skill.name,
      userMessage: input.prompt,
    }),
  }));
}
