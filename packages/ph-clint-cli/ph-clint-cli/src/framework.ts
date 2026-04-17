/**
 * Per-CLI typed framework binding.
 *
 * This file is USER-OWNED. ph-clint-cli emits it once at project creation
 * and never overwrites it afterwards — edit `configSchema` and
 * `secretsSchema` freely.
 *
 * Typed factories (`defineCommand`, `defineTrigger`, ...) and the document
 * `registry` come from `framework.gen.ts`, which IS regenerated whenever
 * the spec's `documentTypes` list changes.
 */
import { z } from 'zod';
import { createTypes } from 'ph-clint';
import { registry } from './framework.gen.js';

export const configSchema = z.object({
  model: z
    .string()
    .default('anthropic/claude-haiku-4-5')
    .describe('LLM model to use'),
  connectPort: z
    .number()
    .default(3001)
    .describe('Connect UI port for ph-clint itself'),
  switchboardPort: z
    .number()
    .default(4802)
    .describe('Switchboard port for ph-clint itself'),
  devServicePort: z
    .number()
    .default(3000)
    .describe(
      'Port reserved for the impl project (Service B) `pnpm dev`',
    ),
  phVersion: z
    .string()
    .default('6.0.0-dev.170')
    .describe(
      'Pinned Powerhouse version used when emitting a new impl project',
    ),
  projectDocumentId: z
    .string()
    .optional()
    .describe(
      'ID of the powerhouse/ph-clint-project document that drives codegen (set on first regen; edit to switch projects)',
    ),
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
});

export type Config = z.infer<typeof configSchema> &
  z.infer<typeof secretsSchema>;

const fullConfigSchema = configSchema.merge(secretsSchema);

export const {
  defineCommand,
  defineTrigger,
  defineService,
  createDocumentChangeTrigger,
} = createTypes({
  configSchema: fullConfigSchema,
  registry,
});

export { registry } from './framework.gen.js';
export type { Registry } from './framework.gen.js';
