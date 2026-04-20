import { describe, it, expect } from '@jest/globals';
import {
  validateConfig,
  resolveGroup,
  definePublishConfig,
} from '../../src/publish/config.js';
import type { PublishConfig } from '../../src/publish/types.js';

const validConfig: PublishConfig = {
  groups: {
    mylib: {
      version: '0.1.0',
      packages: [{ path: 'packages/mylib', category: 'lib' }],
    },
  },
};

describe('definePublishConfig', () => {
  it('returns the config as-is (identity function)', () => {
    const config = definePublishConfig(validConfig);
    expect(config).toBe(validConfig);
  });
});

describe('validateConfig', () => {
  it('accepts valid config', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('rejects non-object', () => {
    expect(() => validateConfig(null as unknown as PublishConfig)).toThrow(
      'must be an object',
    );
  });

  it('rejects missing groups', () => {
    expect(() => validateConfig({} as PublishConfig)).toThrow(
      'must have a "groups"',
    );
  });

  it('rejects empty groups', () => {
    expect(() => validateConfig({ groups: {} })).toThrow(
      'at least one group',
    );
  });

  it('rejects group without version', () => {
    expect(() =>
      validateConfig({
        groups: {
          bad: { version: '', packages: [{ path: '.', category: 'lib' }] },
        },
      }),
    ).toThrow('must have a "version"');
  });

  it('rejects group with empty packages', () => {
    expect(() =>
      validateConfig({
        groups: { bad: { version: '1.0.0', packages: [] } },
      }),
    ).toThrow('non-empty "packages"');
  });

  it('rejects invalid category', () => {
    expect(() =>
      validateConfig({
        groups: {
          bad: {
            version: '1.0.0',
            packages: [{ path: '.', category: 'invalid' as 'lib' }],
          },
        },
      }),
    ).toThrow('invalid category');
  });
});

describe('resolveGroup', () => {
  it('auto-selects single group', () => {
    const result = resolveGroup(validConfig);
    expect(result.name).toBe('mylib');
    expect(result.group.version).toBe('0.1.0');
  });

  it('selects named group', () => {
    const result = resolveGroup(validConfig, 'mylib');
    expect(result.name).toBe('mylib');
  });

  it('throws for unknown group', () => {
    expect(() => resolveGroup(validConfig, 'nope')).toThrow('not found');
  });

  it('throws when multiple groups and no --group', () => {
    const multi: PublishConfig = {
      groups: {
        a: { version: '1.0.0', packages: [{ path: '.', category: 'lib' }] },
        b: { version: '2.0.0', packages: [{ path: '.', category: 'cli' }] },
      },
    };
    expect(() => resolveGroup(multi)).toThrow('Use --group');
  });
});
