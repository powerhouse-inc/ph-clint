import { context as otelContext, metrics as otelMetrics, trace, SpanStatusCode, type Tracer, type Span, type Counter, type Histogram } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import type { BootTimings, WrapRegistry } from '@powerhousedao/ph-clint';
import type { OtelHandle } from './otel.js';
import type { SentryHandle } from './sentry.js';

export interface MetricInstruments {
  llmTokens: Counter;
  toolExecutions: Counter;
  routineIterations: Counter;
  commandExecutions: Counter;
  agentStreamDuration: Histogram;
}

export function buildMetricInstruments(otel: OtelHandle | null, cliName: string, version: string): MetricInstruments {
  // getMeter() returns a no-op meter when no MeterProvider has been registered,
  // so this is safe even when OTel is off — the counters/histograms become
  // no-ops too.
  const meter = otel?.meter ?? otelMetrics.getMeter(cliName, version);
  return {
    llmTokens: meter.createCounter('clint.llm.tokens', {
      description: 'LLM token usage by kind (prompt|completion) and model.',
    }),
    toolExecutions: meter.createCounter('clint.tool.executions', {
      description: 'Tool invocations by tool name and result.',
    }),
    routineIterations: meter.createCounter('clint.routine.iterations', {
      description: 'Routine loop iterations.',
    }),
    commandExecutions: meter.createCounter('clint.command.executions', {
      description: 'Command dispatches by command id and result.',
    }),
    agentStreamDuration: meter.createHistogram('clint.agent.stream.duration', {
      description: 'Agent stream() duration in milliseconds.',
      unit: 'ms',
    }),
  };
}

/** Loose shape used by the agentStream wrapper to read usage/model from finish chunks. */
interface UsageBearingChunk {
  type?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  model?: string;
}

interface ToolLike {
  execute: (...args: unknown[]) => unknown;
  [k: string]: unknown;
}

/** Normalize a caught value: Error passes through, anything else is stringified. */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  const e = new Error(String(err));
  e.name = 'NonError';
  return e;
}

/**
 * Build the four wrap implementations for the framework's WrapRegistry.
 * Returns partial — when a slot is omitted, the framework's composition
 * falls through to identity.
 */
