import { describe, it, expect } from '@jest/globals';
import { buildConfigTs } from '../../src/codegen/builders/config-ts.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildConfigTs', () => {
  it('emits CLI identity constants', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const code = buildConfigTs(spec);
    expect(code).toContain("export const CLI_NAME = 'foo'");
    expect(code).toContain("export const CLI_VERSION = '0.1.0'");
    expect(code).toContain('export const PROJECT_ROOT');
  });

  it('honours custom bin name in CLI_NAME', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', bin: 'foobar' });
    const code = buildConfigTs(spec);
    expect(code).toContain("export const CLI_NAME = 'foobar'");
  });

  it('does not emit configSchema or secretsSchema (those live in framework.ts)', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: { enabled: true }, mastra: { enabled: true } },
    });
    const code = buildConfigTs(spec);
    expect(code).not.toContain('configSchema');
    expect(code).not.toContain('secretsSchema');
  });
});
