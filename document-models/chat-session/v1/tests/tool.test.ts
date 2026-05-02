import { generateMock } from "document-model";
import {
  addToolOutput,
  AddToolOutputInputSchema,
  addToolResult,
  AddToolResultInputSchema,
  isChatSessionDocument,
  reducer,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("ToolOperations", () => {
  it("should handle addToolResult operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolResultInputSchema());

    const updatedDocument = reducer(document, addToolResult(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_RESULT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolOutput operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolOutputInputSchema());

    const updatedDocument = reducer(document, addToolOutput(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_OUTPUT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolResult operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolResultInputSchema());

    const updatedDocument = reducer(document, addToolResult(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_RESULT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolOutput operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolOutputInputSchema());

    const updatedDocument = reducer(document, addToolOutput(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_OUTPUT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolResult operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolResultInputSchema());

    const updatedDocument = reducer(document, addToolResult(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_RESULT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolOutput operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolOutputInputSchema());

    const updatedDocument = reducer(document, addToolOutput(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_OUTPUT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolResult operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolResultInputSchema());

    const updatedDocument = reducer(document, addToolResult(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_RESULT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addToolOutput operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddToolOutputInputSchema());

    const updatedDocument = reducer(document, addToolOutput(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TOOL_OUTPUT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
