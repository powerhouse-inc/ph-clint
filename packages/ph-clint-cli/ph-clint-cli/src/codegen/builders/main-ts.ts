/**
 * Builds `src/main.ts` — the bin entry point. Always identical regardless
 * of feature toggles.
 */
export function buildMainTs(): string {
  return [
    '#!/usr/bin/env node',
    "import { cli } from './cli.js';",
    '',
    'cli.run(process.argv);',
    '',
  ].join('\n');
}
