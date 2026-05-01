import { describe, it, expect } from '@jest/globals';
import { buildCliPackageJson } from '../../src/codegen/builders/cli-package-json.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

function parseBuilt(spec: Parameters<typeof buildCliPackageJson>[0]): Record<string, unknown> {
  return JSON.parse(buildCliPackageJson(spec));
}

describe('buildCliPackageJson', () => {
  it('flat layout — bare name, no scope, no @-app dependency', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('foo');
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
      name: 'foo',
      scope: 'acme',
      features: { mastra: { enabled: true } },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('@acme/foo');
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@mastra/core']).toBeDefined();
    expect(deps['@mastra/libsql']).toBeDefined();
    expect(deps['@mastra/memory']).toBeDefined();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['mastra:dev']).toBe('mastra dev');
  });

  it('powerhouse enabled — appends -cli suffix and app dep', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('foo-cli');
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['foo-app']).toBe('file:../foo-app');
    expect(deps['@powerhousedao/reactor']).toBeDefined();
    expect(deps['document-model']).toBeDefined();
  });

  it('scoped + powerhouse — package name becomes @scope/name-cli', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      scope: 'acme',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('@acme/foo-cli');
  });

  it('custom bin name overrides project name in bin field', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', bin: 'foobar' });
    const pkg = parseBuilt(spec);
    expect(pkg.bin).toEqual({ foobar: './dist/main.js' });
  });

  it('single layout — includes publish scripts', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['publish:dev']).toBe('ph-publish dev -c ./publish.config.js');
    expect(scripts['publish:staging']).toBe('ph-publish staging -c ./publish.config.js');
    expect(scripts['publish:production']).toBe('ph-publish production -c ./publish.config.js');
  });

  it('split layout — omits publish scripts (root-package-json owns them)', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['publish:dev']).toBeUndefined();
    expect(scripts['publish:staging']).toBeUndefined();
    expect(scripts['publish:production']).toBeUndefined();
  });

  it('includes test-service-registry when serviceAnnouncement enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      deployment: { serviceAnnouncement: true },
    });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['test-service-registry']).toBe('json-post-registry --withAuth');
  });

  it('includes build:manifest script and updated build script', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['build:manifest']).toBe('build-manifest');
    expect(scripts.build).toBe('pnpm build:skills && tsc && pnpm build:manifest');
  });

  it('omits test-service-registry when serviceAnnouncement disabled', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const pkg = parseBuilt(spec);
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['test-service-registry']).toBeUndefined();
  });

  it('output always ends with a trailing newline', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    expect(buildCliPackageJson(spec).endsWith('\n')).toBe(true);
  });

  it('scoped spec does not duplicate app package as bare name', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate',
      scope: 'powerhousedao',
      features: { powerhouse: 'Switchboard' },
      packages: [
        { id: 'app-pirate', packageName: 'pirate-app', documentTypes: [] },
      ],
    });
    const pkg = parseBuilt(spec);
    const deps = pkg.dependencies as Record<string, string>;
    // Should have the scoped file: dependency
    expect(deps['@powerhousedao/pirate-app']).toBe('file:../pirate-app');
    // Must NOT have the bare name as a separate entry
    expect(deps['pirate-app']).toBeUndefined();
  });

  it('external packages (not app) are included in deps', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'pirate',
      scope: 'powerhousedao',
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

  it('includes typescript-eslint in devDependencies', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const pkg = parseBuilt(spec);
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps['typescript-eslint']).toBeDefined();
  });
});
