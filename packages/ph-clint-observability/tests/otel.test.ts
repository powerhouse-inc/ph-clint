import { describe, it, expect } from '@jest/globals';
import { buildResourceAttributes, HOST_NAME } from '../src/otel.js';
import { hostname } from 'node:os';

describe('buildResourceAttributes', () => {
  it('emits service.name, service.version, and service.instance.id', () => {
    const attrs = buildResourceAttributes({ serviceName: 'my-cli', version: '1.2.3' });
    expect(attrs['service.name']).toBe('my-cli');
    expect(attrs['service.version']).toBe('1.2.3');
    expect(typeof attrs['service.instance.id']).toBe('string');
    // UUID v4 shape
    expect(attrs['service.instance.id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('service.instance.id is stable across calls within the same process', () => {
    // Different calls with different opts should still return the SAME
    // instance id — it's a per-process identifier, not per-call.
    const a = buildResourceAttributes({ serviceName: 'a', version: '1.0.0' });
    const b = buildResourceAttributes({ serviceName: 'b', version: '2.0.0' });
    expect(a['service.instance.id']).toBe(b['service.instance.id']);
  });
});

describe('HOST_NAME', () => {
  it('matches os.hostname()', () => {
    expect(HOST_NAME).toBe(hostname());
  });
});
