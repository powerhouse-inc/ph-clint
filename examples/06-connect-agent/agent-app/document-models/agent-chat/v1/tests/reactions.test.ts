import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentChatDocument,
  addReaction,
  removeReaction,
  AddReactionInputSchema,
  RemoveReactionInputSchema,
} from "document-models/agent-chat/v1";

describe("ReactionsOperations", () => {
  it("should handle addReaction operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddReactionInputSchema());

    const updatedDocument = reducer(document, addReaction(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_REACTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeReaction operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveReactionInputSchema());

    const updatedDocument = reducer(document, removeReaction(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_REACTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
