import { describe, it, expect } from '@jest/globals';
import { buildRootPackageJson } from '../../src/codegen/builders/root-package-json.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildRootPackageJson', () => {
  it('emits passthrough scripts that cd into -cli and -app', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: { enabled: true } },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as {
      name: string;
      private: boolean;
      scripts: Record<string, string>;
    };
    expect(pkg.name).toBe('foo');
    expect(pkg.private).toBe(true);
    expect(pkg.scripts.build).toBe(
      'cd foo-app && pnpm build && cd ../foo-cli && pnpm build',
    );
    expect(pkg.scripts.dev).toBe('cd foo-cli && pnpm dev');
    expect(pkg.scripts['app:dev']).toBe('cd foo-app && pnpm dev');
    expect(pkg.scripts['cli:dev']).toBe('cd foo-cli && pnpm dev');
  });

  it('preserves a scoped package name at the root', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      scope: 'acme',
      features: { powerhouse: { enabled: true } },
    });
    const pkg = JSON.parse(buildRootPackageJson(spec)) as { name: string };
    expect(pkg.name).toBe('@acme/foo');
  });
});
