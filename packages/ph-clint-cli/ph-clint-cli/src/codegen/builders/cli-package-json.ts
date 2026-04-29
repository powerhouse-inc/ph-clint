/**
 * Builds the CLI-side `package.json` (the ph-clint CLI itself).
 *
 * When `features.powerhouse.enabled`, this file lives at
 * `{root}/{name}-cli/package.json`. Otherwise at `{root}/package.json`.
 */
import {
  type ClintProjectSpec,
  getAppDirName,
  getAppPackageName,
  getBinName,
  getPackageName,
  phAtLeast,
} from '../../spec/types.js';
import { CLI_VERSION } from '../../config.js';

/**
 * Derive a semver range from the running ph-clint-cli version that respects
 * the dev / staging / production channel boundary. This is the version range
 * emitted into *scaffolded* projects' package.json for @powerhousedao/ph-clint
 * and @powerhousedao/ph-clint-dev dependencies.
 *
 * CLI_VERSION is the version of ph-clint-cli itself (read from its own
 * package.json at startup). Since all framework packages share a lockstep
 * version, this is also the correct base for the dependency range.
 *
 * Examples:
 *   "0.1.0"            → "^0.1.0"            (production — stable only)
 *   "0.1.0-staging.2"  → "^0.1.0-staging.0"  (staging + stable)
 *   "0.1.0-dev.4"      → "^0.1.0-dev.0"      (dev + staging + stable)
 *
 * This works because semver orders prereleases alphabetically:
 * dev.N < staging.N < release. A caret range starting at dev.0 naturally
 * upgrades through staging to production.
 */
function phClintRange(version: string): string {
  const match = /^(\d+\.\d+\.\d+)(?:-([a-z]+)\.\d+)?/.exec(version);
  if (!match) return `^${version}`;
  const base = match[1];
  const channel = match[2]; // "dev", "staging", or undefined
  // For prerelease channels, pin exact version. Caret ranges like ^0.1.0-dev.0
  // resolve to `latest` dist-tag (0.1.0-dev.0) instead of the highest match,
  // causing "export not found" errors when the scaffolding CLI is newer.
  return channel ? version : `^${base}`;
}

/** Version range for @powerhousedao/ph-clint{,-dev} deps in scaffolded projects. */
const PH_CLINT_VERSION = phClintRange(CLI_VERSION);
const POWERHOUSE_VERSION = '6.0.0-dev.170';

export function buildCliPackageJson(spec: ClintProjectSpec): string {
  const { mastra, powerhouse } = spec.features;
  const pkgName = phAtLeast(powerhouse, 'Reactor')
    ? `${getPackageName(spec)}-cli`
    : getPackageName(spec);
  const bin = getBinName(spec);

  const dependencies: Record<string, string> = {
    '@powerhousedao/ph-clint': PH_CLINT_VERSION,
    zod: '^4.3.6',
  };
  if (mastra.enabled) {
    dependencies['@mastra/core'] = '^1.22.0';
    dependencies['@mastra/libsql'] = '^1.7.4';
    dependencies['@mastra/mcp'] = '^1.4.1';
    dependencies['@mastra/memory'] = '^1.13.1';
  }
  if (phAtLeast(powerhouse, 'Reactor')) {
    const appPkg = getAppPackageName(spec);
    const appDir = getAppDirName(spec);
    dependencies[appPkg] = `file:../${appDir}`;
    dependencies['@powerhousedao/reactor'] = POWERHOUSE_VERSION;
    dependencies['@powerhousedao/reactor-api'] = POWERHOUSE_VERSION;
    dependencies['@powerhousedao/shared'] = POWERHOUSE_VERSION;
    dependencies['document-model'] = POWERHOUSE_VERSION;
    // External reactor packages (non-app) as versioned dependencies.
    for (const pkg of spec.packages) {
      if (pkg.packageName !== appPkg) {
        dependencies[pkg.packageName] = 'latest';
      }
    }
  }

  const scripts: Record<string, string> = {
    'build:skills': 'tsx scripts/build-skills.ts',
    'build:manifest': 'build-manifest',
    build: 'pnpm build:skills && tsc && pnpm build:manifest',
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
  // Single-layout: publish scripts live in the CLI package.json (which IS the
  // root). Split-layout gets these from root-package-json.ts instead.
  if (!phAtLeast(powerhouse, 'Reactor')) {
    scripts['publish:dev'] = 'ph-publish dev -c ./publish.config.js';
    scripts['publish:staging'] = 'ph-publish staging -c ./publish.config.js';
    scripts['publish:production'] = 'ph-publish production -c ./publish.config.js';
  }
  if (spec.deployment.serviceAnnouncement) {
    scripts['test-service-registry'] = 'vetra-graphql-registry --withAuth';
  }
  const pkg: Record<string, unknown> = {
    name: pkgName,
    version: spec.version,
    publishConfig: { access: 'public' as const },
    type: 'module',
  };
  if (spec.description) pkg.description = spec.description;
  pkg.bin = { [bin]: './dist/main.js' };
  pkg.files = ['dist'];
  pkg.scripts = scripts;
  pkg.dependencies = dependencies;
  pkg.devDependencies = {
    '@jest/globals': '^30.2.0',
    '@types/node': '^25.5.2',
    jest: '^30.2.0',
    '@powerhousedao/ph-clint-dev': PH_CLINT_VERSION,
    'ts-jest': '^29.4.6',
    tsx: '^4.19.0',
    typescript: '^6.0.2',
  };
  pkg.engines = { node: '>=22.13.0' };

  return JSON.stringify(pkg, null, 2) + '\n';
}
