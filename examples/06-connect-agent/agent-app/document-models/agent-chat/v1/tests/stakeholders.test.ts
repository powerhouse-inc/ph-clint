import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentChatDocument,
  addStakeholder,
  AddStakeholderInputSchema,
  setStakeholderName,
  setStakeholderEthAddress,
  setStakeholderAvatar,
  removeStakeholder,
  readdStakeholder,
  SetStakeholderNameInputSchema,
  SetStakeholderEthAddressInputSchema,
  SetStakeholderAvatarInputSchema,
  RemoveStakeholderInputSchema,
  ReaddStakeholderInputSchema,
} from "document-models/agent-chat/v1";

describe("StakeholdersOperations", () => {
  it("should handle addStakeholder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddStakeholderInputSchema());

    const updatedDocument = reducer(document, addStakeholder(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_STAKEHOLDER",
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

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setStakeholderEthAddress operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetStakeholderEthAddressInputSchema());

    const updatedDocument = reducer(document, setStakeholderEthAddress(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_ETH_ADDRESS",
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

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STAKEHOLDER_AVATAR",
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

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle readdStakeholder operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReaddStakeholderInputSchema());

    const updatedDocument = reducer(document, readdStakeholder(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "READD_STAKEHOLDER",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
