import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { buildMetricInstruments, buildWraps, emitBootstrapSpan } from '../src/wraps.js';
import type { MetricInstruments } from '../src/wraps.js';
import type { OtelHandle } from '../src/otel.js';
import type { BootTimings } from '@powerhousedao/ph-clint';

const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });

beforeAll(() => { trace.setGlobalTracerProvider(provider); });

beforeEach(() => { exporter.reset(); });

function mockMetrics(): MetricInstruments {
  return {
    llmTokens: { add: jest.fn() } as unknown as MetricInstruments['llmTokens'],
    toolExecutions: { add: jest.fn() } as unknown as MetricInstruments['toolExecutions'],
    routineIterations: { add: jest.fn() } as unknown as MetricInstruments['routineIterations'],
    commandExecutions: { add: jest.fn() } as unknown as MetricInstruments['commandExecutions'],
    agentStreamDuration: { record: jest.fn() } as unknown as MetricInstruments['agentStreamDuration'],
  };
}

describe('buildMetricInstruments', () => {
  it('returns no-op-shaped instruments when otel handle is null (no provider registered)', () => {
    const m = buildMetricInstruments(null, 'test', '0.0.1');
    expect(typeof m.llmTokens.add).toBe('function');
    expect(typeof m.commandExecutions.add).toBe('function');
    expect(typeof m.agentStreamDuration.record).toBe('function');
    // No-op meter returns silently
    expect(() => m.llmTokens.add(5, { kind: 'prompt', model: 'x' })).not.toThrow();
  });
});

describe('wraps.command', () => {
  it('emits a command.execute span around the inner call and counts success', async () => {
    const metrics = mockMetrics();
    const { command } = buildWraps(metrics, null);
    const result = await command!('echo', async () => 'hi');
    expect(result).toBe('hi');
    const spans = exporter.getFinishedSpans();
    expect(spans.some(s => s.name === 'command.execute' && s.attributes['command.id'] === 'echo')).toBe(true);
    expect((metrics.commandExecutions.add as jest.Mock)).toHaveBeenCalledWith(1, { command: 'echo', result: 'success' });
  });

  it('counts errors and records exception on the span', async () => {
    const metrics = mockMetrics();
    const { command } = buildWraps(metrics, null);
    await expect(command!('boom', async () => { throw new Error('nope'); })).rejects.toThrow('nope');
    const span = exporter.getFinishedSpans().find(s => s.name === 'command.execute')!;
    expect(span.status.code).toBe(2 /* ERROR */);
    expect(span.events.some(e => e.name === 'exception')).toBe(true);
    expect((metrics.commandExecutions.add as jest.Mock)).toHaveBeenCalledWith(1, { command: 'boom', result: 'error' });
  });
});

describe('wraps.routineIteration', () => {
  it('opens a routine.iteration span with the index, increments counter, sets duration', async () => {
    const metrics = mockMetrics();
    const { routineIteration } = buildWraps(metrics, null);
    await routineIteration!({ index: 7 }, async () => undefined);
    const span = exporter.getFinishedSpans().find(s => s.name === 'routine.iteration')!;
    expect(span.attributes['routine.index']).toBe(7);
    expect(span.attributes['routine.duration_ms']).toEqual(expect.any(Number));
    expect((metrics.routineIterations.add as jest.Mock)).toHaveBeenCalledWith(1);
  });

  it('records exception when iteration body throws', async () => {
    const metrics = mockMetrics();
    const { routineIteration } = buildWraps(metrics, null);
    await expect(routineIteration!({ index: 0 }, async () => { throw new Error('iter-err'); })).rejects.toThrow('iter-err');
    const span = exporter.getFinishedSpans().find(s => s.name === 'routine.iteration')!;
    expect(span.status.code).toBe(2);
  });
});

