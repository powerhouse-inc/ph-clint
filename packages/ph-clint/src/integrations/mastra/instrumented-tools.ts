import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { ClintMetrics } from '../../observability/index.js';

interface ToolLike {
  execute: (args: unknown) => unknown;
  [k: string]: unknown;
}

/**
 * Returns a new object where every tool's `execute(args)` is wrapped with a
 * `tool.execute` span and a `clint.tool.executions` counter increment (with
 * `tool` + `result` labels). Non-execute fields are passed through unchanged.
 */
export function instrumentTools<T extends Record<string, ToolLike>>(
  tools: T,
  metrics: ClintMetrics,
): T {
  const tracer = trace.getTracer('ph-clint');
  const wrapped: Record<string, ToolLike> = {};
  for (const [name, tool] of Object.entries(tools)) {
    wrapped[name] = {
      ...tool,
      execute: async (args: unknown) => {
        const span = tracer.startSpan('tool.execute', { attributes: { 'tool.name': name } });
        const start = Date.now();
        try {
          const result = await tool.execute(args);
          metrics.toolExecutions.add(1, { tool: name, result: 'success' });
          span.setAttribute('tool.duration_ms', Date.now() - start);
          return result;
        } catch (err) {
          metrics.toolExecutions.add(1, { tool: name, result: 'error' });
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.setAttribute('tool.duration_ms', Date.now() - start);
          throw err;
        } finally {
          span.end();
        }
      },
    };
  }
  return wrapped as T;
}
