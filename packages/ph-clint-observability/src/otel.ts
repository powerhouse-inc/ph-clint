import type { Tracer, Meter } from '@opentelemetry/api';
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base';

export interface OtelInitInput {
  endpoint: string;
  serviceName: string;
  version: string;
  sentryEnabled: boolean;
}

export interface OtelHandle {
  tracer: Tracer;
  meter: Meter;
  shutdown: () => Promise<void>;
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}

/**
 * Dynamic-imported OpenTelemetry NodeSDK init. No auto-instrumentation:
 * the framework's wrap registry provides all instrumentation points, so
 * there is zero monkey-patching of Node stdlib. The SDK loads, sets up
 * BatchSpanProcessor + PeriodicExportingMetricReader against the configured
 * OTLP HTTP endpoint, and stops.
 *
 * If Sentry is also enabled, SentrySpanProcessor is added so spans flow to
 * both Tempo/OTLP backend AND Sentry — single source, two sinks, matching
 * trace IDs.
 */
export async function initOtel(opts: OtelInitInput): Promise<OtelHandle> {
  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { OTLPMetricExporter },
    sdkMetrics,
    sdkTraceBase,
    resourcesMod,
    semconv,
    apiMod,
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
    import('@opentelemetry/sdk-trace-base'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/semantic-conventions'),
    import('@opentelemetry/api'),
  ]);

  const base = stripTrailingSlash(opts.endpoint);
  const resource = resourcesMod.resourceFromAttributes({
    [semconv.ATTR_SERVICE_NAME]: opts.serviceName,
    [semconv.ATTR_SERVICE_VERSION]: opts.version,
  });

  const spanProcessors: SpanProcessor[] = [
    new sdkTraceBase.BatchSpanProcessor(new OTLPTraceExporter({ url: `${base}/v1/traces` })),
  ];
  if (opts.sentryEnabled) {
    const { SentrySpanProcessor } = await import('@sentry/opentelemetry');
    // SentrySpanProcessor extends SpanProcessor but its declared type from
    // @sentry/opentelemetry can drift from the host @opentelemetry/sdk-trace-base
    // version. Cast is intentional — confirmed working at runtime.
    spanProcessors.push(new SentrySpanProcessor() as unknown as SpanProcessor);
  }

  const metricReader = new sdkMetrics.PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${base}/v1/metrics` }),
    exportIntervalMillis: 5000,
  });

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReader,
    // instrumentations: intentionally NOT specified — no auto-instrumentation.
  });
  sdk.start();

  return {
    tracer: apiMod.trace.getTracer(opts.serviceName, opts.version),
    meter: apiMod.metrics.getMeter(opts.serviceName, opts.version),
    shutdown: () => sdk.shutdown(),
  };
}
