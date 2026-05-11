import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  BasicTracerProvider,
} from '@opentelemetry/sdk-trace-base';
import { createInstrumentedStream } from '../../src/integrations/mastra/instrumented-stream.js';
import { instrumentTools } from '../../src/integrations/mastra/instrumented-tools.js';

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

  it('emits a child llm.call span with token counts from usage chunk', async () => {
    const inner = async function* () {
      yield { type: 'text-delta', text: 'hi' };
      yield {
        type: 'finish',
        usage: { promptTokens: 12, completionTokens: 4, totalTokens: 16 },
        model: 'anthropic/claude-sonnet-4-5',
      };
    };
    const metricsMock = buildMetricsMock();

    const wrapped = createInstrumentedStream(inner, { metrics: metricsMock, attrs: { agentId: 'a1' } });
    for await (const _ of wrapped('hello')) { /* drain */ }

    const spans = exporter.getFinishedSpans();
    const llm = spans.find(s => s.name === 'llm.call');
    expect(llm).toBeDefined();
    expect(llm!.attributes['llm.tokens.prompt']).toBe(12);
    expect(llm!.attributes['llm.tokens.completion']).toBe(4);
    expect(llm!.attributes['llm.model']).toBe('anthropic/claude-sonnet-4-5');
    expect(metricsMock.llmTokens.add).toHaveBeenCalledWith(12, expect.objectContaining({ kind: 'prompt', model: 'anthropic/claude-sonnet-4-5' }));
    expect(metricsMock.llmTokens.add).toHaveBeenCalledWith(4, expect.objectContaining({ kind: 'completion', model: 'anthropic/claude-sonnet-4-5' }));
  });
});

describe('instrumentTools', () => {
  beforeEach(() => { exporter.reset(); });

  it('wraps each tool execute with a tool.execute span + counter', async () => {
    const metricsMock = buildMetricsMock();
    const fakeTool = { execute: jest.fn().mockResolvedValue({ ok: true } as never) };
    const tools = instrumentTools({ search: fakeTool } as any, metricsMock);

    await tools.search.execute({ q: 'hello' });

    const spans = exporter.getFinishedSpans();
    expect(spans.some(s => s.name === 'tool.execute' && s.attributes['tool.name'] === 'search')).toBe(true);
    expect(metricsMock.toolExecutions.add).toHaveBeenCalledWith(1, expect.objectContaining({ tool: 'search', result: 'success' }));
  });

  it('records error result when tool throws', async () => {
    const metricsMock = buildMetricsMock();
    const failing = { execute: jest.fn().mockRejectedValue(new Error('nope') as never) };
    const tools = instrumentTools({ failing } as any, metricsMock);

    await expect(tools.failing.execute({})).rejects.toThrow('nope');
    expect(metricsMock.toolExecutions.add).toHaveBeenCalledWith(1, expect.objectContaining({ tool: 'failing', result: 'error' }));
  });
});
