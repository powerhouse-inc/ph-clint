/**
 * Builds the *root* `package.json` for split-layout projects (Powerhouse
 * enabled). A plain passthrough — deliberately no pnpm workspaces because
 * they interfere with `{name}-app`'s own `pnpm build`.
 */
import {
  type ClintProjectSpec,
  getPackageName,
} from '../../spec/types.js';

export function buildRootPackageJson(spec: ClintProjectSpec): string {
  const cli = `${spec.name}-cli`;
  const app = `${spec.name}-app`;

  const pkg = {
    name: getPackageName(spec),
    version: spec.version,
    private: true,
    ...(spec.description ? { description: spec.description } : {}),
    scripts: {
      install: `cd ${app} && pnpm install && cd ../${cli} && pnpm install`,
      build: `cd ${app} && pnpm build && cd ../${cli} && pnpm build`,
      dev: `cd ${cli} && pnpm dev`,
      start: `cd ${cli} && pnpm start`,
      test: `cd ${app} && pnpm test && cd ../${cli} && pnpm test`,
      lint: `cd ${cli} && pnpm lint`,
      'app:dev': `cd ${app} && pnpm dev`,
      'cli:dev': `cd ${cli} && pnpm dev`,
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}
