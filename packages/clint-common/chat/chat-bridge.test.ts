import { describe, it, expect } from 'vitest';
import { writeAgentStreamToDocument } from './chat-bridge.js';
import type { StreamChunk, ReactorContext, TypedReactorClient } from '@powerhousedao/ph-clint';
import type { ChatSessionRegistry } from './chat-session-init.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function* makeStream(chunks: StreamChunk[]): AsyncGenerator<StreamChunk> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

interface RecordedAction {
  documentId: string;
  scope: string;
  actions: unknown[];
}

type MockReactor = ReactorContext<ChatSessionRegistry> & { calls: RecordedAction[] };

function makeReactorWithPriorUsage(priorUsage: unknown): MockReactor {
  const calls: RecordedAction[] = [];

  const client = {
    execute: (documentId: string, scope: string, actions: unknown[]) => {
      calls.push({ documentId, scope, actions });
      return Promise.resolve({ ok: true } as never);
    },
    get: () =>
      Promise.resolve({
        state: {
          global: { usage: priorUsage },
        },
      } as never),
    // Reduced test double: only execute/get are exercised. The full
    // TypedReactorClient surface can't be structurally satisfied here.
  } as unknown as TypedReactorClient<ChatSessionRegistry>;

  return {
    client,
    driveId: 'drive-1',
    shutdown: () => Promise.resolve(),
    calls,
  };
}

function getUpdateUsageSummaryAction(calls: RecordedAction[]): unknown {
  for (const call of calls) {
    for (const action of call.actions) {
      const typed = action as { type: string; input: Record<string, unknown> };
      if (typed.type === 'UPDATE_USAGE_SUMMARY') {
        return typed.input;
      }
    }
  }
  return undefined;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('writeAgentStreamToDocument — usage persistence', () => {
  it('captures finish chunk usage and dispatches cumulative totals (with prior usage)', async () => {
    const reactor = makeReactorWithPriorUsage({
      totalTokens: 10,
      totalPromptTokens: 5,
      totalCompletionTokens: 5,
      totalSteps: 1,
      totalMessages: 1,
      totalToolCalls: 0,
    });

    const stream = makeStream([
      { type: 'text-delta', text: 'Hello' },
      { type: 'finish', finishReason: 'stop', usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } },
    ]);

    await writeAgentStreamToDocument(stream, { reactor, documentId: 'doc-1' });

    const input = getUpdateUsageSummaryAction(reactor.calls);
    const typed = input as Record<string, unknown>;
    expect(typed?.totalTokens).toBe(160);
    expect(typed?.totalPromptTokens).toBe(105);
    expect(typed?.totalCompletionTokens).toBe(55);
    expect(typed?.totalSteps).toBe(2);
    expect(typed?.totalMessages).toBeUndefined();
    expect(typed?.totalToolCalls).toBeUndefined();
  });

  it('captures finish chunk usage with null prior usage', async () => {
    const reactor = makeReactorWithPriorUsage(null);

    const stream = makeStream([
      { type: 'text-delta', text: 'Hi' },
      { type: 'finish', finishReason: 'stop', usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 } },
    ]);

    await writeAgentStreamToDocument(stream, { reactor, documentId: 'doc-null' });

    const input = getUpdateUsageSummaryAction(reactor.calls);
    const typed = input as Record<string, unknown>;
    expect(typed?.totalTokens).toBe(300);
    expect(typed?.totalPromptTokens).toBe(200);
    expect(typed?.totalCompletionTokens).toBe(100);
    expect(typed?.totalSteps).toBe(1);
  });

  it('falls back to summed step-finish usage when finish has no usage', async () => {
    const reactor = makeReactorWithPriorUsage(null);

    const stream = makeStream([
      { type: 'text-delta', text: 'Step' },
      { type: 'step-finish', usage: { inputTokens: 50, outputTokens: 30, totalTokens: 80 } },
      { type: 'finish', finishReason: 'stop' },
    ]);

    await writeAgentStreamToDocument(stream, { reactor, documentId: 'doc-step' });

    const input = getUpdateUsageSummaryAction(reactor.calls);
    const typed = input as Record<string, unknown>;
    expect(typed?.totalTokens).toBe(80);
    expect(typed?.totalPromptTokens).toBe(50);
    expect(typed?.totalCompletionTokens).toBe(30);
  });

  it('sums multiple step-finish usages and falls back when finish chunk is absent', async () => {
    const reactor = makeReactorWithPriorUsage(null);

    const stream = makeStream([
      { type: 'text-delta', text: 'first' },
      { type: 'step-finish', usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 } },
      { type: 'text-delta', text: 'second' },
      { type: 'step-finish', usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 } },
    ]);

    await writeAgentStreamToDocument(stream, { reactor, documentId: 'doc-no-finish' });

    const input = getUpdateUsageSummaryAction(reactor.calls);
    const typed = input as Record<string, unknown>;
    expect(typed?.totalTokens).toBe(45);
    expect(typed?.totalPromptTokens).toBe(30);
    expect(typed?.totalCompletionTokens).toBe(15);
  });

  it('dispatches no token fields when no chunk carries usage, and never totalMessages/totalToolCalls', async () => {
    const reactor = makeReactorWithPriorUsage(null);

    const stream = makeStream([
      { type: 'text-delta', text: 'No usage turn' },
      { type: 'finish', finishReason: 'stop' },
    ]);

    await writeAgentStreamToDocument(stream, { reactor, documentId: 'doc-no-usage' });

    const input = getUpdateUsageSummaryAction(reactor.calls);
    const typed = input as Record<string, unknown>;
    // Token fields should be absent
    expect(typed?.totalTokens).toBeUndefined();
    expect(typed?.totalPromptTokens).toBeUndefined();
    expect(typed?.totalCompletionTokens).toBeUndefined();
    // totalSteps should be present (cumulative)
    expect(typed?.totalSteps).toBe(1);
    // Clobbered fields must not be dispatched
    expect(typed?.totalMessages).toBeUndefined();
    expect(typed?.totalToolCalls).toBeUndefined();
  });
});
