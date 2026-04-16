import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'ph-clint';
export const CLI_VERSION = '0.0.0';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Config schema ─────────────────────────────────────────────────

// @clint:begin configSchema
export const configSchema = z.object({
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
  connectPort: z.number().default(3001).describe('Connect UI port for ph-clint itself'),
  switchboardPort: z.number().default(4802).describe('Switchboard port for ph-clint itself'),
  devServicePort: z.number().default(3000).describe('Port reserved for the impl project (Service B) `pnpm dev`'),
  phVersion: z.string().default('6.0.0-dev.170').describe('Pinned Powerhouse version used when emitting a new impl project'),
  projectDocumentId: z.string().optional().describe('ID of the powerhouse/ph-clint-project document that drives codegen (set on first regen; edit to switch projects)'),
});
// @clint:end configSchema

// @clint:begin secretsSchema
export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
});
// @clint:end secretsSchema

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
