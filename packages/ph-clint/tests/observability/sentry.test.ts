import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.unstable_mockModule('@sentry/node', () => {
  const captureException = jest.fn();
  const init = jest.fn();
  return {
    init,
    captureException,
    getCurrentHub: jest.fn(() => ({ captureException })),
  };
});

const Sentry = await import('@sentry/node');
const { initSentry } = await import('../../src/observability/sentry.js');

describe('initSentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when SENTRY_DSN is unset', () => {
    const result = initSentry({ env: {}, cliName: 'ph-pirate', packageVersion: '1.0.0' });
    expect(result).toBeNull();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry when SENTRY_DSN is set', () => {
    const result = initSentry({
      env: {
        SENTRY_DSN: 'https://test@sentry.example.com/1',
        SENTRY_ENVIRONMENT: 'dev',
      },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
    });
    expect(result).not.toBeNull();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://test@sentry.example.com/1',
      environment: 'dev',
      release: '1.0.0',
    }));
  });

  it('falls back to packageVersion for release', () => {
    initSentry({
      env: { SENTRY_DSN: 'https://test@sentry.example.com/1' },
      cliName: 'ph-pirate',
      packageVersion: '2.3.4',
    });
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ release: '2.3.4' }));
  });

  it('respects SENTRY_RELEASE override', () => {
    initSentry({
      env: { SENTRY_DSN: 'https://test@sentry.example.com/1', SENTRY_RELEASE: 'v9' },
      cliName: 'ph-pirate',
      packageVersion: '2.3.4',
    });
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ release: 'v9' }));
  });

  it('respects SENTRY_TRACES_SAMPLE_RATE override', () => {
    initSentry({
      env: { SENTRY_DSN: 'https://test@sentry.example.com/1', SENTRY_TRACES_SAMPLE_RATE: '0.5' },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
    });
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 0.5 }));
  });
});
