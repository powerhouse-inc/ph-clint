import { createTypes } from 'ph-clint';
import { z } from 'zod';

export const configSchema = z.object({
  watchDir: z.string().default('./src').describe('Directory to watch'),
  buildCommand: z.string().default('npm run build').describe('Build command to execute'),
});

export type Config = z.infer<typeof configSchema>;

export const { defineCommand, defineTrigger } = createTypes({ configSchema });