export function buildWraps(metrics: MetricInstruments, sentry: SentryHandle | null): Partial<WrapRegistry> {
  const tracer: Tracer = trace.getTracer('ph-clint');
  // No-op when no global LoggerProvider is registered (OTel off / tests).
  const logger = logs.getLogger('ph-clint');

  // Report a wrap failure to both sinks: Sentry (captureException) and an OTel
  // log record carrying the failing span's trace context, so Tempo's
  // traces-to-logs (filterByTraceID) drills straight from the span into Loki.
  const reportError = (span: Span, err: unknown, attributes: Record<string, string | number>): void => {
    const e = toError(err);
    sentry?.captureException(err);
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: e.message,
      attributes: { 'exception.type': e.name, ...attributes },
      context: trace.setSpan(otelContext.active(), span),
    });
  };

  const command = async <R,>(id: string, inner: () => Promise<R>): Promise<R> => {
    const span = tracer.startSpan('command.execute', { attributes: { 'command.id': id } });
    const start = Date.now();
    try {
      const result = await inner();
      metrics.commandExecutions.add(1, { command: id, result: 'success' });
      span.setAttribute('command.duration_ms', Date.now() - start);
      return result;
    } catch (err) {
      metrics.commandExecutions.add(1, { command: id, result: 'error' });
      const e = toError(err);
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      span.setAttribute('command.duration_ms', Date.now() - start);
      reportError(span, err, { 'command.id': id });
      throw err;
    } finally {
      span.end();
    }
  };

  const agentStream: WrapRegistry['agentStream'] = <P, O, T>(
    inner: (prompt: P, opts?: O) => AsyncGenerator<T>,
    attrs: { agentId: string },
  ): ((prompt: P, opts?: O) => AsyncGenerator<T>) => {
    return async function* (prompt: P, opts?: O) {
      const streamSpan = tracer.startSpan('agent.stream', {
        attributes: { 'agent.id': attrs.agentId },
      });
      const llmSpan = tracer.startSpan(
        'llm.call',
        undefined,
        trace.setSpan(otelContext.active(), streamSpan),
      );
      const start = Date.now();
      let result: 'success' | 'error' = 'success';
      try {
        for await (const chunk of inner(prompt, opts)) {
          const u = chunk as unknown as UsageBearingChunk;
          if (u && u.usage) {
            const m = u.model ?? 'unknown';
            if (typeof u.usage.promptTokens === 'number') {
              llmSpan.setAttribute('llm.tokens.prompt', u.usage.promptTokens);
              metrics.llmTokens.add(u.usage.promptTokens, { kind: 'prompt', model: m });
            }
            if (typeof u.usage.completionTokens === 'number') {
              llmSpan.setAttribute('llm.tokens.completion', u.usage.completionTokens);
              metrics.llmTokens.add(u.usage.completionTokens, { kind: 'completion', model: m });
            }
            if (typeof u.usage.totalTokens === 'number') {
              llmSpan.setAttribute('llm.tokens.total', u.usage.totalTokens);
            }
            llmSpan.setAttribute('llm.model', m);
          }
          yield chunk;
        }
      } catch (err) {
        result = 'error';
        const e = toError(err);
        streamSpan.recordException(e);
        streamSpan.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
        llmSpan.recordException(e);
        llmSpan.setStatus({ code: SpanStatusCode.ERROR });
        reportError(streamSpan, err, { 'agent.id': attrs.agentId });
        throw err;
      } finally {
        llmSpan.end();
        const duration = Date.now() - start;
        metrics.agentStreamDuration.record(duration, { result, 'agent.id': attrs.agentId });
        streamSpan.end();
      }
    };
  };

  const tool = <T extends ToolLike>(name: string, t: T): T => {
    return {
      ...t,
      execute: async (...args: unknown[]) => {
        const span = tracer.startSpan('tool.execute', { attributes: { 'tool.name': name } });
        const start = Date.now();
        try {
          const result = await t.execute(...args);
          metrics.toolExecutions.add(1, { tool: name, result: 'success' });
          span.setAttribute('tool.duration_ms', Date.now() - start);
          return result;
        } catch (err) {
          metrics.toolExecutions.add(1, { tool: name, result: 'error' });
          const e = toError(err);
          span.recordException(e);
          span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
          span.setAttribute('tool.duration_ms', Date.now() - start);
          reportError(span, err, { 'tool.name': name });
          throw err;
        } finally {
          span.end();
        }
      },
    };
  };

  const routineIteration = async <R,>(attrs: { index: number }, inner: () => Promise<R>): Promise<R> => {
    const span = tracer.startSpan('routine.iteration', { attributes: { 'routine.index': attrs.index } });
    const start = Date.now();
    try {
      const result = await inner();
      metrics.routineIterations.add(1);
      span.setAttribute('routine.duration_ms', Date.now() - start);
      return result;
    } catch (err) {
      const e = toError(err);
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      reportError(span, err, { 'routine.index': attrs.index });
      throw err;
    } finally {
      span.end();
    }
  };

  return { command, agentStream, tool, routineIteration };
}

/**
 * Emit a retroactive `framework.bootstrap` span covering the pre-config boot
 * window. OTel accepts past `startTime` and per-event timestamps so the span
 * lands in the right position on the trace timeline.
 */
export function emitBootstrapSpan(otel: OtelHandle, bootTimings: BootTimings): void {
  const span = otel.tracer.startSpan('framework.bootstrap', {
    startTime: new Date(bootTimings.bootStartedAt),
  });
  span.addEvent('config.resolved', {}, new Date(bootTimings.configResolvedAt));
  span.addEvent('lifecycle.init.started', {}, new Date(bootTimings.lifecycleInitStartedAt));
  span.end();
}
