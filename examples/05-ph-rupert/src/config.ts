import { DEFAULT_REGISTRY_URL } from '@powerhousedao/shared/clis';
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

