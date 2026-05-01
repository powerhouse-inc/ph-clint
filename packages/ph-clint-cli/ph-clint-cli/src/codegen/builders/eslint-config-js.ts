/**
 * Builds `eslint.config.js` for the CLI — minimal TypeScript-ESLint config.
 */
export function buildEslintConfigJs(): string {
  return [
    '// @clint:begin eslint',
    "import tseslint from 'typescript-eslint';",
    '',
    'export default tseslint.config(',
    '  tseslint.configs.recommended,',
    "  { ignores: ['dist/', 'gen/', 'coverage/'] },",
    ');',
    '// @clint:end eslint',
    '',
  ].join('\n');
}
