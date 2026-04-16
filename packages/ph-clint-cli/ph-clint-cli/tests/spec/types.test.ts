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
    const parsed = clintProjectSpecSchema.parse({ name: 'myproj' });
    expect(parsed.name).toBe('myproj');
    expect(parsed.version).toBe('0.1.0');
    expect(parsed.description).toBe('');
    expect(parsed.features.powerhouse.enabled).toBe(false);
    expect(parsed.features.powerhouse.switchboard).toBe(true);
    expect(parsed.features.powerhouse.connect).toBe(true);
    expect(parsed.features.mastra.enabled).toBe(false);
    expect(parsed.features.routine.enabled).toBe(false);
  });

  it('rejects invalid names (uppercase, leading dash)', () => {
    expect(() => clintProjectSpecSchema.parse({ name: 'MyProj' })).toThrow();
    expect(() => clintProjectSpecSchema.parse({ name: '-myproj' })).toThrow();
    expect(() => clintProjectSpecSchema.parse({ name: '' })).toThrow();
  });

  it('preserves explicit feature toggles', () => {
    const parsed = clintProjectSpecSchema.parse({
      name: 'foo',
      features: {
        powerhouse: { enabled: true, switchboard: false, connect: true },
        mastra: { enabled: true },
      },
    });
    expect(parsed.features.powerhouse.enabled).toBe(true);
    expect(parsed.features.powerhouse.switchboard).toBe(false);
    expect(parsed.features.mastra.enabled).toBe(true);
    expect(parsed.features.routine.enabled).toBe(false);
  });
});

describe('spec name helpers', () => {
  it('composes a scoped package name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', scope: 'acme' });
    expect(getPackageName(spec)).toBe('@acme/foo');
  });

  it('composes an unscoped package name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    expect(getPackageName(spec)).toBe('foo');
  });

  it('defaults bin name to the project name when unset', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    expect(getBinName(spec)).toBe('foo');
  });

  it('honours an explicit bin name', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo', bin: 'foobar' });
    expect(getBinName(spec)).toBe('foobar');
  });

  it('derives split-layout folder names', () => {
    const spec = clintProjectSpecSchema.parse({ name: 'foo' });
    expect(getCliFolderName(spec)).toBe('foo-cli');
    expect(getAppFolderName(spec)).toBe('foo-app');
  });
});
