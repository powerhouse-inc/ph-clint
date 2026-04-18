import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'ph-mara';
export const CLI_VERSION = '0.0.1';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Config schema ─────────────────────────────────────────────────

export const configSchema = z.object({
  model: z.string().default('anthropic/claude-sonnet-4-6').describe('LLM model to use'),
  premiumModel: z.string().default('anthropic/claude-opus-4-6').describe('Premium LLM model for complex tasks'),
  previewPort: z.number().default(3000).describe('Preview server port'),
  screenshotWidth: z.number().default(1440).describe('Screenshot viewport width'),
  screenshotHeight: z.number().default(900).describe('Screenshot viewport height'),
  animationWait: z.number().default(2000).describe('Milliseconds to wait for animations before screenshot'),
  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging to disk'),
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
});

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
