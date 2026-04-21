import { DEFAULT_RENOWN_URL } from '@renown/sdk/node';
import { readPackageInfo } from '@powerhousedao/ph-clint';
import { z } from 'zod';

const pkg = readPackageInfo(import.meta.url);

export const CLI_ROOT = pkg.root;
export const CLI_NAME = pkg.name.replace(/-cli$/, '');
export const CLI_VERSION = pkg.version;

// ── Config schema ─────────────────────────────────────────────────

export const renownConfigSchema = z.object({
  renownUrl: z.string().default(DEFAULT_RENOWN_URL).describe("Renown server URL"),
  renownKeyPath: z
    .string()
    .optional()
    .describe("Path to keypair file (defaults to .ph/.keypair.json)"),
  renownStoragePath: z
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
  ...renownConfigSchema.shape,
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('Anthropic API key'),
  renownPrivateKey: z
    .string()
    .optional()
    .describe("JSON-encoded JWK keypair (overrides keyPath and env var)"),
});

