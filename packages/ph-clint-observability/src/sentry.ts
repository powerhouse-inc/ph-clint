export interface SentryInitInput {
  dsn: string;
  release?: string;
}

export interface SentryHandle {
  captureException: (err: unknown) => void;
  flush: (timeoutMs?: number) => Promise<boolean>;
}

/**
 * Dynamic-imported Sentry initialization. Loaded only when a SENTRY_DSN-equivalent
 * is configured — keeps the SDK out of memory when telemetry is off.
 *
 * Default integrations and Sentry's own OTel setup are disabled:
 *   - defaultIntegrations: false  → no console patching, no HTTP breadcrumbs,
 *                                   no Express integration, no global uncaught
 *                                   handlers we didn't ask for.
 *   - integrations: []             → explicit empty list.
 *   - skipOpenTelemetrySetup: true → our otel.ts owns the tracer + meter
 *                                    providers; SentrySpanProcessor bridges
 *                                    spans to Sentry from there.
 */
export async function initSentry(opts: SentryInitInput): Promise<SentryHandle> {
  const Sentry = await import('@sentry/node');
  Sentry.init({
    dsn: opts.dsn,
    release: opts.release,
    defaultIntegrations: false,
    integrations: [],
    skipOpenTelemetrySetup: true,
  });
  return {
    captureException: (err) => { Sentry.captureException(err); },
    flush: (timeoutMs = 2000) => Sentry.flush(timeoutMs),
  };
}
