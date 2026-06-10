import { hostname } from 'node:os';

export interface SentryInitInput {
  dsn: string;
  /**
   * Fallback release identifier (typically the CLI's package version).
   * Used ONLY when `SENTRY_RELEASE` is not set in the environment — the
   * Sentry SDK reads `SENTRY_RELEASE` natively, and operator CI pipelines
   * commonly set it to a git SHA. We must not override that.
   */
  fallbackRelease?: string;
  /**
   * When set, OTel spans are exported to this collector instead of Sentry's
   * DSN-derived OTLP endpoint. Leave unset to send spans to Sentry.
   */
  collectorUrl?: string;
}

export interface SentryHandle {
  captureException: (err: unknown) => void;
  flush: (timeoutMs?: number) => Promise<boolean>;
}

/**
 * Lightweight Sentry init via `@sentry/node-core/light`. The framework owns the
 * OpenTelemetry SDK (otel.ts), so the light build is paired with
 * `otlpIntegration`: it attaches its own span processor to the already-registered
 * global tracer provider and forwards finished spans to Sentry over OTLP. No
 * auto-instrumentation, no Sentry-owned OTel setup, no Node stdlib patching.
 *
 * Call AFTER initOtel — the integration needs the global provider to exist so it
 * can attach to it rather than spin up its own minimal one.
 *
 * Standard Sentry env vars are read natively by the SDK (`SENTRY_RELEASE`,
 * `SENTRY_ENVIRONMENT`). We set `release` only as a fallback when
 * `SENTRY_RELEASE` is unset, and `serverName` for host attribution.
 */
export async function initSentry(opts: SentryInitInput): Promise<SentryHandle> {
  const Sentry = await import('@sentry/node-core/light');
  const { otlpIntegration } = await import('@sentry/node-core/light/otlp');

  const initOpts: Parameters<typeof Sentry.init>[0] = {
    dsn: opts.dsn,
    serverName: process.env.SENTRY_SERVER_NAME ?? hostname(),
    integrations: [otlpIntegration({ collectorUrl: opts.collectorUrl })],
  };
  // Only set release as a fallback — never override an env-provided value.
  if (!process.env.SENTRY_RELEASE && opts.fallbackRelease) {
    initOpts.release = opts.fallbackRelease;
  }
  Sentry.init(initOpts);

  return {
    captureException: (err) => { Sentry.captureException(err); },
    flush: (timeoutMs = 2000) => Sentry.flush(timeoutMs),
  };
}
