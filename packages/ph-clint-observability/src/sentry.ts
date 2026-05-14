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
 *
 * Standard Sentry env vars are read natively by `@sentry/node`:
 *   - SENTRY_RELEASE          → release identifier (we fall back to
 *                               cliVersion only when this is unset)
 *   - SENTRY_ENVIRONMENT      → environment label (we don't override)
 *   - SENTRY_TRACES_SAMPLE_RATE → sample rate (we don't override)
 *
 * Anything we don't pass to Sentry.init() the SDK reads from process.env.
 * That keeps the operator CI pipeline in control — `SENTRY_RELEASE=$GIT_SHA`
 * works without any code change here.
 */
export async function initSentry(opts: SentryInitInput): Promise<SentryHandle> {
  const Sentry = await import('@sentry/node');
  const initOpts: Parameters<typeof Sentry.init>[0] = {
    dsn: opts.dsn,
    // Explicitly set the host name. With `defaultIntegrations: false` we
    // disable Sentry's `NodeContext` integration, which is what normally
    // populates `event.server_name`. Without this, errors in Sentry have no
    // host attribution — which makes multi-host/multi-pod deployments
    // impossible to triage. Operators can still override via
    // `SENTRY_SERVER_NAME` env (Sentry SDK reads it natively when serverName
    // is not passed, but ours wins if both are set — see below).
    serverName: process.env.SENTRY_SERVER_NAME ?? hostname(),
    defaultIntegrations: false,
    integrations: [],
    skipOpenTelemetrySetup: true,
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
