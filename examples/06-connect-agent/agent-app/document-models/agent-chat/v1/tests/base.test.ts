import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentChatDocument,
  setTopic,
  clearTopic,
  setPruneLength,
  removePruneLength,
  SetTopicInputSchema,
  ClearTopicInputSchema,
  SetPruneLengthInputSchema,
  RemovePruneLengthInputSchema,
} from "document-models/agent-chat/v1";

describe("BaseOperations", () => {
  it("should handle setTopic operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetTopicInputSchema());

    const updatedDocument = reducer(document, setTopic(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("SET_TOPIC");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearTopic operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearTopicInputSchema());

    const updatedDocument = reducer(document, clearTopic(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_TOPIC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPruneLength operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPruneLengthInputSchema());

    const updatedDocument = reducer(document, setPruneLength(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PRUNE_LENGTH",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removePruneLength operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemovePruneLengthInputSchema());

    const updatedDocument = reducer(document, removePruneLength(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_PRUNE_LENGTH",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
