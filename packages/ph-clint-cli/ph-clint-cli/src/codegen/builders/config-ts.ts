/**
 * Builds `src/config.ts` — CLI name/version constants plus Zod configSchema
 * and secretsSchema. Fields are added conditionally based on enabled features.
 */
import {
  type ClintProjectSpec,
  getBinName,
} from '../../spec/types.js';

export function buildConfigTs(spec: ClintProjectSpec): string {
  const cliName = getBinName(spec);
  const { mastra, powerhouse } = spec.features;
  const lines: string[] = [];

  lines.push(`import path from 'node:path';`);
  lines.push(`import { fileURLToPath } from 'node:url';`);
  lines.push(`import { z } from 'zod';`);
  lines.push('');
  lines.push('/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */');
  lines.push(`export const CLI_NAME = '${cliName}';`);
  lines.push(`export const CLI_VERSION = '${spec.version}';`);
  lines.push('');
  lines.push('/** Project root — resolved from this file location. */');
  lines.push(
    'export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \'..\');',
  );
  lines.push('');
  lines.push('// @clint:begin configSchema');
  lines.push('export const configSchema = z.object({');
  if (mastra.enabled) {
    lines.push(
      "  model: z.string().default('anthropic/claude-haiku-4-5').describe('LLM model to use'),",
    );
  }
  if (powerhouse.enabled && powerhouse.switchboard) {
    lines.push(
      '  switchboardPort: z.number().default(4001).describe(\'Switchboard port\'),',
    );
  }
  if (powerhouse.enabled && powerhouse.connect) {
    lines.push(
      '  connectPort: z.number().default(3000).describe(\'Connect UI port\'),',
    );
  }
  lines.push('});');
  lines.push('// @clint:end configSchema');
  lines.push('');
  lines.push('// @clint:begin secretsSchema');
  lines.push('export const secretsSchema = z.object({');
  if (mastra.enabled) {
    lines.push(
      "  apiKey: z.string().optional().describe('LLM API key'),",
    );
  }
  lines.push('});');
  lines.push('// @clint:end secretsSchema');
  lines.push('');
  lines.push('export type Config = z.infer<typeof configSchema> & z.infer<typeof secretsSchema>;');

  return lines.join('\n') + '\n';
}
