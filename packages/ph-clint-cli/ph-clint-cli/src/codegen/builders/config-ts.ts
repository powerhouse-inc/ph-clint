/**
 * Builds `src/config.ts` — CLI identity constants (name, version, project
 * root path). The Zod `configSchema` / `secretsSchema` are emitted by
 * `buildFrameworkTs` into `src/framework.ts` (user-owned, init-only) so users
 * can extend them without fighting the generator.
 */
import {
  type ClintProjectSpec,
  getBinName,
} from '../../spec/types.js';

export function buildConfigTs(spec: ClintProjectSpec): string {
  const cliName = getBinName(spec);
  const lines: string[] = [];

  lines.push(`import path from 'node:path';`);
  lines.push(`import { fileURLToPath } from 'node:url';`);
  lines.push('');
  lines.push('/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */');
  lines.push(`export const CLI_NAME = '${cliName}';`);
  lines.push(`export const CLI_VERSION = '${spec.version}';`);
  lines.push('');
  lines.push('/** Project root — resolved from this file location. */');
  lines.push(
    'export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \'..\');',
  );

  return lines.join('\n') + '\n';
}