describe('wraps.tool', () => {
  it('wraps each tool execute with a tool.execute span + counter', async () => {
    const metrics = mockMetrics();
    const { tool } = buildWraps(metrics, null);
    const wrapped = tool!('search', { execute: jest.fn().mockResolvedValue('ok' as never) });
    const r = await (wrapped.execute as (a: unknown) => Promise<unknown>)({ q: 'hi' });
    expect(r).toBe('ok');
    const span = exporter.getFinishedSpans().find(s => s.name === 'tool.execute')!;
    expect(span.attributes['tool.name']).toBe('search');
    expect((metrics.toolExecutions.add as jest.Mock)).toHaveBeenCalledWith(1, { tool: 'search', result: 'success' });
  });

  it('counts errors and records exception when tool throws', async () => {
    const metrics = mockMetrics();
    const { tool } = buildWraps(metrics, null);
    const wrapped = tool!('failing', { execute: jest.fn().mockRejectedValue(new Error('nope') as never) });
    await expect((wrapped.execute as (a: unknown) => Promise<unknown>)({})).rejects.toThrow('nope');
    expect((metrics.toolExecutions.add as jest.Mock)).toHaveBeenCalledWith(1, { tool: 'failing', result: 'error' });
  });
});

describe('wraps.agentStream', () => {
  it('emits agent.stream span around the iteration + child llm.call from a finish chunk', async () => {
    const metrics = mockMetrics();
    const { agentStream } = buildWraps(metrics, null);
    const inner = async function* () {
      yield { type: 'text-delta', text: 'hi' };
      yield {
        type: 'finish',
        usage: { promptTokens: 12, completionTokens: 4, totalTokens: 16 },
        model: 'anthropic/claude',
      };
    };
    const wrapped = agentStream!(inner, { agentId: 'a1' });
    for await (const _ of wrapped('hello')) { /* drain */ }
    const spans = exporter.getFinishedSpans();
    const stream = spans.find(s => s.name === 'agent.stream')!;
    expect(stream.attributes['agent.id']).toBe('a1');
    const llm = spans.find(s => s.name === 'llm.call')!;
    expect(llm.attributes['llm.tokens.prompt']).toBe(12);
    expect(llm.attributes['llm.tokens.completion']).toBe(4);
    expect(llm.attributes['llm.tokens.total']).toBe(16);
    expect(llm.attributes['llm.model']).toBe('anthropic/claude');
    expect((metrics.llmTokens.add as jest.Mock)).toHaveBeenCalledWith(12, { kind: 'prompt', model: 'anthropic/claude' });
    expect((metrics.llmTokens.add as jest.Mock)).toHaveBeenCalledWith(4, { kind: 'completion', model: 'anthropic/claude' });
    expect((metrics.agentStreamDuration.record as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('records error result and exception when inner throws mid-stream', async () => {
    const metrics = mockMetrics();
    const { agentStream } = buildWraps(metrics, null);
    const inner = async function* () { yield { type: 'text-delta', text: 'partial' }; throw new Error('boom'); };
    const wrapped = agentStream!(inner, { agentId: 'a1' });
    await expect((async () => { for await (const _ of wrapped('hi')) { /* drain */ } })()).rejects.toThrow('boom');
    const stream = exporter.getFinishedSpans().find(s => s.name === 'agent.stream')!;
    expect(stream.status.code).toBe(2);
    expect((metrics.agentStreamDuration.record as jest.Mock)).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ result: 'error' }),
    );
  });
});

describe('emitBootstrapSpan', () => {
  it('emits a framework.bootstrap span with sub-phase events at past timestamps', () => {
    const otel: OtelHandle = {
      tracer: trace.getTracer('test'),
      meter: undefined as never,
      shutdown: async () => {},
    };
    const bootTimings: BootTimings = {
      bootStartedAt: 1_700_000_000_000,
      configResolvedAt: 1_700_000_000_100,
      lifecycleInitStartedAt: 1_700_000_000_200,
    };
    emitBootstrapSpan(otel, bootTimings);
    const span = exporter.getFinishedSpans().find(s => s.name === 'framework.bootstrap')!;
    expect(span).toBeDefined();
    const eventNames = span.events.map(e => e.name);
    expect(eventNames).toContain('config.resolved');
    expect(eventNames).toContain('lifecycle.init.started');
  });
});
