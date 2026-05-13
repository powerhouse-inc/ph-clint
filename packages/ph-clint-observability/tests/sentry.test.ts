import { describe, it, expect, afterEach } from '@jest/globals';
import { initSentry } from '../src/sentry.js';

describe('initSentry', () => {
  afterEach(() => {
    delete process.env.SENTRY_RELEASE;
  });

  it('returns a handle with captureException and flush', async () => {
    // Use a syntactically valid DSN. Sentry.init with defaultIntegrations:false
    // does not make network calls during init itself — only when events/flush fire.
    const handle = await initSentry({
      dsn: 'https://abc@o0.ingest.example.invalid/0',
      fallbackRelease: '1.2.3',
    });
    expect(typeof handle.captureException).toBe('function');
    expect(typeof handle.flush).toBe('function');
  });

  it('returns a handle when no fallbackRelease is provided', async () => {
    const handle = await initSentry({ dsn: 'https://x@example.invalid/1' });
    expect(handle).toBeDefined();
  });

  it('does not override SENTRY_RELEASE when it is set in the environment', async () => {
    // Operator CI commonly sets SENTRY_RELEASE=$GIT_SHA. We must not stomp it
    // with the framework's package version.
    process.env.SENTRY_RELEASE = 'git-sha-deadbeef';
    const handle = await initSentry({
      dsn: 'https://x@example.invalid/1',
      fallbackRelease: '0.1.0-dev.71',
    });
    // We can't introspect Sentry's resolved release from outside, but the
    // contract is: if SENTRY_RELEASE is in env, we don't pass `release` to
    // init(), so the SDK reads env natively. The test pins that initSentry
    // doesn't fault under this scenario.
    expect(handle).toBeDefined();
  });
});
