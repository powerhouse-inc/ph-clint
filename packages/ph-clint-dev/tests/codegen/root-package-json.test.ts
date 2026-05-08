import { describe, it, expect } from '@jest/globals';
import { buildRootPackageJson } from '../../src/codegen/builders/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildRootPackageJson', () => {
  it('emits pnpm workspace scripts for app and cli', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
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
    // No `install` script — see root-package-json.ts comment.
    expect(pkg.scripts.install).toBeUndefined();
    // Connect enabled → build includes connect build step with --outDir
    expect(pkg.scripts.build).toBe(
      'pnpm --filter foo-app build && pnpm --filter foo-app connect build --outDir dist/connect && pnpm --filter foo-cli build',
    );
    expect(pkg.scripts.test).toBe('pnpm -r run test');
    expect(pkg.scripts.dev).toBe('pnpm --filter foo-cli dev');
    expect(pkg.scripts.start).toBe('pnpm --filter foo-cli start');
    expect(pkg.scripts.lint).toBe('pnpm -r run lint');
    expect(pkg.scripts['app:dev']).toBeUndefined();
    expect(pkg.scripts['cli:dev']).toBeUndefined();
  });

  it('omits the connect build step when Connect is disabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Reactor' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.build).toBe(
      'pnpm --filter foo-app build && pnpm --filter foo-cli build',
    );
    expect(pkg.scripts['publish:dev']).toBe(
      'pnpm --filter foo-cli exec ph-publish dev -c ../publish.config.js',
    );
  });

  it('includes publish scripts using pnpm --filter exec with --verify-connect when Connect is enabled', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['publish:dev']).toBe(
      'pnpm --filter foo-cli exec ph-publish dev -c ../publish.config.js --verify-connect',
    );
    expect(pkg.scripts['publish:staging']).toBe(
      'pnpm --filter foo-cli exec ph-publish staging -c ../publish.config.js --verify-connect',
    );
    expect(pkg.scripts['publish:production']).toBe(
      'pnpm --filter foo-cli exec ph-publish production -c ../publish.config.js --verify-connect',
    );
  });

  it('preserves a scoped package name at the root', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      scope: '@acme',
      features: { powerhouse: 'Connect' },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as { name: string };
    expect(pkg.name).toBe('@acme/foo');
  });
});
