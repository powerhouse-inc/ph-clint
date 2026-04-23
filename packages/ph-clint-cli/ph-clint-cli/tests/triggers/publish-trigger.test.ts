/**
 * Unit tests for publish-trigger helpers.
 *
 * The full trigger is integration-heavy (reactor + publish pipeline), so
 * we test the pure logic: tag mapping.
 */
import { describe, it, expect } from '@jest/globals';
import { tagToCli } from '../../src/triggers/publish-trigger.js';

describe('tagToCli', () => {
  it('maps Dev → dev', () => {
    expect(tagToCli('Dev')).toBe('dev');
  });

  it('maps Staging → staging', () => {
    expect(tagToCli('Staging')).toBe('staging');
  });

  it('maps Production → production', () => {
    expect(tagToCli('Production')).toBe('production');
  });

  it('returns null for unknown tags', () => {
    expect(tagToCli('Beta')).toBeNull();
    expect(tagToCli('')).toBeNull();
  });
});
