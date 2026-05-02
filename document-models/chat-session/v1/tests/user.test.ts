import { abortSession, addAssistantMessage, addToolOutput, addUserMessage, appendAssistantContent, deleteUserMessage, reducer, setMessageUsage, startSession, updateAssistantContent, utils } from 'document-models/chat-session/v1';
import { describe, expect, it } from 'vitest';

describe('UserOperations', () => {
  it('all error paths: MessageNotFound, NotAssistantMessage, ContentPartNotFound, NotUserMessage, InvalidContentPart', () => {
    // set up: session with one assistant message and one user message
    let doc = reducer(
      utils.createDocument(),
      startSession({
        threadId: 't',
        resourceId: 'r',
        startedAt: '2025-01-01T00:00:00Z',
        agent: { name: 'Bot' },
      }),
    );
    doc = reducer(
      doc,
      addAssistantMessage({
        id: 'msg-a',
        content: [{ id: 'part-a', type: 'TEXT', text: 'hello' }],
        createdAt: '2025-01-01T00:00:01Z',
      }),
    );
    doc = reducer(
      doc,
      addUserMessage({
        id: 'msg-u',
        content: [{ id: 'part-u', type: 'TEXT', text: 'hi' }],
        createdAt: '2025-01-01T00:00:02Z',
      }),
    );

    const stateBeforeErrors = doc.state.global;
    let opIdx = 3; // next operation index

    // 1. appendAssistantContent — nonexistent message
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'nonexistent',
        part: { id: 'x', type: 'TEXT', text: 'x' },
      }),
    );
    expect(doc.operations.global[opIdx].error).toContain('Message not found');

    // 2. appendAssistantContent — target is USER message
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'msg-u',
        part: { id: 'x', type: 'TEXT', text: 'x' },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('Can only append to ASSISTANT');

    // 3. updateAssistantContent — valid message, nonexistent part
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: 'msg-a',
        partId: 'nonexistent',
        text: 'x',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('Content part not found');

    // 4. updateAssistantContent — nonexistent message
    doc = reducer(
      doc,
      updateAssistantContent({
        messageId: 'nonexistent',
        partId: 'x',
        text: 'x',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('Message not found');

    // 5. setMessageUsage — nonexistent message
    doc = reducer(doc, setMessageUsage({ messageId: 'nonexistent' }));
    expect(doc.operations.global[++opIdx].error).toContain('Message not found');

    // 6. deleteUserMessage — nonexistent
    doc = reducer(doc, deleteUserMessage({ messageId: 'nonexistent' }));
    expect(doc.operations.global[++opIdx].error).toContain('Message not found');

    // 7. deleteUserMessage — target is ASSISTANT message
    doc = reducer(doc, deleteUserMessage({ messageId: 'msg-a' }));
    expect(doc.operations.global[++opIdx].error).toContain('Can only delete USER');

    // 8. addToolOutput — nonexistent message
    doc = reducer(
      doc,
      addToolOutput({
        messageId: 'nonexistent',
        partId: 'x',
        text: 'x',
        toolCallId: 'tc',
        toolName: 't',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('Message not found');

    // 9. addAssistantMessage — TEXT part without text
    doc = reducer(
      doc,
      addAssistantMessage({
        id: 'bad-1',
        content: [{ id: 'p', type: 'TEXT' }],
        createdAt: '2025-01-01T00:00:03Z',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TEXT part requires text');

    // 10. addAssistantMessage — TOOL_CALL without toolCallId
    doc = reducer(
      doc,
      addAssistantMessage({
        id: 'bad-2',
        content: [{ id: 'p', type: 'TOOL_CALL', toolName: 'search' }],
        createdAt: '2025-01-01T00:00:04Z',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TOOL_CALL part requires toolCallId');

    // 11. addAssistantMessage — TOOL_CALL without toolName
    doc = reducer(
      doc,
      addAssistantMessage({
        id: 'bad-3',
        content: [{ id: 'p', type: 'TOOL_CALL', toolCallId: 'tc-1' }],
        createdAt: '2025-01-01T00:00:05Z',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TOOL_CALL part requires toolName');

    // 12. appendAssistantContent — REASONING without text
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'msg-a',
        part: { id: 'p', type: 'REASONING' },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('REASONING part requires text');

    // 13. appendAssistantContent — TOOL_CALL without toolCallId
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'msg-a',
        part: { id: 'p', type: 'TOOL_CALL', toolName: 'search' },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TOOL_CALL part requires toolCallId');

    // 14. appendAssistantContent — TOOL_CALL without toolName
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'msg-a',
        part: { id: 'p', type: 'TOOL_CALL', toolCallId: 'tc-1' },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TOOL_CALL part requires toolName');

    // 15. appendAssistantContent — ERROR without error field
    doc = reducer(
      doc,
      appendAssistantContent({
        messageId: 'msg-a',
        part: { id: 'p', type: 'ERROR' },
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('ERROR part requires error field');

    // 16. addAssistantMessage — ERROR part without error field
    doc = reducer(
      doc,
      addAssistantMessage({
        id: 'bad-4',
        content: [{ id: 'p', type: 'ERROR' }],
        createdAt: '2025-01-01T00:00:06Z',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('ERROR part requires error field');

    // 17. addUserMessage — TEXT part without text
    doc = reducer(
      doc,
      addUserMessage({
        id: 'bad-5',
        content: [{ id: 'p', type: 'TEXT' }],
        createdAt: '2025-01-01T00:00:07Z',
      }),
    );
    expect(doc.operations.global[++opIdx].error).toContain('TEXT part requires text');

    // state unchanged through all errors
    expect(doc.state.global.messages).toStrictEqual(stateBeforeErrors.messages);

    // abortSession sets status and endedAt
    doc = reducer(doc, abortSession({ endedAt: '2025-01-01T00:01:00Z' }));
    expect(doc.state.global.status).toBe('ABORTED');
    expect(doc.state.global.endedAt).toBe('2025-01-01T00:01:00Z');
  });
});
