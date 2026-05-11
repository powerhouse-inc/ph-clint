import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  BasicTracerProvider,
} from '@opentelemetry/sdk-trace-base';
import { createInstrumentedStream } from '../../src/integrations/mastra/instrumented-stream.js';

const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });

beforeAll(() => {
  trace.setGlobalTracerProvider(provider);
});

function buildMetricsMock() {
  return {
    llmTokens: { add: jest.fn() },
    toolExecutions: { add: jest.fn() },
    routineIterations: { add: jest.fn() },
    agentStreamDuration: { record: jest.fn() },
  } as any;
}

describe('createInstrumentedStream', () => {
  beforeEach(() => { exporter.reset(); });

  it('emits an agent.stream span around the inner stream', async () => {
    const inner = async function* () {
      yield { type: 'text-delta', text: 'hi' };
    };
    const metricsMock = buildMetricsMock();

    const wrapped = createInstrumentedStream(inner, { metrics: metricsMock, attrs: { agentId: 'a1' } });
    for await (const _ of wrapped('hello')) { /* drain */ }

    const spans = exporter.getFinishedSpans();
    expect(spans.some(s => s.name === 'agent.stream')).toBe(true);
    const streamSpan = spans.find(s => s.name === 'agent.stream')!;
    expect(streamSpan.attributes['agent.id']).toBe('a1');
    expect(metricsMock.agentStreamDuration.record).toHaveBeenCalledTimes(1);
  });

  it('records exception + sets error status when inner throws', async () => {
    const inner = async function* () {
      yield { type: 'text-delta', text: 'partial' };
      throw new Error('boom');
    };
    const metricsMock = buildMetricsMock();

    const wrapped = createInstrumentedStream(inner, { metrics: metricsMock, attrs: { agentId: 'a1' } });
    await expect((async () => { for await (const _ of wrapped('hello')) { /* drain */ } })()).rejects.toThrow('boom');

    const spans = exporter.getFinishedSpans();
    const streamSpan = spans.find(s => s.name === 'agent.stream')!;
    expect(streamSpan.status.code).toBe(2 /* ERROR */);
    expect(streamSpan.events.some(e => e.name === 'exception')).toBe(true);
    expect(metricsMock.agentStreamDuration.record).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ result: 'error' }),
    );
  });
});
