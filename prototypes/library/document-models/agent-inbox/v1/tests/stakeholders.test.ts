import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  addStakeholder,
  removeStakeholder,
  setStakeholderName,
  setStakeholderAddress,
  setStakeholderAvatar,
  moveStakeholder,
  AddStakeholderInputSchema,
  RemoveStakeholderInputSchema,
  SetStakeholderNameInputSchema,
  SetStakeholderAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  MoveStakeholderInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

describe("StakeholdersOperations", () => {
  it("should handle addStakeholder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddStakeholderInputSchema());

    const updatedDocument = reducer(document, addStakeholder(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeStakeholder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveStakeholderInputSchema());

    const updatedDocument = reducer(document, removeStakeholder(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setStakeholderName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetStakeholderNameInputSchema());

    const updatedDocument = reducer(document, setStakeholderName(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setStakeholderAddress operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetStakeholderAddressInputSchema());

    const updatedDocument = reducer(document, setStakeholderAddress(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_ADDRESS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setStakeholderAvatar operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetStakeholderAvatarInputSchema());

    const updatedDocument = reducer(document, setStakeholderAvatar(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_AVATAR",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle moveStakeholder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(MoveStakeholderInputSchema());

    const updatedDocument = reducer(document, moveStakeholder(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "MOVE_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
