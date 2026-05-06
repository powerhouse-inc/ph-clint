import { describe, it, expect } from '@jest/globals';
import { buildConfigTs } from '../../src/codegen/builders/index.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildConfigTs', () => {
  it('emits CLI identity via readPackageInfo', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    const code = buildConfigTs(spec);
    expect(code).toContain('readPackageInfo(import.meta.url)');
    expect(code).toContain('export const CLI_ROOT = pkg.root;');
    expect(code).toContain("export const CLI_NAME = pkg.name.replace(/-cli$/, '');");
    expect(code).toContain('export const CLI_VERSION = pkg.version;');
  });

  it('does not emit configSchema or secretsSchema (those live in framework.ts)', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: { powerhouse: 'Connect', mastra: { enabled: true } },
    });
    const code = buildConfigTs(spec);
    expect(code).not.toContain('configSchema');
    expect(code).not.toContain('secretsSchema');
  });
});
