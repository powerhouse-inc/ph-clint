/**
 * Builds the *root* `package.json` for split-layout projects (Powerhouse
 * enabled). The project is a pnpm workspace — root has no own deps; scripts
 * orchestrate the app + cli members via `pnpm --filter`.
 *
 * Build order matters: the cli member depends on the app via `workspace:*`,
 * so the app must be built before the cli compiles against its dist.
 */
import {
  type ClintProjectSpec,
  getAppFolderName,
  getBinName,
  getCliFolderName,
  phAtLeast,
} from '../../spec/types.js';

export function buildRootPackageJson(spec: ClintProjectSpec): string {
  const cli = getCliFolderName(spec);
  const app = getAppFolderName(spec);

  const filter = (member: string, cmd: string) =>
    `pnpm --filter ${member} ${cmd}`;

  const connectEnabled = phAtLeast(spec.features.powerhouse, 'Connect');

  const buildScript = connectEnabled
    ? `${filter(app, 'build')} && ${filter(app, 'connect build --outDir dist/connect')} && ${filter(cli, 'build')}`
    : `${filter(app, 'build')} && ${filter(cli, 'build')}`;

  // Note: no `install` script. With the workspace layout, plain `pnpm install`
  // at the project root resolves all members in one pass — and defining
  // `install` would trip pnpm's `install` lifecycle hook, recursing forever.
  const scripts: Record<string, string> = {
    build: buildScript,
    test: 'pnpm -r run test',
    dev: filter(cli, 'dev'),
    start: filter(cli, 'start'),
    lint: 'pnpm -r run lint',
    'publish:dev': `${filter(cli, 'exec ph-publish')} dev -c ../publish.config.js${connectEnabled ? ' --verify-connect' : ''}`,
    'publish:staging': `${filter(cli, 'exec ph-publish')} staging -c ../publish.config.js${connectEnabled ? ' --verify-connect' : ''}`,
    'publish:production': `${filter(cli, 'exec ph-publish')} production -c ../publish.config.js${connectEnabled ? ' --verify-connect' : ''}`,
  };

  const pkg = {
    name: spec.scope ? `${spec.scope}/${getBinName(spec)}` : getBinName(spec),
    version: spec.version,
    private: true,
    type: 'module',
    ...(spec.description ? { description: spec.description } : {}),
    scripts,
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}
