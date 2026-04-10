import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'vetra-mastra';
export const CLI_VERSION = '1.0.0';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Config schema ─────────────────────────────────────────────────

export const configSchema = z.object({
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  phVersion: z.string().optional().describe('Powerhouse version (defaults to installed ph CLI version)'),
  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging to disk'),
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
});

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
