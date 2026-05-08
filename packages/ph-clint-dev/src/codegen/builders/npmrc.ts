/**
 * Builds `.npmrc` — registry mappings needed at install time.
 *
 * Currently only the JSR scope mapping for any `@jsr/*` deps pulled in by
 * the Powerhouse stack. Project-scoped (lives in the repo) so every machine
 * resolves the same registry; not a machine-local override.
 *
 * Emitted at the project root for split layout so all workspace members
 * inherit it; flat layout's `ph init` already writes its own.
 */
export function buildNpmrc(): string {
  return '@jsr:registry=https://npm.jsr.io\n';
}
