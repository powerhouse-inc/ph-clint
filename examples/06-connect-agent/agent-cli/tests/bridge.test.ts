import { describe, it, expect, beforeEach } from '@jest/globals';
import type { StreamChunk } from 'ph-clint';
import { writeStreamToDocument, readMessagesAsHistory } from '../src/bridge.js';
import type { DocumentDispatcher, BridgeOptions } from '../src/bridge.js';
import type { AgentChatState, ChatMessage } from 'agent-app/document-models/agent-chat';

// ── Mock dispatcher ────────────────────────────────────────────────

function createMockDispatcher() {
  const actions: Array<{ documentId: string; action: any }> = [];
  const dispatcher: DocumentDispatcher = {
    async addAction(documentId, action) {
      actions.push({ documentId, action });
    },
  };
  return { dispatcher, actions };
}

// ── Mock action creators (matching agent-app's interface) ──────────

const mockCreators = {
  sendText: (input: any) => ({ type: 'SEND_TEXT', input, scope: 'global' }),
  sendToolCall: (input: any) => ({ type: 'SEND_TOOL_CALL', input, scope: 'global' }),
  sendToolResult: (input: any) => ({ type: 'SEND_TOOL_RESULT', input, scope: 'global' }),
  sendError: (input: any) => ({ type: 'SEND_ERROR', input, scope: 'global' }),
} as any;

// ── Helpers ────────────────────────────────────────────────────────

async function* streamOf(...chunks: StreamChunk[]): AsyncGenerator<StreamChunk> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

async function collectStream(gen: AsyncGenerator<StreamChunk>): Promise<StreamChunk[]> {
  const result: StreamChunk[] = [];
  for await (const chunk of gen) {
    result.push(chunk);
  }
  return result;
}

function makeBridgeOptions(dispatcher: DocumentDispatcher): BridgeOptions {
  return {
    dispatcher,
    documentId: 'doc-123',
    agentId: 'agent-1',
  };
}

// ── writeStreamToDocument tests ────────────────────────────────────

describe('writeStreamToDocument', () => {
  it('should dispatch sendText for text-delta chunks', async () => {
    const { dispatcher, actions } = createMockDispatcher();
    const stream = streamOf(
      { type: 'text-delta', text: 'Hello ' },
      { type: 'text-delta', text: 'world' },
    );

    const chunks = await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ type: 'text-delta', text: 'Hello ' });
    expect(chunks[1]).toEqual({ type: 'text-delta', text: 'world' });

    expect(actions).toHaveLength(2);
    expect(actions[0].documentId).toBe('doc-123');
    expect(actions[0].action.type).toBe('SEND_TEXT');
    expect(actions[0].action.input.sender).toBe('agent-1');
    expect(actions[0].action.input.text).toBe('Hello ');
    expect(actions[0].action.input.format).toBe('MarkDown');

    expect(actions[1].action.type).toBe('SEND_TEXT');
    expect(actions[1].action.input.text).toBe('world');
    // Same message ID for consecutive text chunks (auto-append)
    expect(actions[1].action.input.id).toBe(actions[0].action.input.id);
  });

  it('should dispatch sendToolCall for tool-call chunks', async () => {
    const { dispatcher, actions } = createMockDispatcher();
    const stream = streamOf({
      type: 'tool-call',
      toolName: 'search',
      args: { query: 'test' },
    });

    await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(actions).toHaveLength(1);
    expect(actions[0].action.type).toBe('SEND_TOOL_CALL');
    expect(actions[0].action.input.toolName).toBe('search');
    expect(actions[0].action.input.argsJson).toBe('{"query":"test"}');
  });

  it('should dispatch sendToolResult for tool-result chunks', async () => {
    const { dispatcher, actions } = createMockDispatcher();
    const stream = streamOf({
      type: 'tool-result',
      toolName: 'search',
      result: 'found 3 results',
      isError: false,
    });

    await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(actions).toHaveLength(1);
    expect(actions[0].action.type).toBe('SEND_TOOL_RESULT');
    expect(actions[0].action.input.toolName).toBe('search');
    expect(actions[0].action.input.result).toBe('found 3 results');
    expect(actions[0].action.input.isError).toBe(false);
  });

  it('should dispatch sendError for error chunks', async () => {
    const { dispatcher, actions } = createMockDispatcher();
    const stream = streamOf({
      type: 'error',
      error: 'something went wrong',
    });

    await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(actions).toHaveLength(1);
    expect(actions[0].action.type).toBe('SEND_ERROR');
    expect(actions[0].action.input.error).toBe('something went wrong');
  });

  it('should generate new message IDs after tool-result', async () => {
    const { dispatcher, actions } = createMockDispatcher();
    const stream = streamOf(
      { type: 'text-delta', text: 'Before tool' },
      { type: 'tool-call', toolName: 'foo', args: {} },
      { type: 'tool-result', toolName: 'foo', result: 'ok', isError: false },
      { type: 'text-delta', text: 'After tool' },
    );

    await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(actions).toHaveLength(4);
    const textBeforeId = actions[0].action.input.id;
    const toolCallId = actions[1].action.input.id;
    const toolResultId = actions[2].action.input.id;
    const textAfterId = actions[3].action.input.id;

    // Tool call gets a new ID
    expect(toolCallId).not.toBe(textBeforeId);
    // Tool result gets a new ID
    expect(toolResultId).not.toBe(toolCallId);
    // Text after tool gets a new ID (not the same as the pre-tool text)
    expect(textAfterId).not.toBe(textBeforeId);
  });

  it('should forward all chunks unchanged', async () => {
    const { dispatcher } = createMockDispatcher();
    const input: StreamChunk[] = [
      { type: 'text-delta', text: 'hi' },
      { type: 'tool-call', toolName: 'x', args: null },
      { type: 'tool-result', toolName: 'x', result: 'y', isError: false },
      { type: 'error', error: 'oops' },
    ];
    const stream = streamOf(...input);

    const output = await collectStream(
      writeStreamToDocument(stream, makeBridgeOptions(dispatcher), mockCreators),
    );

    expect(output).toEqual(input);
  });
});

