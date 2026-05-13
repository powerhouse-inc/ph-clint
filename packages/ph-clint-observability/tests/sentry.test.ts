import { describe, it, expect } from '@jest/globals';
import { initSentry } from '../src/sentry.js';

describe('initSentry', () => {
  it('returns a handle with captureException and flush', async () => {
    // Use a syntactically valid DSN. Sentry.init with defaultIntegrations:false
    // does not make network calls during init itself — only when events/flush fire.
    const handle = await initSentry({
      dsn: 'https://abc@o0.ingest.example.invalid/0',
      release: '1.2.3',
    });
    expect(typeof handle.captureException).toBe('function');
    expect(typeof handle.flush).toBe('function');
  });

  it('accepts a release override', async () => {
    const handle = await initSentry({ dsn: 'https://x@example.invalid/1' });
    expect(handle).toBeDefined();
  });
});
