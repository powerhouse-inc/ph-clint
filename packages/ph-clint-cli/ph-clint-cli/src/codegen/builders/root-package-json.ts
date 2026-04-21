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
} from '../../spec/types.js';

export function buildRootPackageJson(spec: ClintProjectSpec): string {
  const cli = `${spec.name}-cli`;
  const app = `${spec.name}-app`;

  const prefix = (dir: string, cmd: string) => `pnpm --prefix ${dir} ${cmd}`;
  const both = (cmd: string) => `${prefix(app, cmd)} && ${prefix(cli, cmd)}`;

  const connectEnabled = spec.features.powerhouse.enabled && spec.features.powerhouse.connect;

  const buildScript = connectEnabled
    ? `${prefix(app, 'build')} && ${prefix(app, 'connect:build')} && ${prefix(cli, 'build')}`
    : both('build');

  const scripts: Record<string, string> = {
    install: both('install'),
    build: buildScript,
    test: both('test'),
    dev: prefix(cli, 'dev'),
    start: prefix(cli, 'start'),
    lint: prefix(cli, 'lint'),
    'app:dev': prefix(app, 'dev'),
    'cli:dev': prefix(cli, 'dev'),
    'publish:dev': `${prefix(cli, 'exec ph-publish')} dev -c ./publish.config.ts`,
    'publish:staging': `${prefix(cli, 'exec ph-publish')} staging -c ./publish.config.ts`,
    'publish:production': `${prefix(cli, 'exec ph-publish')} production -c ./publish.config.ts`,
  };

  const pkg = {
    name: getPackageName(spec),
    version: spec.version,
    private: true,
    ...(spec.description ? { description: spec.description } : {}),
    scripts,
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}
