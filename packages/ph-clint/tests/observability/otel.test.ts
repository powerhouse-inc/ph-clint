import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.unstable_mockModule('@opentelemetry/sdk-node', () => {
  const start = jest.fn();
  const shutdown = jest.fn(() => Promise.resolve());
  const NodeSDK = jest.fn().mockImplementation((cfg: unknown) => ({ start, shutdown, cfg }));
  return { NodeSDK };
});

jest.unstable_mockModule('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn(() => []),
}));

jest.unstable_mockModule('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('@opentelemetry/sdk-metrics', () => ({
  PeriodicExportingMetricReader: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('@opentelemetry/sdk-trace-base', () => ({
  BatchSpanProcessor: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('@sentry/opentelemetry', () => ({
  SentrySpanProcessor: jest.fn().mockImplementation(() => ({})),
}));

const { NodeSDK } = await import('@opentelemetry/sdk-node');
const { initOtel } = await import('../../src/observability/otel.js');

describe('initOtel', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns null when no exporter endpoint is configured', () => {
    const result = initOtel({
      env: { NODE_ENV: 'production' },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
      sentryEnabled: false,
    });
    expect(result).toBeNull();
    expect(NodeSDK).not.toHaveBeenCalled();
  });

  it('returns null when tracing is not requested and NODE_ENV is not production', () => {
    const result = initOtel({
      env: { TEMPO_ENDPOINT: 'http://tempo:4318/v1/traces' },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
      sentryEnabled: false,
    });
    expect(result).toBeNull();
  });

  it('initializes when TEMPO_ENDPOINT is set in production', () => {
    const result = initOtel({
      env: {
        NODE_ENV: 'production',
        TEMPO_ENDPOINT: 'http://tempo:4318/v1/traces',
        TENANT_ID: 'dev',
      },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
      sentryEnabled: false,
    });
    expect(result).not.toBeNull();
    expect(NodeSDK).toHaveBeenCalledTimes(1);
    expect(result!.tracer).toBeDefined();
    expect(result!.meter).toBeDefined();
  });

  it('initializes when ENABLE_TRACING=true regardless of NODE_ENV', () => {
    const result = initOtel({
      env: {
        ENABLE_TRACING: 'true',
        TEMPO_ENDPOINT: 'http://tempo:4318/v1/traces',
      },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
      sentryEnabled: false,
    });
    expect(result).not.toBeNull();
  });

  it('initializes when SENTRY_DSN is set via sentryEnabled flag', () => {
    const result = initOtel({
      env: { NODE_ENV: 'production' },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
      sentryEnabled: true,
    });
    expect(result).not.toBeNull();
  });
});
