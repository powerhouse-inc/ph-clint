import * as Sentry from '@sentry/node';

export interface SentryInitOptions {
  env: NodeJS.ProcessEnv;
  cliName: string;
  packageVersion: string;
}

export interface SentryHandle {
  captureException: (err: unknown) => void;
}

/**
 * Initialize Sentry if SENTRY_DSN is set in env. No-op (returns null) otherwise.
 * Env contract matches the switchboard pattern so tenant operators only learn one set of vars:
 *   SENTRY_DSN — required to enable
 *   SENTRY_ENVIRONMENT — defaults to tenant_id resource attr (handled upstream); falls back to 'production'
 *   SENTRY_RELEASE — defaults to packageVersion arg
 *   SENTRY_TRACES_SAMPLE_RATE — defaults to 0.1
 */
export function initSentry(opts: SentryInitOptions): SentryHandle | null {
  const dsn = opts.env.SENTRY_DSN;
  if (!dsn) return null;

  const environment = opts.env.SENTRY_ENVIRONMENT ?? 'production';
  const release = opts.env.SENTRY_RELEASE ?? opts.packageVersion;
  const tracesSampleRate = opts.env.SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(opts.env.SENTRY_TRACES_SAMPLE_RATE)
    : 0.1;

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    // The OTel SDK (initialized separately) is the source of truth for tracing;
    // SentrySpanProcessor in otel.ts forwards spans to Sentry. Avoid double-instrumenting.
    skipOpenTelemetrySetup: true,
  });

  return {
    captureException: (err: unknown) => Sentry.captureException(err),
  };
}