// ── readMessagesAsHistory tests ────────────────────────────────────

describe('readMessagesAsHistory', () => {
  const agentIds = new Set(['agent-1']);

  function makeMessage(overrides: Partial<ChatMessage>): ChatMessage {
    return {
      id: 'msg-1',
      sender: 'user-1',
      mentioned: [],
      when: '2024-01-01T00:00:00Z',
      updated: null,
      type: 'Text',
      format: null,
      text: null,
      toolCall: null,
      toolResult: null,
      error: null,
      reactions: [],
      readBy: [],
      ...overrides,
    };
  }

  function makeState(messages: ChatMessage[]): AgentChatState {
    return {
      topic: null,
      agents: [{ id: 'agent-1', name: 'Agent', role: null, description: null, avatar: null, ethAddress: null, removed: false }],
      stakeholders: [{ id: 'user-1', name: 'User', avatar: null, ethAddress: null, removed: false }],
      messages,
      pruneLength: null,
    };
  }

  it('should convert Text messages from stakeholders to user role', () => {
    const state = makeState([
      makeMessage({ sender: 'user-1', type: 'Text', text: ['Hello ', 'world'] }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toEqual([
      { role: 'user', content: 'Hello world' },
    ]);
  });

  it('should convert Text messages from agents to assistant role', () => {
    const state = makeState([
      makeMessage({ sender: 'agent-1', type: 'Text', text: ['Hi there'] }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toEqual([
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('should convert ToolCall messages to assistant role', () => {
    const state = makeState([
      makeMessage({
        sender: 'agent-1',
        type: 'ToolCall',
        toolCall: { name: 'search', argsJson: '{"q":"test"}' },
      }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('assistant');
    expect(history[0].content).toContain('search');
  });

  it('should convert ToolResult messages to tool role', () => {
    const state = makeState([
      makeMessage({
        sender: 'agent-1',
        type: 'ToolResult',
        toolResult: { name: 'search', result: 'found it', isError: false },
      }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toEqual([
      { role: 'tool', content: 'found it' },
    ]);
  });

  it('should convert Error messages', () => {
    const state = makeState([
      makeMessage({ sender: 'agent-1', type: 'Error', error: 'timeout' }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toEqual([
      { role: 'assistant', content: 'Error: timeout' },
    ]);
  });

  it('should handle a multi-turn conversation', () => {
    const state = makeState([
      makeMessage({ id: '1', sender: 'user-1', type: 'Text', text: ['What is 2+2?'] }),
      makeMessage({ id: '2', sender: 'agent-1', type: 'Text', text: ['2+2 equals ', '4.'] }),
      makeMessage({ id: '3', sender: 'user-1', type: 'Text', text: ['Thanks!'] }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);

    expect(history).toEqual([
      { role: 'user', content: 'What is 2+2?' },
      { role: 'assistant', content: '2+2 equals 4.' },
      { role: 'user', content: 'Thanks!' },
    ]);
  });

  it('should skip messages with empty text', () => {
    const state = makeState([
      makeMessage({ sender: 'user-1', type: 'Text', text: [] }),
      makeMessage({ sender: 'user-1', type: 'Text', text: null }),
    ]);

    const history = readMessagesAsHistory(state, agentIds);
    expect(history).toEqual([]);
  });
});
