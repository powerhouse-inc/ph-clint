import { createTypes } from '@powerhousedao/ph-clint';
import { z } from 'zod';

export const configSchema = z.object({
  defaultPriority: z.enum(['low', 'medium', 'high']).default('medium')
    .describe('Default priority for new tasks'),
});

export type Config = z.infer<typeof configSchema>;

export const { defineCommand } = createTypes({ configSchema });
