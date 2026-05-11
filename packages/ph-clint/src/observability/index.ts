import { metrics, type Counter, type Histogram } from '@opentelemetry/api';
import { initSentry, type SentryHandle } from './sentry.js';
import { initOtel, type OtelHandle } from './otel.js';

export interface InitObservabilityOptions {
  env: NodeJS.ProcessEnv;
  cliName: string;
  packageVersion: string;
}

export interface ClintMetrics {
  /** Counter — labels: kind=prompt|completion, model=<model_id>. */
  llmTokens: Counter;
  /** Counter — labels: tool=<name>, result=success|error|abort. */
  toolExecutions: Counter;
  /** Counter — labels: (none). */
  routineIterations: Counter;
  /** Histogram — ms; labels: result=success|error. */
  agentStreamDuration: Histogram;
}

export interface ObservabilityHandle {
  sentry: SentryHandle | null;
  otel: OtelHandle | null;
  metrics: ClintMetrics;
  shutdown: () => Promise<void>;
}

/**
 * Top-level entrypoint. Call once from cli.bootstrap(). Initializes (in order):
 *  1. Sentry (if SENTRY_DSN)
 *  2. OTel NodeSDK (if a trace or metrics destination is configured)
 *  3. Custom metric instruments (always created — fall back to a no-op meter
 *     when OTel is off so callers don't need to null-check).
 */
export function initObservability(opts: InitObservabilityOptions): ObservabilityHandle {
  const sentry = initSentry(opts);
  const otel = initOtel({ ...opts, sentryEnabled: sentry !== null });

  // metrics.getMeter() returns a no-op meter when no MeterProvider has been
  // registered — so this is safe even if otel is null.
  const meter = otel?.meter ?? metrics.getMeter(opts.cliName, opts.packageVersion);
  const clintMetrics: ClintMetrics = {
    llmTokens: meter.createCounter('clint.llm.tokens', {
      description: 'LLM token usage by kind (prompt|completion) and model.',
    }),
    toolExecutions: meter.createCounter('clint.tool.executions', {
      description: 'Tool invocations by tool name and result.',
    }),
    routineIterations: meter.createCounter('clint.routine.iterations', {
      description: 'Routine loop iterations.',
    }),
    agentStreamDuration: meter.createHistogram('clint.agent.stream.duration', {
      description: 'Agent stream() duration in milliseconds.',
      unit: 'ms',
    }),
  };

  return {
    sentry,
    otel,
    metrics: clintMetrics,
    shutdown: async () => {
      if (otel) await otel.shutdown();
    },
  };
}

// Re-exports for consumers that want types
export type { SentryHandle } from './sentry.js';
export type { OtelHandle } from './otel.js';
