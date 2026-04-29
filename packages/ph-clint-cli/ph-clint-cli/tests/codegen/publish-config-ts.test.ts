import { describe, it, expect } from '@jest/globals';
import { buildPublishConfigTs } from '../../src/codegen/builders/publish-config-ts.js';
import { clintProjectSpecSchema } from '../../src/spec/types.js';

describe('buildPublishConfigTs', () => {
  it('emits a publish config with app and cli packages', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'foo',
      version: '0.1.0',
      features: { powerhouse: 'Connect' },
    });
    const content = buildPublishConfigTs(spec);
    expect(content).not.toContain('import');
    expect(content).toContain('export default');
    expect(content).toContain("'foo':");
    expect(content).toContain("version: '0.1.0'");
    expect(content).toContain("{ path: 'foo-app', category: 'app' }");
    expect(content).toContain("{ path: 'foo-cli', category: 'cli' }");
  });

  it('strips prerelease suffix from version', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'bar',
      version: '2.3.4-dev.5',
      features: { powerhouse: 'Connect' },
    });
    const content = buildPublishConfigTs(spec);
    expect(content).toContain("version: '2.3.4'");
    expect(content).toContain("{ path: 'bar-app', category: 'app' }");
    expect(content).toContain("{ path: 'bar-cli', category: 'cli' }");
  });

  it('single layout — emits a single package at "."', () => {
    const spec = clintProjectSpecSchema.parse({
      name: 'baz',
      version: '1.0.0',
    });
    const content = buildPublishConfigTs(spec);
    expect(content).toContain("{ path: '.', category: 'cli' }");
    expect(content).not.toContain('baz-app');
    expect(content).not.toContain('baz-cli');
  });
});
