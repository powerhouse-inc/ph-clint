/**
 * Builds the *root* `package.json` for split-layout projects (Powerhouse
 * enabled). A plain passthrough — deliberately no pnpm workspaces because
 * they interfere with `{name}-app`'s own `pnpm build`.
 *
 * Uses `pnpm --prefix <dir>` for all orchestration scripts — no cwd mutation.
 * Build order: app first, then cli (cli depends on app via `file:` dep).
 */
import {
  type ClintProjectSpec,
  getPackageName,
  phAtLeast,
} from '../../spec/types.js';

export function buildRootPackageJson(spec: ClintProjectSpec): string {
  const cli = `${spec.name}-cli`;
  const app = `${spec.name}-app`;

  const prefix = (dir: string, cmd: string) => `pnpm --prefix ${dir} ${cmd}`;
  const both = (cmd: string) => `${prefix(app, cmd)} && ${prefix(cli, cmd)}`;

  const connectEnabled = phAtLeast(spec.features.powerhouse, 'Connect');

  const buildScript = connectEnabled
    ? `${prefix(app, 'build')} && ${prefix(app, 'connect:build')} && ${prefix(cli, 'build')}`
    : both('build');

  const scripts: Record<string, string> = {
    install: both('install'),
    build: buildScript,
    test: both('test'),
    dev: prefix(cli, 'dev'),
    start: prefix(cli, 'start'),
    lint: both('lint'),
    'publish:dev': `${prefix(cli, 'exec ph-publish')} dev -c ../publish.config.js`,
    'publish:staging': `${prefix(cli, 'exec ph-publish')} staging -c ../publish.config.js`,
    'publish:production': `${prefix(cli, 'exec ph-publish')} production -c ../publish.config.js`,
  };
  if (spec.deployment.serviceAnnouncement) {
    scripts['test-service-registry'] = prefix(cli, 'test-service-registry');
  }

  const pkg = {
    name: getPackageName(spec),
    version: spec.version,
    private: true,
    type: 'module',
    ...(spec.description ? { description: spec.description } : {}),
    scripts,
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}
