import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { Tracer, Meter } from '@opentelemetry/api';
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base';

export interface OtelInitInput {
  endpoint: string;
  serviceName: string;
  version: string;
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
 * Three signals are exported to the same OTLP/HTTP base: traces to
 * `/v1/traces` (Tempo), metrics to `/v1/metrics` (Prometheus via the
 * collector), and logs to `/v1/logs` (Loki). A global LoggerProvider is
 * registered so callers reach it through the OTel logs API. Sentry, when
 * enabled, attaches its own span processor to the global tracer provider via
 * `otlpIntegration` (see sentry.ts) — initOtel knows nothing about it.
 */
export async function initOtel(opts: OtelInitInput): Promise<OtelHandle> {
  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { OTLPMetricExporter },
    { OTLPLogExporter },
    sdkMetrics,
    sdkTraceBase,
    sdkLogs,
    apiLogs,
    resourcesMod,
    apiMod,
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/exporter-logs-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
    import('@opentelemetry/sdk-trace-base'),
    import('@opentelemetry/sdk-logs'),
    import('@opentelemetry/api-logs'),
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

  // Logs ride a separate LoggerProvider (NodeSDK does not own logs) registered
  // as the global provider, so `logs.getLogger()` anywhere in the process emits
  // to it. The wraps emit trace-correlated error records (see wraps.ts).
  const loggerProvider = new sdkLogs.LoggerProvider({
    resource,
    processors: [
      new sdkLogs.BatchLogRecordProcessor(new OTLPLogExporter({ url: `${base}/v1/logs` })),
    ],
  });
  apiLogs.logs.setGlobalLoggerProvider(loggerProvider);

  return {
    tracer: apiMod.trace.getTracer(opts.serviceName, opts.version),
    meter: apiMod.metrics.getMeter(opts.serviceName, opts.version),
    shutdown: async () => {
      await Promise.all([sdk.shutdown(), loggerProvider.shutdown()]);
    },
  };
}
