import { describe, it, expect } from '@jest/globals';
import {
  parseSemver,
  isValidSemver,
  isValidSemverWithPre,
  validateBump,
  computeVersion,
} from '../../src/publish/version.js';

describe('parseSemver', () => {
  it('parses valid semver', () => {
    expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
    expect(parseSemver('0.0.0')).toEqual([0, 0, 0]);
    expect(parseSemver('10.20.30')).toEqual([10, 20, 30]);
  });

  it('returns null for invalid semver', () => {
    expect(parseSemver('1.2')).toBeNull();
    expect(parseSemver('1.2.3-beta.1')).toBeNull();
    expect(parseSemver('abc')).toBeNull();
    expect(parseSemver('')).toBeNull();
  });
});

describe('isValidSemver', () => {
  it('accepts valid base versions', () => {
    expect(isValidSemver('0.1.0')).toBe(true);
    expect(isValidSemver('1.0.0')).toBe(true);
  });

  it('rejects prerelease versions', () => {
    expect(isValidSemver('1.0.0-dev.1')).toBe(false);
  });

  it('rejects non-semver', () => {
    expect(isValidSemver('not-a-version')).toBe(false);
  });
});

describe('isValidSemverWithPre', () => {
  it('accepts base and prerelease versions', () => {
    expect(isValidSemverWithPre('1.0.0')).toBe(true);
    expect(isValidSemverWithPre('1.0.0-dev.1')).toBe(true);
    expect(isValidSemverWithPre('0.2.0-staging.5')).toBe(true);
  });
});

describe('validateBump', () => {
  it('accepts valid bumps', () => {
    expect(validateBump('0.1.0', '0.2.0')).toEqual([]);
    expect(validateBump('0.1.0', '1.0.0')).toEqual([]);
    expect(validateBump('1.0.0', '1.0.1')).toEqual([]);
  });

  it('rejects same version', () => {
    const issues = validateBump('0.1.0', '0.1.0');
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('must be greater');
  });

  it('rejects downgrade', () => {
    const issues = validateBump('0.2.0', '0.1.0');
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('must be greater');
  });

  it('rejects invalid semver', () => {
    const issues = validateBump('0.1.0', 'abc');
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('not valid semver');
  });
});

describe('computeVersion', () => {
  it('returns base version for production', () => {
    expect(computeVersion('1.0.0', 'production', null)).toBe('1.0.0');
  });

  it('starts at 0 when no existing prerelease', () => {
    expect(computeVersion('0.2.0', 'dev', null)).toBe('0.2.0-dev.0');
    expect(computeVersion('0.2.0', 'staging', null)).toBe('0.2.0-staging.0');
  });

  it('increments from latest prerelease', () => {
    expect(computeVersion('0.2.0', 'dev', 3)).toBe('0.2.0-dev.4');
    expect(computeVersion('0.2.0', 'staging', 0)).toBe('0.2.0-staging.1');
  });
});
