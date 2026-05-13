import { describe, it, expect } from '@jest/globals';
import { buildCliPackageJson } from '../../src/codegen/builders/cli-package-json.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import type { CodegenContext } from '../../src/codegen/types.js';
import type { ClintProjectSpec } from '../../src/spec/types.js';

const TEST_CTX: CodegenContext = { toolVersion: '0.1.0-test' };

function parseBuilt(spec: ClintProjectSpec): Record<string, unknown> {
  return JSON.parse(buildCliPackageJson(spec, TEST_CTX));
}

describe('buildCliPackageJson', () => {
  it('flat layout — bare name, no scope, no @-app dependency', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('foo-cli');
    expect(pkg.type).toBe('module');
    expect(pkg.bin).toEqual({ foo: './dist/main.js' });
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@powerhousedao/ph-clint']).toBeDefined();
    expect(deps['foo-app']).toBeUndefined();
    expect(deps['@mastra/core']).toBeUndefined();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.dev).toBe('tsx src/main.ts');
    expect(scripts['mastra:dev']).toBeUndefined();
  });

  it('scoped + mastra — adds @mastra/* deps and mastra scripts', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@acme',
      features: { mastra: { enabled: true } },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('@acme/foo-cli');
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@mastra/core']).toBeDefined();
    expect(deps['@mastra/libsql']).toBeDefined();
    expect(deps['@mastra/memory']).toBeDefined();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['mastra:dev']).toBe('mastra dev');
  });

  it('powerhouse enabled — appends -cli suffix and app dep', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('foo-cli');
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['foo-app']).toBe('workspace:*');
    expect(deps['@powerhousedao/reactor']).toBeDefined();
    expect(deps['document-model']).toBeDefined();
  });

  it('scoped + powerhouse — package name becomes @scope/name-cli', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@acme',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('@acme/foo-cli');
  });

  it('single layout — includes publish scripts', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['publish:dev']).toBe('ph-publish dev -c ./publish.config.js');
    expect(scripts['publish:staging']).toBe('ph-publish staging -c ./publish.config.js');
    expect(scripts['publish:production']).toBe('ph-publish production -c ./publish.config.js');
  });

  it('split layout — omits publish scripts (root-package-json owns them)', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['publish:dev']).toBeUndefined();
    expect(scripts['publish:staging']).toBeUndefined();
    expect(scripts['publish:production']).toBeUndefined();
  });

  it('includes build:assets script and updated build script', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['build:assets']).toBe('tsx scripts/build-assets.ts');
    expect(scripts.build).toBe('pnpm build:assets && tsc');
  });

  it('output always ends with a trailing newline', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(buildCliPackageJson(spec, TEST_CTX).endsWith('\n')).toBe(true);
  });

  it('scoped spec does not duplicate app package as bare name', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate-cli',
      scope: '@powerhousedao',
      features: { powerhouse: 'Switchboard' },
      packages: [
        { id: 'app-pirate', packageName: 'pirate-app', documentTypes: [] },
      ],
    });
    const pkg = parseBuilt(spec);
    const deps = pkg.dependencies as Record<string, string>;
    // Should have the scoped workspace dependency
    expect(deps['@powerhousedao/pirate-app']).toBe('workspace:*');
    // Must NOT have the bare name as a separate entry
    expect(deps['pirate-app']).toBeUndefined();
  });

  it('external packages (not app) are included in deps', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate-cli',
      scope: '@powerhousedao',
      features: { powerhouse: 'Switchboard' },
      packages: [
        { id: 'app-pirate', packageName: 'pirate-app', documentTypes: [] },
        { id: 'ext-models', packageName: '@other/models', documentTypes: ['other/model'] },
      ],
    });
    const pkg = parseBuilt(spec);
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@other/models']).toBe('latest');
    expect(deps['pirate-app']).toBeUndefined();
  });

  it('uses package version for external deps when specified', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate-cli',
      scope: '@powerhousedao',
      features: { powerhouse: 'Switchboard' },
      packages: [
        { id: 'app-pirate', packageName: 'pirate-app', documentTypes: [] },
        { id: 'ext-models', packageName: '@other/models', documentTypes: ['other/model'], version: '0.1.0-dev.55' },
      ],
    });
    const pkg = parseBuilt(spec);
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@other/models']).toBe('0.1.0-dev.55');
  });

  it('uses ph-clint version range for clint-common when version is null', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate-cli',
      scope: '@powerhousedao',
      features: { powerhouse: 'Switchboard' },
      packages: [
        { id: 'app-pirate', packageName: 'pirate-app', documentTypes: [] },
        { id: 'pkg-clint-common', packageName: '@powerhousedao/clint-common', documentTypes: ['powerhouse/chat-session'] },
      ],
    });
    const ctx: CodegenContext = { toolVersion: '0.1.0-dev.55' };
    const pkg = JSON.parse(buildCliPackageJson(spec, ctx));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@powerhousedao/clint-common']).toBe('0.1.0-dev.55');
  });

  it('includes typescript-eslint in devDependencies', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const pkg = parseBuilt(spec);
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps['typescript-eslint']).toBeDefined();
  });

  it('uses ctx.toolVersion for ph-clint dependency range', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const ctx: CodegenContext = { toolVersion: '0.2.0-dev.5' };
    const pkg = JSON.parse(buildCliPackageJson(spec, ctx));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@powerhousedao/ph-clint']).toBe('0.2.0-dev.5');
  });

  describe('observability', () => {
    it('no observability dep or telemetry:dev script when disabled', () => {
      const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
      const pkg = parseBuilt(spec);
      const deps = pkg.dependencies as Record<string, string>;
      const scripts = pkg.scripts as Record<string, string>;
      expect(deps['@powerhousedao/ph-clint-observability']).toBeUndefined();
      expect(scripts['telemetry:dev']).toBeUndefined();
    });

    it('adds observability dep and telemetry:dev script when enabled', () => {
      const spec = clintProjectSpecSchema.parse({
        name: 'foo-cli',
        deployment: { observabilityEnabled: true },
      });
      const pkg = parseBuilt(spec);
      const deps = pkg.dependencies as Record<string, string>;
      const scripts = pkg.scripts as Record<string, string>;
      // Same dep range as ph-clint — lockstep
      expect(deps['@powerhousedao/ph-clint-observability']).toBe(deps['@powerhousedao/ph-clint']);
      // Uses the bin name (foo), not the package name (foo-cli) — so the
      // receiver's announced env var matches what the running CLI reads.
      expect(scripts['telemetry:dev']).toBe('ph-telemetry-dev --cli-name=foo');
    });
  });
});
