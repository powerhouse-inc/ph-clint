/**
 * Builds `pnpm-workspace.yaml`.
 *
 * Pre-approves native build scripts for transitive dependencies pulled in by
 * @powerhousedao/reactor, Sentry, Prisma, etc., so `pnpm install` doesn't
 * error with ERR_PNPM_IGNORED_BUILDS on pnpm 11.
 *
 * Two output shapes:
 *
 * - **Flat layout** (Powerhouse Disabled): single-package project; emit only
 *   `allowBuilds`. The file lives at the project root which IS the CLI dir.
 *
 * - **Split layout** (Powerhouse Reactor+): the project root is a pnpm
 *   workspace with the app and cli as members. Emit `packages:`, `overrides:`
 *   (Powerhouse stack pins), and `allowBuilds:`. Lives at the project root,
 *   NOT inside the CLI dir — a nested workspace yaml inside a workspace
 *   member would shadow the root.
 *
 * The split-layout `overrides` block mirrors this dev repo's own
 * `packages/pnpm-workspace.yaml` so generated projects share the same
 * peer-dep resolutions we vetted internally.
 */
export interface PnpmWorkspaceYamlOptions {
  /**
   * When provided, emits a workspace-root yaml with these folders as
   * `packages:` members plus the Powerhouse `overrides:` block. When absent,
   * emits the flat (allowBuilds-only) shape.
   */
  members?: readonly string[];
}

export function buildPnpmWorkspaceYaml(
  options: PnpmWorkspaceYamlOptions = {},
): string {
  const lines: string[] = [];

  if (options.members && options.members.length > 0) {
    lines.push('packages:');
    for (const member of options.members) {
      lines.push(`  - '${member}'`);
    }
    lines.push('');
    lines.push('overrides:');
    lines.push("  'mastra>@mastra/deployer': '1.41.0'");
    lines.push("  zod: '4.3.6'");
    lines.push('');
  }

  lines.push('allowBuilds:');
  lines.push("  '@apollo/protobufjs': true");
  lines.push("  '@datadog/pprof': true");
  lines.push("  '@parcel/watcher': true");
  lines.push("  '@prisma/client': true");
  lines.push("  '@prisma/engines': true");
  lines.push("  '@sentry/cli': true");
  lines.push('  esbuild: true');
  lines.push('  prisma: true');
  lines.push('  protobufjs: true');
  lines.push('  sqlite3: true');
  lines.push('  unrs-resolver: true');
  lines.push('');

  return lines.join('\n');
}
