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
  apiKey: z.string().optional().describe('Anthropic API key'),
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  phVersion: z.string().default('staging').describe('Powerhouse version'),
  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging to disk'),
});

export type Config = z.infer<typeof configSchema>;
