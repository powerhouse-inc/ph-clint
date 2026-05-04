/**
 * Tests for the spec-change trigger.
 *
 * - Pure function tests for hashSpec.
 * - Structural tests for the trigger definition.
 *
 * Full integration tests (reactor + codegen + file verification) are covered
 * by the switchboard e2e test (tests/e2e/switchboard.test.ts) which spawns
 * the CLI as a subprocess — required because the reactor's dependency tree
 * includes CJS→ESM incompatibilities that Jest cannot load in-process.
 */
import { describe, it, expect } from '@jest/globals';
import { clintProjectSpecSchema } from '../../src/spec/types.js';
import { hashSpec, specChangeTrigger } from '../../src/triggers/spec-change.js';

// ── Helpers ──────────────────────────────────────────────────────

function makeSpec(overrides: Record<string, unknown> = {}) {
  return clintProjectSpecSchema.parse({ name: 'test-project-cli', ...overrides });
}

// ── hashSpec ─────────────────────────────────────────────────────

describe('hashSpec', () => {
  it('returns a 64-char hex SHA-256 hash', () => {
    expect(hashSpec(makeSpec())).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for identical specs', () => {
    const spec = makeSpec();
    expect(hashSpec(spec)).toBe(hashSpec(spec));
  });

  it('changes when a codegen-relevant field changes', () => {
    expect(hashSpec(makeSpec({ description: 'a' }))).not.toBe(
      hashSpec(makeSpec({ description: 'b' })),
    );
  });

  it('excludes documentId from the hash', () => {
    expect(hashSpec(makeSpec())).toBe(
      hashSpec(makeSpec({ documentId: 'abc-123' })),
    );
  });

  it('excludes documentType from the hash', () => {
    expect(hashSpec(makeSpec())).toBe(
      hashSpec(makeSpec({ documentType: 'powerhouse/ph-clint-project' })),
    );
  });

  it('excludes both documentId and documentType', () => {
    expect(hashSpec(makeSpec())).toBe(
      hashSpec(makeSpec({
        documentId: 'abc-123',
        documentType: 'powerhouse/ph-clint-project',
      })),
    );
  });

  it('changes when packages change', () => {
    const a = makeSpec({ packages: [{ id: 'p', packageName: 'x', documentTypes: ['a/b'] }] });
    const b = makeSpec({ packages: [{ id: 'p', packageName: 'x', documentTypes: ['a/b', 'c/d'] }] });
    expect(hashSpec(a)).not.toBe(hashSpec(b));
  });

  it('is order-independent for object keys', () => {
    const a = clintProjectSpecSchema.parse({ name: 'foo-cli', description: 'bar', version: '1.0.0' });
    const b = clintProjectSpecSchema.parse({ version: '1.0.0', name: 'foo-cli', description: 'bar' });
    expect(hashSpec(a)).toBe(hashSpec(b));
  });
});

// ── Trigger definition ───────────────────────────────────────────

describe('specChangeTrigger (definition)', () => {
  it('has id "spec-change" and type "condition"', () => {
    expect(specChangeTrigger.id).toBe('spec-change');
    expect(specChangeTrigger.type).toBe('condition');
  });

  it('initial state has pending: 0', () => {
    expect(specChangeTrigger.state!()).toEqual({ pending: 0 });
  });

  it('has setup and poll functions', () => {
    expect(typeof specChangeTrigger.setup).toBe('function');
    expect(typeof specChangeTrigger.poll).toBe('function');
  });
});
