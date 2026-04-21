/**
 * Builds `src/config.ts` — CLI identity constants (name, version, project
 * root path). The Zod `configSchema` / `secretsSchema` are emitted by
 * `buildFrameworkTs` into `src/framework.ts` (user-owned, init-only) so users
 * can extend them without fighting the generator.
 */
import {
  type ClintProjectSpec,
} from '../../spec/types.js';

export function buildConfigTs(spec: ClintProjectSpec): string {
  const hasCustomBin = !!spec.bin;
  const lines: string[] = [];

  lines.push(`import { readPackageInfo } from '@powerhousedao/ph-clint';`);
  lines.push('');
  lines.push('const pkg = readPackageInfo(import.meta.url);');
  lines.push('');
  lines.push('export const CLI_ROOT = pkg.root;');
  if (hasCustomBin) {
    lines.push(`export const CLI_NAME = '${spec.bin}';`);
  } else {
    lines.push(`export const CLI_NAME = pkg.name.replace(/-cli$/, '');`);
  }
  lines.push('export const CLI_VERSION = pkg.version;');

  return lines.join('\n') + '\n';
}
