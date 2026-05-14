import { describe, it, expect } from '@jest/globals';
import {
  clintProjectSpecSchema,
  getAppFolderName,
  getBinName,
  getCliFolderName,
  getPackageName,
} from '../../src/spec/types.js';

describe('clintProjectSpecSchema', () => {
  it('accepts a minimal spec and applies defaults', () => {
    const parsed = clintProjectSpecSchema.parse({ name: 'myproj-cli' });
    expect(parsed.name).toBe('myproj-cli');
    expect(parsed.version).toBe('0.0.1-dev.0');
    expect(parsed.description).toBe('');
    expect(parsed.features.powerhouse).toBe('Disabled');
    expect(parsed.features.mastra.enabled).toBe(false);
    expect(parsed.features.mastra.mainAgent).toBeNull();
    expect(parsed.features.mastra.subAgents).toEqual([]);
    expect(parsed.features.mastra.models).toEqual([]);
    expect(parsed.features.mastra.profiles).toEqual([]);
    expect(parsed.features.routine.enabled).toBe(false);
  });

  it('rejects invalid names (uppercase, leading dash, no -cli suffix)', () => {
    expect(() => clintProjectSpecSchema.parse({ name: 'MyProj' })).toThrow();
    expect(() => clintProjectSpecSchema.parse({ name: '-myproj-cli' })).toThrow();
    expect(() => clintProjectSpecSchema.parse({ name: '' })).toThrow();
    expect(() => clintProjectSpecSchema.parse({ name: 'myproj' })).toThrow();
  });

  it('preserves explicit feature toggles', () => {
    const parsed = clintProjectSpecSchema.parse({
      name: 'foo-cli',
      features: {
        powerhouse: 'Connect',
        mastra: { enabled: true },
      },
    });
    expect(parsed.features.powerhouse).toBe('Connect');
    expect(parsed.features.mastra.enabled).toBe(true);
    expect(parsed.features.routine.enabled).toBe(false);
  });
});

describe('spec name helpers', () => {
  it('composes a scoped package name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli', scope: '@acme' });
    expect(getPackageName(spec)).toBe('@acme/foo-cli');
  });

  it('composes an unscoped package name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(getPackageName(spec)).toBe('foo-cli');
  });

  it('derives bin name by stripping -cli suffix', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(getBinName(spec)).toBe('foo');
  });

  it('derives split-layout folder names', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo-cli' });
    expect(getCliFolderName(spec)).toBe('foo-cli');
    expect(getAppFolderName(spec)).toBe('foo-app');
  });
});
