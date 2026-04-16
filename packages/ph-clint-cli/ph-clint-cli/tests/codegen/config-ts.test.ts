import { describe, it, expect } from '@jest/globals';
import { buildConfigTs } from '../../src/codegen/builders/config-ts.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildConfigTs', () => {
  it('no features — empty schemas', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    const code = buildConfigTs(spec);
    expect(code).toContain("export const CLI_NAME = 'foo'");
    expect(code).toContain("export const CLI_VERSION = '0.1.0'");
    expect(code).toContain('export const configSchema = z.object({\n});');
    expect(code).toContain('export const secretsSchema = z.object({\n});');
  });

  it('mastra on — adds model field + apiKey secret', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { mastra: { enabled: true } },
    });
    const code = buildConfigTs(spec);
    expect(code).toContain('model: z.string()');
    expect(code).toContain('apiKey: z.string().optional()');
  });

  it('powerhouse on — adds switchboardPort + connectPort', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: { powerhouse: { enabled: true } },
    });
    const code = buildConfigTs(spec);
    expect(code).toContain('switchboardPort: z.number().default(4001)');
    expect(code).toContain('connectPort: z.number().default(3000)');
  });

  it('powerhouse with both sub-toggles off — omits both ports', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      features: {
        powerhouse: { enabled: true, switchboard: false, connect: false },
      },
    });
    const code = buildConfigTs(spec);
    expect(code).not.toContain('switchboardPort');
    expect(code).not.toContain('connectPort');
  });

  it('honours custom bin name in CLI_NAME', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', bin: 'foobar' });
    const code = buildConfigTs(spec);
    expect(code).toContain("export const CLI_NAME = 'foobar'");
  });
});
