import { generateMock } from 'document-model';
import {
  addAssistantMessage,
  AddAssistantMessageInputSchema,
  appendAssistantContent,
  AppendAssistantContentInputSchema,
  finishAssistantMessage,
  FinishAssistantMessageInputSchema,
  isChatSessionDocument,
  reducer,
  setMessageUsage,
  SetMessageUsageInputSchema,
  updateAssistantContent,
  UpdateAssistantContentInputSchema,
  utils,
} from 'document-models/chat-session/v1';
import { describe, expect, it } from 'vitest';

describe('AgentOperations', () => {
  it('should handle addAssistantMessage operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddAssistantMessageInputSchema(), {
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const updatedDocument = reducer(document, addAssistantMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_ASSISTANT_MESSAGE');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle appendAssistantContent operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AppendAssistantContentInputSchema());

    const updatedDocument = reducer(document, appendAssistantContent(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('APPEND_ASSISTANT_CONTENT');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle updateAssistantContent operation', () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateAssistantContentInputSchema());

    const updatedDocument = reducer(document, updateAssistantContent(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('UPDATE_ASSISTANT_CONTENT');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setMessageUsage operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetMessageUsageInputSchema());

    const updatedDocument = reducer(document, setMessageUsage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_MESSAGE_USAGE');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle finishAssistantMessage operation', () => {
    const document = utils.createDocument();
    const input = generateMock(FinishAssistantMessageInputSchema(), {
      finishedAt: '2024-01-01T00:00:00.000Z',
    });

    const updatedDocument = reducer(document, finishAssistantMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('FINISH_ASSISTANT_MESSAGE');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
