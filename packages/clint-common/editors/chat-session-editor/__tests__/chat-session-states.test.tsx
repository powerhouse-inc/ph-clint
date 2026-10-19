// @vitest-environment jsdom
import type { DocumentDispatch } from '@powerhousedao/reactor-browser';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { addUserMessage, endSession, failTurn, markMessagePickedUp, reducer, retryTurn, startSession, utils } from 'document-models/chat-session';
import type { ChatSessionAction, ChatSessionDocument, TurnFailure } from 'document-models/chat-session';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ChatSession } from '../ChatSession.js';

const T0 = '2026-01-01T00:00:00.000Z';
const T1 = '2026-01-01T00:00:01.000Z';
const T2 = '2026-01-01T00:00:02.000Z';
const T3 = '2026-01-01T00:00:03.000Z';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  // jsdom lacks the layout APIs the conversation scroller relies on.
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, value: () => undefined });
});

afterEach(() => {
  vi.useRealTimers();
});

function session(): ChatSessionDocument {
  let doc = utils.createDocument();
  doc = reducer(doc, startSession({ threadId: 't1', resourceId: 'r1', agent: { name: 'Agent' }, startedAt: T0 }));
  doc = reducer(doc, addUserMessage({ id: 'u1', content: [{ id: 'u1-p1', type: 'TEXT', text: 'hello' }], createdAt: T1 }));
  return doc;
}

function withFailure(doc: ChatSessionDocument, code = 'PROVIDER_ERROR', retryable = true): ChatSessionDocument {
  doc = reducer(doc, markMessagePickedUp({ messageId: 'u1', pickedUpAt: T1 }));
  return reducer(doc, failTurn({ id: 'f1', userMessageId: 'u1', code, message: 'The model provider failed', retryable, failedAt: T2 }));
}

function renderSession(doc: ChatSessionDocument, extra: Partial<Parameters<typeof ChatSession>[0]> = {}) {
  const dispatch = vi.fn<DocumentDispatch<ChatSessionAction>>();
  const utilsRender = render(<ChatSession document={doc} dispatch={dispatch} {...extra} />);
  return { dispatch, ...utilsRender };
}

function dispatchedTypes(dispatch: { mock: { calls: unknown[][] } }): string[] {
  return dispatch.mock.calls.flatMap(([a]) => (Array.isArray(a) ? a : [a]) as ChatSessionAction[]).map((a) => a.type);
}

describe('chat session states', () => {
  it('shows Retry on a failed turn and dispatches RETRY_TURN', () => {
    const { dispatch } = renderSession(withFailure(session()));
    expect(screen.getByText('The model provider failed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(dispatchedTypes(dispatch)).toEqual(['RETRY_TURN']);
    const action = dispatch.mock.calls[0][0] as ChatSessionAction;
    expect(action.input).toEqual({ userMessageId: 'u1' });
  });

  it('shows Resume on an ERROR session and dispatches RESUME_SESSION', () => {
    const doc = reducer(session(), endSession({ status: 'ERROR', endedAt: T2 }));
    const { dispatch } = renderSession(doc);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(dispatchedTypes(dispatch)).toEqual(['RESUME_SESSION']);
  });

  it('input enabled after a failed turn', () => {
    renderSession(withFailure(session()));
    const textarea = screen.getByRole('textbox');
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);
  });

  it('shows picked up when pickedUpAt is set', () => {
    const doc = reducer(session(), markMessagePickedUp({ messageId: 'u1', pickedUpAt: T2 }));
    renderSession(doc);
    expect(screen.getByText('Picked up')).toBeTruthy();
    expect(screen.queryByText('Not picked up yet')).toBeNull();
  });

  it('shows not picked up after 60s', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date(T3));
    const { dispatch } = renderSession(session());
    expect(screen.getByText('Delivered')).toBeTruthy();
    expect(screen.queryByText('Not picked up yet')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Not picked up yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(dispatchedTypes(dispatch)).toEqual(['RETRY_TURN']);
  });

  it('renders the host failure action for BUDGET_EXHAUSTED', () => {
    const renderFailureAction = vi.fn((failure: TurnFailure) => <button type="button">Request more budget ({failure.code})</button>);
    renderSession(withFailure(session(), 'BUDGET_EXHAUSTED', false), { renderFailureAction });
    expect(screen.getByRole('button', { name: 'Request more budget (BUDGET_EXHAUSTED)' })).toBeTruthy();
    expect(renderFailureAction).toHaveBeenCalledWith(expect.objectContaining({ code: 'BUDGET_EXHAUSTED', userMessageId: 'u1' }));
  });

  it('no spinner after FAIL_TURN', () => {
    // Before the failure the turn is in progress.
    const pending = reducer(session(), markMessagePickedUp({ messageId: 'u1', pickedUpAt: T1 }));
    const { rerender } = renderSession(pending);
    expect(screen.queryByRole('status', { name: 'Agent is typing' })).not.toBeNull();

    const failed = withFailure(session());
    rerender(<ChatSession document={failed} dispatch={vi.fn()} />);
    expect(screen.queryByRole('status', { name: 'Agent is typing' })).toBeNull();

    // A retry request makes it respond again.
    const retrying = reducer(failed, retryTurn({ userMessageId: 'u1' }));
    rerender(<ChatSession document={retrying} dispatch={vi.fn()} />);
    expect(screen.queryByRole('status', { name: 'Agent is typing' })).not.toBeNull();

    // So does a pickup newer than the failure (retry request already cleared).
    const pickedUpAgain = reducer(failed, markMessagePickedUp({ messageId: 'u1', pickedUpAt: T3 }));
    rerender(<ChatSession document={pickedUpAgain} dispatch={vi.fn()} />);
    expect(screen.queryByRole('status', { name: 'Agent is typing' })).not.toBeNull();
  });
});
