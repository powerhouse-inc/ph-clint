import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentChatDocument,
  addAgent,
  AddAgentInputSchema,
  setAgentName,
  setAgentEthAddress,
  setAgentRole,
  setAgentDescription,
  setAgentAvatar,
  removeAgent,
  readdAgent,
  SetAgentNameInputSchema,
  SetAgentEthAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
  RemoveAgentInputSchema,
  ReaddAgentInputSchema,
} from "document-models/agent-chat/v1";

describe("AgentsOperations", () => {
  it("should handle addAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentInputSchema());

    const updatedDocument = reducer(document, addAgent(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_AGENT");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentNameInputSchema());

    const updatedDocument = reducer(document, setAgentName(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentEthAddress operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentEthAddressInputSchema());

    const updatedDocument = reducer(document, setAgentEthAddress(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_ETH_ADDRESS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentRole operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentRoleInputSchema());

    const updatedDocument = reducer(document, setAgentRole(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_ROLE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setAgentDescription(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentAvatar operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentAvatarInputSchema());

    const updatedDocument = reducer(document, setAgentAvatar(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_AVATAR",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentInputSchema());

    const updatedDocument = reducer(document, removeAgent(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle readdAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReaddAgentInputSchema());

    const updatedDocument = reducer(document, readdAgent(input));

    expect(isAgentChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "READD_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
