import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import type { ClintMetrics } from '../../observability/index.js';

export interface InstrumentedStreamOptions {
  metrics: ClintMetrics;
  attrs: { agentId: string };
}

/** Loose shape used by the wrapper to read usage/model from chunks without coupling to the AI SDK types. */
interface UsageBearingChunk {
  type?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  model?: string;
}

/**
 * Wraps an `async *stream(prompt, opts)` with:
 *   - an `agent.stream` span around the whole iteration + a duration histogram
 *   - a child `llm.call` span carrying token counts from the stream's finish/usage chunk
 *
 * `llm.call` is created as a child of `agent.stream` via `trace.setSpan(context.active(), …)`
 * so backends (Tempo, Sentry) render them in a single hierarchy.
 *
 * Generic over `T` so callers can keep their stricter chunk type (e.g. the
 * project-wide `StreamChunk` union) without the wrapper widening it.
 */
export function createInstrumentedStream<P, O, T>(
  inner: (prompt: P, opts?: O) => AsyncGenerator<T>,
  options: InstrumentedStreamOptions,
): (prompt: P, opts?: O) => AsyncGenerator<T> {
  return async function* instrumented(prompt: P, opts?: O) {
    const tracer = trace.getTracer('ph-clint');
    const streamSpan = tracer.startSpan('agent.stream', {
      attributes: { 'agent.id': options.attrs.agentId },
    });
    const llmSpan = tracer.startSpan(
      'llm.call',
      undefined,
      trace.setSpan(context.active(), streamSpan),
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
            options.metrics.llmTokens.add(u.usage.promptTokens, { kind: 'prompt', model: m });
          }
          if (typeof u.usage.completionTokens === 'number') {
            llmSpan.setAttribute('llm.tokens.completion', u.usage.completionTokens);
            options.metrics.llmTokens.add(u.usage.completionTokens, { kind: 'completion', model: m });
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
      streamSpan.recordException(err as Error);
      streamSpan.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      llmSpan.recordException(err as Error);
      llmSpan.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      llmSpan.end();
      const duration = Date.now() - start;
      options.metrics.agentStreamDuration.record(duration, {
        result,
        'agent.id': options.attrs.agentId,
      });
      streamSpan.end();
    }
  };
}
