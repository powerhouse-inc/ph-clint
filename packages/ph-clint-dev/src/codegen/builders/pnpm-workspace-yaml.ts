/**
 * Builds `pnpm-workspace.yaml` — pre-approves native build scripts
 * for transitive dependencies pulled in by @powerhousedao/reactor,
 * Sentry, Prisma, etc., so `pnpm install` doesn't error with
 * ERR_PNPM_IGNORED_BUILDS on pnpm 11.
 *
 * Keep in sync with the root workspace's allowBuilds list at
 * `packages/pnpm-workspace.yaml`.
 *
 * Flat layout: emitted at the project root (which IS the CLI dir).
 * Split layout: emitted at the CLI dir (each sub-project is independent,
 * no pnpm workspace — see root-package-json.ts).
 */
export function buildPnpmWorkspaceYaml(): string {
  return [
    'allowBuilds:',
    "  '@apollo/protobufjs': true",
    "  '@datadog/pprof': true",
    "  '@parcel/watcher': true",
    "  '@prisma/client': true",
    "  '@prisma/engines': true",
    "  '@sentry/cli': true",
    '  esbuild: true',
    '  prisma: true',
    '  protobufjs: true',
    '  sqlite3: true',
    '  unrs-resolver: true',
    '',
  ].join('\n');
}
