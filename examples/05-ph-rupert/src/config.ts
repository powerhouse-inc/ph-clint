import { DEFAULT_REGISTRY_URL } from '@powerhousedao/shared/clis';
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

export const renownSecretsSchema = z.object({
  renownPrivateKey: z
    .string()
    .optional()
    .describe("JSON-encoded JWK keypair (overrides renownKeyPath and env var)"),
});

export const registryConfigSchema = z.object({
  registryUrl: z.string().default(DEFAULT_REGISTRY_URL).describe("Registry URL to use when publishing packages"),
  registryUsername: z
    .string()
    .optional()
    .describe("Username for registry authentication"),
  registryEmail: z
    .email()
    .optional()
    .describe("Email for registry authentication"),
});

export const registrySecretsSchema = z.object({
  registryPassword: z
    .string()
    .optional()
    .describe("Password for registry authentication"),
});

export const configSchema = z.object({
  model: z.string().default('anthropic/claude-sonnet-4-5').describe('LLM model to use'),
  connectPort: z.number().default(3000).describe('Connect Studio port'),
  switchboardPort: z.number().default(4001).describe('Vetra Switchboard port'),
  phVersion: z.string().optional().describe('Powerhouse version (defaults to installed ph CLI version)'),
  agentLogging: z.boolean().default(false).describe('Enable agent conversation logging to disk'),
  ...renownConfigSchema.shape,
  ...registryConfigSchema.shape,
});

export const secretsSchema = z.object({
  apiKey: z.string().optional().describe('LLM API key (not required for local models)'),
  ...renownSecretsSchema.shape,
  ...registrySecretsSchema.shape,
});

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
