/**
 * Builds `.gitignore` for the CLI.
 */
export function buildGitignore(): string {
  return [
    'node_modules/',
    'dist/',
    'gen/',
    '.mastra/',
    '.ph/',
    'coverage/',
    '*.tsbuildinfo',
    '*.db',
    '*.db-shm',
    '*.db-wal',
    '',
  ].join('\n');
}
