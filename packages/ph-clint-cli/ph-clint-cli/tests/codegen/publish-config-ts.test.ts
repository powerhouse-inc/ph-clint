import { describe, it, expect } from '@jest/globals';
import { buildPublishConfigTs } from '../../src/codegen/builders/publish-config-ts.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildPublishConfigTs', () => {
  it('emits a publish config with app and cli packages', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      version: '0.1.0',
      features: { powerhouse: { enabled: true } },
    });
    const content = buildPublishConfigTs(spec);
    expect(content).toContain(
      "import { definePublishConfig } from '@powerhousedao/ph-clint-dev/publish'",
    );
    expect(content).toContain("'foo':");
    expect(content).toContain("version: '0.1.0'");
    expect(content).toContain("{ path: 'foo-app', category: 'app' }");
    expect(content).toContain("{ path: 'foo-cli', category: 'cli' }");
  });

  it('uses the spec version', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'bar',
      version: '2.3.4',
      features: { powerhouse: { enabled: true } },
    });
    const content = buildPublishConfigTs(spec);
    expect(content).toContain("version: '2.3.4'");
    expect(content).toContain("{ path: 'bar-app', category: 'app' }");
    expect(content).toContain("{ path: 'bar-cli', category: 'cli' }");
  });
});
