/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isAgentInboxDocument,
  setAgentName,
  SetAgentNameInputSchema,
  setAgentAddress,
  SetAgentAddressInputSchema,
  setAgentRole,
  SetAgentRoleInputSchema,
  setAgentDescription,
  SetAgentDescriptionInputSchema,
  setAgentAvatar,
  SetAgentAvatarInputSchema,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";

describe("Agent Operations", () => {
  it("should handle setAgentName operation", () => {
    const document = utils.createDocument();
    const name = "Alice Agent";
    const input = { name };

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
    // Test actual state change
    expect(updatedDocument.state.global.agent.name).toBe(name);
  });
  it("should handle setAgentAddress operation", () => {
    const document = utils.createDocument();
    const ethAddress = "0x1234567890123456789012345678901234567890";
    const input = { ethAddress };

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
    // Test actual state change
    expect(updatedDocument.state.global.agent.ethAddress).toBe(ethAddress);
  });

  it("should clear agent address when null is provided", () => {
    const document = utils.createDocument();
    document.state.global.agent.ethAddress = "0xOLDADDRESS";
    const input = { ethAddress: null };

    const updatedDocument = reducer(document, setAgentAddress(input));

    expect(updatedDocument.state.global.agent.ethAddress).toBeNull();
  });
  it("should handle setAgentRole operation", () => {
    const document = utils.createDocument();
    const role = "Project Manager";
    const input = { role };

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
    // Test actual state change
    expect(updatedDocument.state.global.agent.role).toBe(role);
  });

  it("should clear agent role when null is provided", () => {
    const document = utils.createDocument();
    document.state.global.agent.role = "Old Role";
    const input = { role: null };

    const updatedDocument = reducer(document, setAgentRole(input));

    expect(updatedDocument.state.global.agent.role).toBeNull();
  });
  it("should handle setAgentDescription operation", () => {
    const document = utils.createDocument();
    const description = "Expert in project management and team coordination";
    const input = { description };

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
    // Test actual state change
    expect(updatedDocument.state.global.agent.description).toBe(description);
  });

  it("should clear agent description when null is provided", () => {
    const document = utils.createDocument();
    document.state.global.agent.description = "Old description";
    const input = { description: null };

    const updatedDocument = reducer(document, setAgentDescription(input));

    expect(updatedDocument.state.global.agent.description).toBeNull();
  });
  it("should handle setAgentAvatar operation", () => {
    const document = utils.createDocument();
    const avatar = "https://example.com/avatar.png";
    const input = { avatar };

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
    // Test actual state change
    expect(updatedDocument.state.global.agent.avatar).toBe(avatar);
  });

  it("should clear agent avatar when null is provided", () => {
    const document = utils.createDocument();
    document.state.global.agent.avatar = "https://example.com/old-avatar.png";
    const input = { avatar: null };

    const updatedDocument = reducer(document, setAgentAvatar(input));

    expect(updatedDocument.state.global.agent.avatar).toBeNull();
  });
});
