import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { ClintMetrics } from '../../observability/index.js';

export interface InstrumentedStreamOptions {
  metrics: ClintMetrics;
  attrs: { agentId: string };
}

/** Wraps an `async *stream(prompt, opts)` with an `agent.stream` span and a duration histogram. */
export function createInstrumentedStream<P, O, T>(
  inner: (prompt: P, opts?: O) => AsyncGenerator<T>,
  options: InstrumentedStreamOptions,
): (prompt: P, opts?: O) => AsyncGenerator<T> {
  return async function* instrumented(prompt: P, opts?: O) {
    const tracer = trace.getTracer('ph-clint');
    const span = tracer.startSpan('agent.stream', {
      attributes: { 'agent.id': options.attrs.agentId },
    });
    const start = Date.now();
    let result: 'success' | 'error' = 'success';
    try {
      for await (const chunk of inner(prompt, opts)) {
        yield chunk;
      }
    } catch (err) {
      result = 'error';
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      const duration = Date.now() - start;
      options.metrics.agentStreamDuration.record(duration, {
        result,
        'agent.id': options.attrs.agentId,
      });
      span.end();
    }
  };
}
