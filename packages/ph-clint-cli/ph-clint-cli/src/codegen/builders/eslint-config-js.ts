/**
 * Builds `eslint.config.js` for the CLI — placeholder flat config.
 */
export function buildEslintConfigJs(): string {
  return [
    '// @clint:begin eslint',
    '// Placeholder ESLint flat config — replaced by codegen when the',
    "// project's lint stack is configured.",
    'export default [];',
    '// @clint:end eslint',
    '',
  ].join('\n');
}
