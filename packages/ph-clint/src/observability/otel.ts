import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { trace, metrics, type Tracer, type Meter } from '@opentelemetry/api';
import { SentrySpanProcessor } from '@sentry/opentelemetry';

export interface OtelInitOptions {
  env: NodeJS.ProcessEnv;
  cliName: string;
  packageVersion: string;
  /** True if initSentry() returned a non-null handle. Sentry-only mode still warrants OTel: spans flow to SentrySpanProcessor. */
  sentryEnabled: boolean;
}

export interface OtelHandle {
  sdk: NodeSDK;
  tracer: Tracer;
  meter: Meter;
  /** Call on process shutdown to flush in-flight spans/metrics. */
  shutdown: () => Promise<void>;
}

/**
 * Initialize OpenTelemetry NodeSDK with OTLP HTTP exporters when at least one trace
 * destination is configured (TEMPO_ENDPOINT, SENTRY_DSN-via-sentryEnabled, or
 * OTEL_EXPORTER_OTLP_ENDPOINT) AND tracing is requested (ENABLE_TRACING=true or
 * NODE_ENV=production). Otherwise returns null and OTel is a no-op.
 *
 * Same gate as powerhouse#2590's switchboard bootstrap so the platform tells
 * one story.
 */
export function initOtel(opts: OtelInitOptions): OtelHandle | null {
  const env = opts.env;
  const tracingRequested =
    env.ENABLE_TRACING === 'true' || env.NODE_ENV === 'production';
  const hasTraceDestination =
    Boolean(env.TEMPO_ENDPOINT) || opts.sentryEnabled;
  const hasMetricDestination = Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT);

  if (!tracingRequested && !hasMetricDestination) return null;
  if (!hasTraceDestination && !hasMetricDestination) return null;

  const tenantId = env.TENANT_ID || 'default';
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME || opts.cliName,
    [ATTR_SERVICE_VERSION]: opts.packageVersion,
    'tenant.id': tenantId,
    'deployment.environment': env.SENTRY_ENVIRONMENT || tenantId,
  });

  const spanProcessors: BatchSpanProcessor[] = [];
  if (env.TEMPO_ENDPOINT) {
    spanProcessors.push(new BatchSpanProcessor(new OTLPTraceExporter({ url: env.TEMPO_ENDPOINT })));
  }
  if (opts.sentryEnabled) {
    // SentrySpanProcessor extends SpanProcessor but is typed loosely upstream.
    // Cast intentional — confirmed working in switchboard's bootstrap.
    spanProcessors.push(new SentrySpanProcessor() as unknown as BatchSpanProcessor);
  }

  const metricReader = env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/metrics`,
        }),
        exportIntervalMillis: 5000,
      })
    : undefined;

  const sdk = new NodeSDK({
    resource,
    spanProcessors: tracingRequested && hasTraceDestination ? spanProcessors : undefined,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  return {
    sdk,
    tracer: trace.getTracer(opts.cliName, opts.packageVersion),
    meter: metrics.getMeter(opts.cliName, opts.packageVersion),
    shutdown: () => sdk.shutdown(),
  };
}
