import { z } from 'zod';
import type { LifecycleHook, LifecycleHandle, LifecycleInitContext } from '@powerhousedao/ph-clint';
import { readConsent, writeConsent, promptForConsent, type ConsentValue } from './consent.js';

export interface ObservabilityOptions {
  /**
   * Override the consent prompter — primarily a test hook. Returns the
   * desired consent value (granted/denied). When omitted, the plugin uses
   * `promptForConsent` against `process.stdin` and `process.stdout`.
   */
  promptOverride?: (input: {
    cliName: string;
    sentryDsn?: string;
    otelEndpoint?: string;
  }) => Promise<ConsentValue>;
}

export const observabilityConfigSchema = z.object({
  sentryDsn: z.string().url().optional()
    .describe('Sentry DSN. If unset, Sentry is not initialized.'),
  otelExporterOtlpEndpoint: z.string().url().optional()
    .describe('OTLP HTTP base endpoint for traces, metrics, and logs. If unset, OTel is not initialized.'),
  telemetryConsent: z.enum(['granted', 'denied']).optional()
    .describe(
      'Pre-set telemetry consent and skip the interactive prompt. ' +
      'Authoritative per-run (not persisted), takes precedence over the stored decision. ' +
      'Use for non-interactive / deployed runs.',
    ),
});

export type ObservabilityConfig = z.infer<typeof observabilityConfigSchema>;

/**
 * The observability LifecycleHook factory. Register with:
 *
 *   defineCli({ lifecycle: [observability()] })
 *
 * Reads `sentryDsn` and `otelExporterOtlpEndpoint` from the resolved config
 * (via the merged schema fragment above). When neither is configured, returns
 * no contributions — identity wraps everywhere, zero overhead, one info log.
 *
 * When a destination is configured, asks the end-user for consent on first
 * run (interactive TTY only), persisting the decision to
 * `~/.ph/<cliname>/observability-consent.json`. Setting `telemetryConsent` in
 * config skips the prompt entirely — use it for non-interactive / deployed runs.
 */
export function observability(opts: ObservabilityOptions = {}): LifecycleHook {
  return {
    name: 'observability',
    configSchema: observabilityConfigSchema,
    async onInit(ctx: LifecycleInitContext): Promise<LifecycleHandle> {
      const sentryDsn = (ctx.config as ObservabilityConfig).sentryDsn;
      const otelEndpoint = (ctx.config as ObservabilityConfig).otelExporterOtlpEndpoint;
      const configuredConsent = (ctx.config as ObservabilityConfig).telemetryConsent;

      if (!sentryDsn && !otelEndpoint) {
        ctx.log.info('[observability] No destinations configured. Identity wraps active.');
        return {};
      }

      // ── Consent gate ──────────────────────────────────────────────
      // Config consent is authoritative and skips the prompt + stored decision.
      // It is not persisted — the config is re-supplied each run.
      let consent: ConsentValue;
      if (configuredConsent) {
        consent = configuredConsent;
        ctx.log.info(`[observability] Telemetry consent '${consent}' set via config; skipping prompt.`);
      } else {
        consent = (await readConsent(ctx.userStoreFolder)).consent;
        if (consent === 'unknown') {
          if (ctx.isInteractive) {
            consent = opts.promptOverride
              ? await opts.promptOverride({ cliName: ctx.cliName, sentryDsn, otelEndpoint })
              : await promptForConsent({ cliName: ctx.cliName, sentryDsn, otelEndpoint });
            await writeConsent(ctx.userStoreFolder, { consent, promptedAt: new Date().toISOString() });
          } else {
            // Non-interactive runs default to denied (safer for CI). Persist so
            // subsequent interactive runs can re-prompt by editing the file.
            consent = 'denied';
            await writeConsent(ctx.userStoreFolder, { consent: 'denied', promptedAt: new Date().toISOString() });
            ctx.log.info(
              `[observability] Telemetry destinations configured but no consent recorded. ` +
              `Defaulting to denied for non-interactive run. Set telemetryConsent in config ` +
              `or edit ${ctx.userStoreFolder}/observability-consent.json to opt in.`,
            );
            return {};
          }
        }
      }

      if (consent === 'denied') {
        ctx.log.info('[observability] Telemetry consent denied. Skipping initialization.');
        return {};
      }

      // consent === 'granted' — initialize SDKs and contribute wraps.
      const { initSentry } = await import('./sentry.js');
      const { initOtel } = await import('./otel.js');
      const { buildMetricInstruments, buildWraps, emitBootstrapSpan } = await import('./wraps.js');

      // OTel first: it registers the global tracer provider that Sentry's
      // otlpIntegration attaches its span processor to.
      const otel = otelEndpoint
        ? await initOtel({
            endpoint: otelEndpoint,
            serviceName: ctx.cliName,
            version: ctx.cliVersion,
          })
        : null;
      const sentry = sentryDsn ? await initSentry({ dsn: sentryDsn, fallbackRelease: ctx.cliVersion }) : null;

      const metricInstruments = buildMetricInstruments(otel, ctx.cliName, ctx.cliVersion);
      const wraps = buildWraps(metricInstruments, sentry);

      // Retroactive bootstrap span — only useful when OTel is producing real spans.
      if (otel) {
        try {
          emitBootstrapSpan(otel, ctx.bootTimings);
        } catch (err) {
          ctx.log.debug(`[observability] failed to emit bootstrap span: ${(err as Error).message}`);
        }
      }

      return {
        contribute: wraps,
        shutdown: async () => {
          // Flush Sentry before tearing down the provider its processor rides on.
          if (sentry) await sentry.flush();
          if (otel) await otel.shutdown();
        },
      };
    },
  };
}
