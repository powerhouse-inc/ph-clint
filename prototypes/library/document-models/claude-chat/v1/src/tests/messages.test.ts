/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import { generateId } from "document-model/core";
import {
  reducer,
  utils,
  isClaudeChatDocument,
  addUserMessage,
  addAgentMessage,
  addAgent,
  AddUserMessageInputSchema,
  AddAgentMessageInputSchema,
} from "@powerhousedao/agent-manager/document-models/claude-chat";

describe("Messages Operations", () => {
  describe("User Messages", () => {
    it("should handle addUserMessage operation", () => {
      const document = utils.createDocument();
      const input = generateMock(AddUserMessageInputSchema());

      const updatedDocument = reducer(document, addUserMessage(input));

      expect(isClaudeChatDocument(updatedDocument)).toBe(true);
      expect(updatedDocument.operations.global).toHaveLength(1);
      expect(updatedDocument.operations.global[0].action.type).toBe(
        "ADD_USER_MESSAGE",
      );
      expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
        input,
      );
      expect(updatedDocument.operations.global[0].index).toEqual(0);
    });

    it("should add a user message with agent field set to null", () => {
      const document = utils.createDocument();
      const input = {
        id: "msg-001",
        content: "Hello, how can you help me?",
      };

      const updatedDocument = reducer(document, addUserMessage(input));

      expect(updatedDocument.state.global.messages).toHaveLength(1);
      const message = updatedDocument.state.global.messages[0];
      expect(message.id).toBe(input.id);
      expect(message.content).toBe(input.content);
      expect(message.agent).toBeNull();
    });

    it("should handle multiple user messages", () => {
      let document = utils.createDocument();
      const firstMessage = {
        id: "msg-001",
        content: "First user message",
      };
      const secondMessage = {
        id: "msg-002",
        content: "Second user message",
      };

      document = reducer(document, addUserMessage(firstMessage));
      document = reducer(document, addUserMessage(secondMessage));

      expect(document.state.global.messages).toHaveLength(2);
      expect(document.state.global.messages[0].content).toBe(
        firstMessage.content,
      );
      expect(document.state.global.messages[1].content).toBe(
        secondMessage.content,
      );
      expect(document.state.global.messages[0].agent).toBeNull();
      expect(document.state.global.messages[1].agent).toBeNull();
    });

    it("should handle empty content in user message", () => {
      const document = utils.createDocument();
      const input = {
        id: "msg-empty",
        content: "",
      };

      const updatedDocument = reducer(document, addUserMessage(input));

      expect(updatedDocument.state.global.messages).toHaveLength(1);
      expect(updatedDocument.state.global.messages[0].content).toBe("");
    });
  });

  describe("Agent Messages", () => {
    it("should handle addAgentMessage operation", () => {
      const document = utils.createDocument();
      const input = generateMock(AddAgentMessageInputSchema());

      const updatedDocument = reducer(document, addAgentMessage(input));

      expect(isClaudeChatDocument(updatedDocument)).toBe(true);
      expect(updatedDocument.operations.global).toHaveLength(1);
      expect(updatedDocument.operations.global[0].action.type).toBe(
        "ADD_AGENT_MESSAGE",
      );
      expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
        input,
      );
      expect(updatedDocument.operations.global[0].index).toEqual(0);
    });

    it("should add an agent message with the specified agent ID", () => {
      let document = utils.createDocument();

      // First add an agent
      const agentInput = {
        id: generateId(),
        name: "Claude Assistant",
        model: "claude-3",
        apiKey: "test-key",
        initialPrompt: "You are a helpful assistant",
      };
      document = reducer(document, addAgent(agentInput));
      const agentId = document.state.global.agents[0].id;

      // Then add agent message
      const messageInput = {
        id: "msg-001",
        content: "Hello! I can help you with that.",
        agent: agentId,
      };

      document = reducer(document, addAgentMessage(messageInput));

      expect(document.state.global.messages).toHaveLength(1);
      const message = document.state.global.messages[0];
      expect(message.id).toBe(messageInput.id);
      expect(message.content).toBe(messageInput.content);
      expect(message.agent).toBe(agentId);
    });

    it("should handle conversation between user and agent", () => {
      let document = utils.createDocument();

      // Add an agent
      const agentInput = {
        id: generateId(),
        name: "Assistant",
        model: "gpt-4",
        apiKey: "api-key",
        initialPrompt: "Be helpful and concise",
      };
      document = reducer(document, addAgent(agentInput));
      const agentId = document.state.global.agents[0].id;

      // Add user message
      document = reducer(
        document,
        addUserMessage({
          id: "msg-001",
          content: "What's the weather like?",
        }),
      );

      // Add agent response
      document = reducer(
        document,
        addAgentMessage({
          id: "msg-002",
          content: "I don't have access to real-time weather data.",
          agent: agentId,
        }),
      );

      // Add another user message
      document = reducer(
        document,
        addUserMessage({
          id: "msg-003",
          content: "Thanks for letting me know.",
        }),
      );

      expect(document.state.global.messages).toHaveLength(3);
      expect(document.state.global.messages[0].agent).toBeNull();
      expect(document.state.global.messages[1].agent).toBe(agentId);
      expect(document.state.global.messages[2].agent).toBeNull();
    });

    it("should handle messages from multiple agents", () => {
      let document = utils.createDocument();

      // Add two agents
      document = reducer(
        document,
        addAgent({
          id: generateId(),
          name: "Claude",
          model: "claude-3",
          apiKey: "key1",
          initialPrompt: "Be creative",
        }),
      );
      const claudeId = document.state.global.agents[0].id;

      document = reducer(
        document,
        addAgent({
          id: generateId(),
          name: "GPT",
          model: "gpt-4",
          apiKey: "key2",
          initialPrompt: "Be analytical",
        }),
      );
      const gptId = document.state.global.agents[1].id;

      // Add messages from different agents
      document = reducer(
        document,
        addAgentMessage({
          id: "msg-001",
          content: "Hello from Claude",
          agent: claudeId,
        }),
      );

      document = reducer(
        document,
        addAgentMessage({
          id: "msg-002",
          content: "Hello from GPT",
          agent: gptId,
        }),
      );

      expect(document.state.global.messages).toHaveLength(2);
      expect(document.state.global.messages[0].agent).toBe(claudeId);
      expect(document.state.global.messages[1].agent).toBe(gptId);
    });
  });

  describe("Message ordering and state preservation", () => {
    it("should maintain message order", () => {
      let document = utils.createDocument();
      const messageIds = ["msg-001", "msg-002", "msg-003", "msg-004"];

      for (const id of messageIds) {
        document = reducer(
          document,
          addUserMessage({
            id,
            content: `Message ${id}`,
          }),
        );
      }

      const messages = document.state.global.messages;
      expect(messages).toHaveLength(4);
      for (let i = 0; i < messageIds.length; i++) {
        expect(messages[i].id).toBe(messageIds[i]);
      }
    });

    it("should preserve other state properties when adding messages", () => {
      const document = utils.createDocument();
      const initialUsername = document.state.global.username;
      const initialAgents = document.state.global.agents;

      const updatedDocument = reducer(
        document,
        addUserMessage({
          id: "test-msg",
          content: "Test message",
        }),
      );

      expect(updatedDocument.state.global.username).toBe(initialUsername);
      expect(updatedDocument.state.global.agents).toStrictEqual(initialAgents);
    });
  });
});
