import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  setAgentName,
  setAgentAddress,
  setAgentRole,
  setAgentDescription,
  setAgentAvatar,
  SetAgentNameInputSchema,
  SetAgentAddressInputSchema,
  SetAgentRoleInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentAvatarInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

describe("AgentOperations", () => {
  it("should handle setAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentNameInputSchema());

    const updatedDocument = reducer(document, setAgentName(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentAddress operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentAddressInputSchema());

    const updatedDocument = reducer(document, setAgentAddress(input));

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_ADDRESS",
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

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
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

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
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

    expect(isAgentInboxDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_AVATAR",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
