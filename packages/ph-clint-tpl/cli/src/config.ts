import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'mycli';
export const CLI_VERSION = '0.1.0';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Config schema ─────────────────────────────────────────────────

// @clint:begin configSchema
export const configSchema = z.object({});
// @clint:end configSchema

// @clint:begin secretsSchema
export const secretsSchema = z.object({});
// @clint:end secretsSchema

export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;
