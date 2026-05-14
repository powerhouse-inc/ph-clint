/**
 * Pins the metric-name / type / unit / description / label-attribute contract
 * that operator dashboards and alert rules depend on.
 *
 * Uses a real OTel MeterProvider + InMemoryMetricExporter rather than the
 * jest-spy mock in wraps.test.ts, so a silent rename (e.g. `clint.llm.tokens`
 * → `clint.tokens.llm`) or a unit change fails the suite. Same pattern as
 * the InMemorySpanExporter coverage we have for spans.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { metrics, trace } from '@opentelemetry/api';
import {
  MeterProvider,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
  AggregationTemporality,
  type ResourceMetrics,
} from '@opentelemetry/sdk-metrics';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { buildMetricInstruments, buildWraps } from '../src/wraps.js';

const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  // Long interval — we force-flush manually so the test doesn't race the reader.
  exportIntervalMillis: 60_000,
});
const meterProvider = new MeterProvider({ readers: [metricReader] });

// wraps.ts also calls trace.getTracer; install a real (but in-memory) provider
// so span construction inside the wraps doesn't fault.
const spanExporter = new InMemorySpanExporter();
const tracerProvider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(spanExporter)],
});

beforeAll(() => {
  metrics.setGlobalMeterProvider(meterProvider);
  trace.setGlobalTracerProvider(tracerProvider);
});

afterAll(async () => {
  await meterProvider.shutdown();
});

interface MetricSpec {
  name: string;
  type: 'COUNTER' | 'HISTOGRAM';
  unit: string;
  description: string;
}

/** The contract operators dashboard on. Change here = breaking change. */
const EXPECTED: MetricSpec[] = [
  {
    name: 'clint.llm.tokens',
    type: 'COUNTER',
    unit: '',
    description: 'LLM token usage by kind (prompt|completion) and model.',
  },
  {
    name: 'clint.tool.executions',
    type: 'COUNTER',
    unit: '',
    description: 'Tool invocations by tool name and result.',
  },
  {
    name: 'clint.routine.iterations',
    type: 'COUNTER',
    unit: '',
    description: 'Routine loop iterations.',
  },
  {
    name: 'clint.command.executions',
    type: 'COUNTER',
    unit: '',
    description: 'Command dispatches by command id and result.',
  },
  {
    name: 'clint.agent.stream.duration',
    type: 'HISTOGRAM',
    unit: 'ms',
    description: 'Agent stream() duration in milliseconds.',
  },
];

/** Exercise every wrap so each instrument has at least one datapoint. */
async function exerciseAllWraps() {
  const instruments = buildMetricInstruments(null, 'metrics-contract-test', '0.0.0');
  const wraps = buildWraps(instruments, null);

  // command — success + error
  await wraps.command!('cmd-ok', async () => 'r');
  try { await wraps.command!('cmd-bad', async () => { throw new Error('x'); }); } catch { /* expected */ }

  // tool — success + error
  const okTool = wraps.tool!('search', { execute: async () => 'r' });
  await (okTool.execute as (a: unknown) => Promise<unknown>)({});
  const errTool = wraps.tool!('failing', { execute: async () => { throw new Error('y'); } });
  try { await (errTool.execute as (a: unknown) => Promise<unknown>)({}); } catch { /* expected */ }

  // routine.iteration
  await wraps.routineIteration!({ index: 0 }, async () => undefined);

  // agent.stream — success path with a finish chunk so llmTokens is populated
  const inner = async function* () {
    yield { type: 'text-delta', text: 'hi' };
    yield {
      type: 'finish',
      usage: { promptTokens: 7, completionTokens: 3, totalTokens: 10 },
      model: 'anthropic/claude-sonnet-4-5',
    };
  };
  const streamFn = wraps.agentStream!(inner, { agentId: 'a1' });
  for await (const _ of streamFn('hello')) { /* drain */ }

  // agent.stream — error path
  const errInner = async function* () {
    yield { type: 'text-delta', text: 'partial' };
    throw new Error('boom');
  };
  const errStreamFn = wraps.agentStream!(errInner, { agentId: 'a1' });
  try { for await (const _ of errStreamFn('hi')) { /* drain */ } } catch { /* expected */ }
}

async function collectMetrics(): Promise<ResourceMetrics> {
  await meterProvider.forceFlush();
  const collected = metricExporter.getMetrics();
  // The last batch contains the most recent set of datapoints.
  return collected[collected.length - 1]!;
}

