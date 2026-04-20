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
      features: { powerhouse: { enabled: true } },
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
      features: { powerhouse: { enabled: true } },
    });
    const pkg = parseBuilt(spec);
    expect(pkg.name).toBe('@acme/foo-cli');
  });

  it('custom bin name overrides project name in bin field', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', bin: 'foobar' });
    const pkg = parseBuilt(spec);
    expect(pkg.bin).toEqual({ foobar: './dist/main.js' });
  });

  it('output always ends with a trailing newline', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    expect(buildCliPackageJson(spec).endsWith('\n')).toBe(true);
  });
});
