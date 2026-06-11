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
  /** Diagnostic sink for init-time decisions (e.g. OTLP span export skipped). */
  log?: (message: string) => void;
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

  const initOpts: Parameters<typeof Sentry.init>[0] = {
    dsn: opts.dsn,
    serverName: process.env.SENTRY_SERVER_NAME ?? hostname(),
    integrations: [],
  };

  // The span exporter is only safe to attach when its OTLP traces endpoint
  // actually accepts ingestion. A self-hosted Sentry without the OTLP-traces
  // feature answers 403 on every batch, surfacing as a flood of unhandled
  // OTLPExporterError rejections (which Sentry itself then captures). Probe
  // once and only import/attach the integration when the endpoint is live.
  // An explicit collectorUrl is trusted as-is — it targets an operator's own
  // collector, not the DSN-derived endpoint this guard is about.
  const tracesEndpoint = opts.collectorUrl
    ? null
    : deriveOtlpTracesEndpoint(opts.dsn);
  const otlpEnabled =
    !!opts.collectorUrl ||
    (!!tracesEndpoint &&
      (await otlpTracesEndpointAccepts(tracesEndpoint.url, tracesEndpoint.publicKey)));
  if (otlpEnabled) {
    const { otlpIntegration } = await import('@sentry/node-core/light/otlp');
    initOpts.integrations = [otlpIntegration({ collectorUrl: opts.collectorUrl })];
  } else {
    opts.log?.(
      `[observability] OTLP span export disabled — traces endpoint ${tracesEndpoint?.url ?? '(unresolved)'} not reachable/accepted. Error capture is unaffected.`,
    );
  }

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

/**
 * Rebuild the DSN-derived OTLP traces endpoint the Sentry light integration
 * targets (`…/api/<projectId>/integration/otlp/v1/traces/`) so we can probe
 * the exact URL before attaching the exporter. Mirrors otlpIntegration's own
 * derivation. Returns null on an unparseable DSN.
 */
export function deriveOtlpTracesEndpoint(
  dsn: string,
): { url: string; publicKey: string } | null {
  try {
    const u = new URL(dsn);
    const segments = u.pathname.split('/').filter(Boolean);
    const projectId = segments.pop();
    if (!projectId) return null;
    const basePath = segments.length ? `/${segments.join('/')}` : '';
    const portStr = u.port ? `:${u.port}` : '';
    const protocol = u.protocol.replace(/:$/, '');
    return {
      url: `${protocol}://${u.hostname}${portStr}${basePath}/api/${projectId}/integration/otlp/v1/traces/`,
      publicKey: u.username,
    };
  } catch {
    return null;
  }
}

/**
 * One-shot reachability probe. Treats 403/404 (feature disabled / not routed)
 * and any network failure as "do not attach"; any other response means the
 * endpoint is live (a 400 on the empty probe body still confirms ingestion is
 * reachable). Bounded by a short timeout so a dead host can't stall startup.
 */
async function otlpTracesEndpointAccepts(
  url: string,
  publicKey: string,
  timeoutMs = 1500,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: new Uint8Array(),
      signal: controller.signal,
    });
    return res.status !== 403 && res.status !== 404;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
