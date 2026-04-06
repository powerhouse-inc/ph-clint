/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isClaudeChatDocument,
  setUsername,
  SetUsernameInputSchema,
  setSelectedAgent,
  SetSelectedAgentInputSchema,
} from "@powerhousedao/agent-manager/document-models/claude-chat";

describe("User Operations", () => {
  it("should handle setUsername operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetUsernameInputSchema());

    const updatedDocument = reducer(document, setUsername(input));

    expect(isClaudeChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_USERNAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should update username in document state", () => {
    const document = utils.createDocument();
    const newUsername = "TestUser123";
    const input = { username: newUsername };

    const updatedDocument = reducer(document, setUsername(input));

    expect(updatedDocument.state.global.username).toBe(newUsername);
  });

  it("should handle empty username", () => {
    const document = utils.createDocument();
    const input = { username: "" };

    const updatedDocument = reducer(document, setUsername(input));

    expect(updatedDocument.state.global.username).toBe("");
  });

  it("should preserve other state properties when updating username", () => {
    const document = utils.createDocument();
    const initialAgents = document.state.global.agents;
    const initialMessages = document.state.global.messages;
    const input = { username: "NewUser" };

    const updatedDocument = reducer(document, setUsername(input));

    expect(updatedDocument.state.global.agents).toStrictEqual(initialAgents);
    expect(updatedDocument.state.global.messages).toStrictEqual(
      initialMessages,
    );
  });

  it("should handle multiple username changes", () => {
    let document = utils.createDocument();
    const firstUsername = "User1";
    const secondUsername = "User2";

    document = reducer(document, setUsername({ username: firstUsername }));
    expect(document.state.global.username).toBe(firstUsername);

    document = reducer(document, setUsername({ username: secondUsername }));
    expect(document.state.global.username).toBe(secondUsername);
    expect(document.operations.global).toHaveLength(2);
  });
});

describe("Selected Agent Operations", () => {
  it("should handle setSelectedAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSelectedAgentInputSchema());

    const updatedDocument = reducer(document, setSelectedAgent(input));

    expect(isClaudeChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SELECTED_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should update selectedAgent in document state", () => {
    const document = utils.createDocument();
    const agentId = "agent-123";
    const input = { agentId };

    const updatedDocument = reducer(document, setSelectedAgent(input));

    expect(updatedDocument.state.global.selectedAgent).toBe(agentId);
  });

  it("should handle null selectedAgent", () => {
    const document = utils.createDocument();
    const input = { agentId: null };

    const updatedDocument = reducer(document, setSelectedAgent(input));

    expect(updatedDocument.state.global.selectedAgent).toBe(null);
  });

  it("should handle undefined selectedAgent", () => {
    const document = utils.createDocument();
    const input = { agentId: undefined };

    const updatedDocument = reducer(document, setSelectedAgent(input));

    expect(updatedDocument.state.global.selectedAgent).toBe(null);
  });

  it("should preserve other state properties when updating selectedAgent", () => {
    const document = utils.createDocument();
    const initialUsername = document.state.global.username;
    const initialAgents = document.state.global.agents;
    const initialMessages = document.state.global.messages;
    const input = { agentId: "agent-456" };

    const updatedDocument = reducer(document, setSelectedAgent(input));

    expect(updatedDocument.state.global.username).toBe(initialUsername);
    expect(updatedDocument.state.global.agents).toStrictEqual(initialAgents);
    expect(updatedDocument.state.global.messages).toStrictEqual(
      initialMessages,
    );
  });

  it("should handle changing selectedAgent multiple times", () => {
    let document = utils.createDocument();
    const firstAgent = "agent-1";
    const secondAgent = "agent-2";

    document = reducer(document, setSelectedAgent({ agentId: firstAgent }));
    expect(document.state.global.selectedAgent).toBe(firstAgent);

    document = reducer(document, setSelectedAgent({ agentId: secondAgent }));
    expect(document.state.global.selectedAgent).toBe(secondAgent);
    expect(document.operations.global).toHaveLength(2);
  });

  it("should handle deselecting agent after selection", () => {
    let document = utils.createDocument();
    const agentId = "agent-123";

    // Select an agent
    document = reducer(document, setSelectedAgent({ agentId }));
    expect(document.state.global.selectedAgent).toBe(agentId);

    // Deselect the agent
    document = reducer(document, setSelectedAgent({ agentId: null }));
    expect(document.state.global.selectedAgent).toBe(null);
    expect(document.operations.global).toHaveLength(2);
  });
});