describe('metrics contract', () => {
  let collected: ResourceMetrics;

  beforeAll(async () => {
    await exerciseAllWraps();
    collected = await collectMetrics();
  });

  it('exports exactly the five expected metrics — no more, no less', () => {
    const names = collected.scopeMetrics
      .flatMap(sm => sm.metrics.map(m => m.descriptor.name))
      .sort();
    const expectedNames = EXPECTED.map(e => e.name).sort();
    expect(names).toEqual(expectedNames);
  });

  for (const spec of EXPECTED) {
    describe(spec.name, () => {
      function find() {
        const all = collected.scopeMetrics.flatMap(sm => sm.metrics);
        const m = all.find(x => x.descriptor.name === spec.name);
        expect(m).toBeDefined();
        return m!;
      }

      it('has the correct type', () => {
        const m = find();
        // dataPointType: 0 = HISTOGRAM, 3 = SUM (counter), 2 = GAUGE, etc.
        // Use string comparison via descriptor's metricType field where possible.
        if (spec.type === 'HISTOGRAM') {
          expect(m.dataPointType).toBe(0); // DataPointType.HISTOGRAM
        } else {
          expect(m.dataPointType).toBe(3); // DataPointType.SUM
        }
      });

      it('has the correct unit', () => {
        expect(find().descriptor.unit).toBe(spec.unit);
      });

      it('has the correct description', () => {
        expect(find().descriptor.description).toBe(spec.description);
      });
    });
  }

  describe('attribute keys per metric', () => {
    function attrKeys(metricName: string): Set<string> {
      const m = collected.scopeMetrics.flatMap(sm => sm.metrics).find(x => x.descriptor.name === metricName)!;
      const keys = new Set<string>();
      for (const dp of m.dataPoints) {
        for (const k of Object.keys(dp.attributes)) keys.add(k);
      }
      return keys;
    }

    it('clint.llm.tokens carries {kind, model}', () => {
      const keys = attrKeys('clint.llm.tokens');
      expect(keys.has('kind')).toBe(true);
      expect(keys.has('model')).toBe(true);
    });

    it('clint.tool.executions carries {tool, result}', () => {
      const keys = attrKeys('clint.tool.executions');
      expect(keys.has('tool')).toBe(true);
      expect(keys.has('result')).toBe(true);
    });

    it('clint.command.executions carries {command, result}', () => {
      const keys = attrKeys('clint.command.executions');
      expect(keys.has('command')).toBe(true);
      expect(keys.has('result')).toBe(true);
    });

    it('clint.routine.iterations carries no labels', () => {
      const keys = attrKeys('clint.routine.iterations');
      expect(keys.size).toBe(0);
    });

    it('clint.agent.stream.duration carries {result, agent.id}', () => {
      const keys = attrKeys('clint.agent.stream.duration');
      expect(keys.has('result')).toBe(true);
      expect(keys.has('agent.id')).toBe(true);
    });
  });

  describe('result label values', () => {
    function resultValues(metricName: string): Set<string> {
      const m = collected.scopeMetrics.flatMap(sm => sm.metrics).find(x => x.descriptor.name === metricName)!;
      const set = new Set<string>();
      for (const dp of m.dataPoints) {
        const r = (dp.attributes as Record<string, unknown>).result;
        if (typeof r === 'string') set.add(r);
      }
      return set;
    }

    it('clint.command.executions emits both success and error', () => {
      expect(resultValues('clint.command.executions')).toEqual(new Set(['success', 'error']));
    });

    it('clint.tool.executions emits both success and error', () => {
      expect(resultValues('clint.tool.executions')).toEqual(new Set(['success', 'error']));
    });

    it('clint.agent.stream.duration emits both success and error', () => {
      expect(resultValues('clint.agent.stream.duration')).toEqual(new Set(['success', 'error']));
    });
  });

  describe('kind label values on llm.tokens', () => {
    it('emits both prompt and completion', () => {
      const m = collected.scopeMetrics.flatMap(sm => sm.metrics).find(x => x.descriptor.name === 'clint.llm.tokens')!;
      const kinds = new Set<string>();
      for (const dp of m.dataPoints) {
        const k = (dp.attributes as Record<string, unknown>).kind;
        if (typeof k === 'string') kinds.add(k);
      }
      expect(kinds).toEqual(new Set(['prompt', 'completion']));
    });
  });

  // Resource-attribute contract (service.name, service.version,
  // service.instance.id) is pinned in `otel.test.ts` against the pure
  // buildResourceAttributes helper. This test attaches a meter directly to
  // a standalone MeterProvider (no NodeSDK, no resource piping), so we
  // don't re-test it here.
});
