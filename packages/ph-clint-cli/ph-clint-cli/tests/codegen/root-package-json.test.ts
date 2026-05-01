import { describe, it, expect } from '@jest/globals';
import { buildRootPackageJson } from '../../src/codegen/builders/root-package-json.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildRootPackageJson', () => {
  it('emits pnpm --prefix scripts for app and cli', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      name: string;
      private: boolean;
      scripts: Record<string, string>;
    };
    expect(pkg.name).toBe('foo');
    expect(pkg.private).toBe(true);
    expect((pkg as Record<string, unknown>).type).toBe('module');
    expect(pkg.scripts.install).toBe(
      'pnpm --prefix foo-app install && pnpm --prefix foo-cli install',
    );
    // Connect enabled by default → build includes connect:build step
    expect(pkg.scripts.build).toBe(
      'pnpm --prefix foo-app build && pnpm --prefix foo-app connect:build && pnpm --prefix foo-cli build',
    );
    expect(pkg.scripts.test).toBe(
      'pnpm --prefix foo-app test && pnpm --prefix foo-cli test',
    );
    expect(pkg.scripts.dev).toBe('pnpm --prefix foo-cli dev');
    expect(pkg.scripts.start).toBe('pnpm --prefix foo-cli start');
    expect(pkg.scripts.lint).toBe(
      'pnpm --prefix foo-app lint && pnpm --prefix foo-cli lint',
    );
    expect(pkg.scripts['app:dev']).toBeUndefined();
    expect(pkg.scripts['cli:dev']).toBeUndefined();
  });

  it('includes publish scripts using pnpm --prefix exec', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['publish:dev']).toBe(
      'pnpm --prefix foo-cli exec ph-publish dev -c ../publish.config.js',
    );
    expect(pkg.scripts['publish:staging']).toBe(
      'pnpm --prefix foo-cli exec ph-publish staging -c ../publish.config.js',
    );
    expect(pkg.scripts['publish:production']).toBe(
      'pnpm --prefix foo-cli exec ph-publish production -c ../publish.config.js',
    );
  });

  it('includes test-service-registry when serviceAnnouncement enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
      deployment: { serviceAnnouncement: true },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['test-service-registry']).toBe(
      'pnpm --prefix foo-cli test-service-registry',
    );
  });

  it('omits test-service-registry when serviceAnnouncement disabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['test-service-registry']).toBeUndefined();
  });

  it('preserves a scoped package name at the root', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      scope: 'acme',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as { name: string };
    expect(pkg.name).toBe('@acme/foo');
  });
});
