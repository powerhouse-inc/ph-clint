import { DEFAULT_RENOWN_URL } from '@renown/sdk/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'ph-rupert';
export const CLI_VERSION = '0.0.1';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Config schema ─────────────────────────────────────────────────

export const renownConfigSchema = z.object({
  url: z.string().default(DEFAULT_RENOWN_URL).describe("Renown server URL"),
  privateKey: z
    .string()
    .optional()
    .describe("JSON-encoded JWK keypair (overrides keyPath and env var)"),
  keyPath: z
    .string()
    .optional()
    .describe("Path to keypair file (defaults to .ph/.keypair.json)"),
  storagePath: z
    .string()
    .optional()
    .describe("Path to credential storage file (defaults to .ph/.renown.json)"),
});

export const configSchema = z.object({
  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  phVersion: z.string().optional().describe('Powerhouse version (defaults to installed ph CLI version)'),
  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging to disk'),
  renown: renownConfigSchema
    .default({ url: DEFAULT_RENOWN_URL })
    .describe("Renown authentication configuration"),
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
});

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
