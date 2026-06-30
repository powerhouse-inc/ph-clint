import { generateMock } from 'document-model';
import {
  abortSession,
  AbortSessionInputSchema,
  addUserMessage,
  AddUserMessageInputSchema,
  deleteUserMessage,
  DeleteUserMessageInputSchema,
  interruptAgent,
  InterruptAgentInputSchema,
  isChatSessionDocument,
  reducer,
  utils,
} from 'document-models/chat-session/v1';
import { describe, expect, it } from 'vitest';

describe('UserOperations', () => {
  it('should handle addUserMessage operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddUserMessageInputSchema(), {
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const updatedDocument = reducer(document, addUserMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_USER_MESSAGE');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle deleteUserMessage operation', () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteUserMessageInputSchema());

    const updatedDocument = reducer(document, deleteUserMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('DELETE_USER_MESSAGE');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle abortSession operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AbortSessionInputSchema(), {
      endedAt: '2024-01-01T00:00:00.000Z',
    });

    const updatedDocument = reducer(document, abortSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ABORT_SESSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle interruptAgent operation', () => {
    const document = utils.createDocument();
    const input = generateMock(InterruptAgentInputSchema());

    const updatedDocument = reducer(document, interruptAgent(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('INTERRUPT_AGENT');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
