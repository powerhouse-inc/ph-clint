import { createTypes } from 'ph-clint';
import { z } from 'zod';
import { configSchema, secretsSchema } from './config.js';

const fullConfigSchema = configSchema.merge(secretsSchema);
export type Config = z.infer<typeof fullConfigSchema>;

export const { defineCommand, defineService } = createTypes({
  configSchema: fullConfigSchema,
});

// Re-export schemas for cli.ts and mastra/index.ts
export { configSchema, secretsSchema } from './config.js';
