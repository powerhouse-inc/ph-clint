import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.unstable_mockModule('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  getCurrentHub: jest.fn(() => ({ captureException: jest.fn() })),
}));

jest.unstable_mockModule('@opentelemetry/sdk-node', () => {
  const start = jest.fn();
  const shutdown = jest.fn(() => Promise.resolve());
  return { NodeSDK: jest.fn().mockImplementation(() => ({ start, shutdown })) };
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

const { initObservability } = await import('../../src/observability/index.js');

describe('initObservability', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns no-op handles when no telemetry env is set', () => {
    const obs = initObservability({ env: {}, cliName: 'ph-pirate', packageVersion: '1.0.0' });
    expect(obs.sentry).toBeNull();
    expect(obs.otel).toBeNull();
    expect(obs.metrics.llmTokens).toBeDefined();
    expect(obs.metrics.toolExecutions).toBeDefined();
    expect(obs.metrics.routineIterations).toBeDefined();
    expect(obs.metrics.agentStreamDuration).toBeDefined();
  });

  it('initializes both Sentry and OTel when env is fully set', () => {
    const obs = initObservability({
      env: {
        NODE_ENV: 'production',
        SENTRY_DSN: 'https://test@sentry/1',
        TEMPO_ENDPOINT: 'http://tempo:4318/v1/traces',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318',
        TENANT_ID: 'dev',
      },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
    });
    expect(obs.sentry).not.toBeNull();
    expect(obs.otel).not.toBeNull();
  });

  it('exposes a shutdown() that closes both', async () => {
    const obs = initObservability({
      env: {
        NODE_ENV: 'production',
        TEMPO_ENDPOINT: 'http://tempo:4318/v1/traces',
      },
      cliName: 'ph-pirate',
      packageVersion: '1.0.0',
    });
    await expect(obs.shutdown()).resolves.toBeUndefined();
  });
});
