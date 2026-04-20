import { createTypes } from '@powerhousedao/ph-clint';
import { z } from 'zod';

export const configSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
});

export type Config = z.infer<typeof configSchema>;

export const { defineCommand } = createTypes({ configSchema });
