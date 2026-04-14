import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentChatDocument,
  sendText,
  sendError,
  sendToolCall,
  sendToolResult,
  deleteMessage,
  markAsRead,
  SendTextInputSchema,
  SendErrorInputSchema,
  SendToolCallInputSchema,
  SendToolResultInputSchema,
  DeleteMessageInputSchema,
  MarkAsReadInputSchema,
} from "document-models/agent-chat/v1";

describe("MessagesOperations", () => {
  it("should handle sendText operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendTextInputSchema());

    const updatedDocument = reducer(document, sendText(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("SEND_TEXT");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle sendError operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendErrorInputSchema());

    const updatedDocument = reducer(document, sendError(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("SEND_ERROR");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle sendToolCall operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendToolCallInputSchema());

    const updatedDocument = reducer(document, sendToolCall(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SEND_TOOL_CALL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle sendToolResult operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SendToolResultInputSchema());

    const updatedDocument = reducer(document, sendToolResult(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SEND_TOOL_RESULT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteMessageInputSchema());

    const updatedDocument = reducer(document, deleteMessage(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle markAsRead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(MarkAsReadInputSchema());

    const updatedDocument = reducer(document, markAsRead(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "MARK_AS_READ",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
