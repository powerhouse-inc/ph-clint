import { z } from 'zod';

export const configSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
  switchboardPort: z.number().default(4001).describe('Switchboard GraphQL port'),
  connectPort: z.number().default(3000).describe('Connect UI port'),
  pruneLength: z.number().default(200).describe('Max messages kept in agent-chat document'),
});

export type Config = z.infer<typeof configSchema>;
