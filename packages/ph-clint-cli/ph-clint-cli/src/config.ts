import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** CLI name — used for config resolution, env var prefixing, and .ph/ paths. */
export const CLI_NAME = 'ph-clint';
export const CLI_VERSION = '0.0.0';

/** Project root — resolved from this file's location. */
export const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
