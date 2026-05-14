import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { Tracer, Meter } from '@opentelemetry/api';
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base';

export interface OtelInitInput {
  endpoint: string;
  serviceName: string;
  version: string;
  sentryEnabled: boolean;
}

/**
 * Per-process instance id. Generated once at module load so every span and
 * metric from this process carries the same value. Distinguishes multiple
 * processes of the same service on the same host — useful when several CLI
 * invocations run concurrently (e.g., in a pod with many short-lived calls).
 */
const SERVICE_INSTANCE_ID = randomUUID();

/** The host this process is running on. Exported for the Sentry init too. */
export const HOST_NAME = hostname();

/**
 * Build the explicit resource-attribute map that initOtel passes to
 * `resourceFromAttributes()`. NodeSDK's default detectors layer host.name /
 * host.id / host.arch / process.* on top — those are NOT added here, the
 * SDK adds them at runtime.
 *
 * Extracted as a pure function so tests can pin the explicit-attribute
 * contract without booting NodeSDK.
 */
export function buildResourceAttributes(opts: { serviceName: string; version: string }): Record<string, string> {
  return {
    'service.name': opts.serviceName,
    'service.version': opts.version,
    'service.instance.id': SERVICE_INSTANCE_ID,
  };
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
    apiMod,
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
    import('@opentelemetry/sdk-trace-base'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/api'),
  ]);

  const base = stripTrailingSlash(opts.endpoint);
  // host.name / host.id / host.arch / process.* are auto-populated by NodeSDK's
  // default resource detectors (hostDetector, osDetector, processDetector).
  // We add service.instance.id explicitly via buildResourceAttributes —
  // distinguishes multiple processes of the same service on the same host,
  // which the default detector set doesn't reliably cover across SDK versions.
  // Operators can layer arbitrary tags on top via OTEL_RESOURCE_ATTRIBUTES
  // (the envDetector in NodeSDK's default set picks those up).
  const resource = resourcesMod.resourceFromAttributes(
    buildResourceAttributes({ serviceName: opts.serviceName, version: opts.version }),
  );

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
