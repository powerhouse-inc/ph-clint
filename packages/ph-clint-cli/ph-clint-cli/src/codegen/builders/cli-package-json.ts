/**
 * Builds the CLI-side `package.json` (the ph-clint CLI itself).
 *
 * When `features.powerhouse.enabled`, this file lives at
 * `{root}/{name}-cli/package.json`. Otherwise at `{root}/package.json`.
 */
import {
  type ClintProjectSpec,
  getBinName,
  getPackageName,
} from '../../spec/types.js';

/** Pinned version range for peer ph-clint packages emitted into generated projects. */
const PH_CLINT_VERSION = '^0.1.0';
const POWERHOUSE_VERSION = '6.0.0-dev.170';

export function buildCliPackageJson(spec: ClintProjectSpec): string {
  const { mastra, powerhouse } = spec.features;
  const pkgName = powerhouse.enabled
    ? `${getPackageName(spec)}-cli`
    : getPackageName(spec);
  const bin = getBinName(spec);

  const dependencies: Record<string, string> = {
    'ph-clint': PH_CLINT_VERSION,
    zod: '^4.3.6',
  };
  if (mastra.enabled) {
    dependencies['@mastra/core'] = '^1.22.0';
    dependencies['@mastra/libsql'] = '^1.7.4';
    dependencies['@mastra/memory'] = '^1.13.1';
  }
  if (powerhouse.enabled) {
    dependencies[`${spec.name}-app`] = `file:../${spec.name}-app`;
    dependencies['@powerhousedao/reactor'] = POWERHOUSE_VERSION;
    dependencies['@powerhousedao/reactor-api'] = POWERHOUSE_VERSION;
    dependencies['@powerhousedao/shared'] = POWERHOUSE_VERSION;
    dependencies['document-model'] = POWERHOUSE_VERSION;
  }

  const scripts: Record<string, string> = {
    'build:skills': 'tsx scripts/build-skills.ts',
    build: 'pnpm build:skills && tsc',
    dev: 'tsx src/main.ts',
    start: 'node dist/main.js',
    test: "NODE_OPTIONS='--experimental-vm-modules' jest --detectOpenHandles",
    lint: 'eslint src',
  };
  if (mastra.enabled) {
    scripts['mastra:dev'] = 'mastra dev';
    scripts['mastra:build'] = 'mastra build';
    scripts['mastra:start'] = 'mastra start';
  }
  scripts['publish:npm'] = 'pnpm build && pnpm publish --no-git-checks';

  const pkg: Record<string, unknown> = {
    name: pkgName,
    version: spec.version,
    private: true,
    type: 'module',
  };
  if (spec.description) pkg.description = spec.description;
  pkg.bin = { [bin]: './dist/main.js' };
  pkg.scripts = scripts;
  pkg.dependencies = dependencies;
  pkg.devDependencies = {
    '@jest/globals': '^30.2.0',
    '@types/node': '^25.5.2',
    jest: '^30.2.0',
    'ph-clint-dev': PH_CLINT_VERSION,
    'ts-jest': '^29.4.6',
    tsx: '^4.19.0',
    typescript: '^6.0.2',
  };
  pkg.engines = { node: '>=22.13.0' };

  return JSON.stringify(pkg, null, 2) + '\n';
}
