/**
 * Builds `pnpm-workspace.yaml` — pre-approves native build scripts
 * for transitive dependencies (esbuild, unrs-resolver) so
 * `pnpm install` doesn't prompt or fail.
 *
 * Flat layout: emitted at the project root (which IS the CLI dir).
 * Split layout: emitted at the CLI dir (each sub-project is independent,
 * no pnpm workspace — see root-package-json.ts).
 */
export function buildPnpmWorkspaceYaml(): string {
  return [
    'allowBuilds:',
    '  esbuild: true',
    '  unrs-resolver: true',
    '',
  ].join('\n');
}
