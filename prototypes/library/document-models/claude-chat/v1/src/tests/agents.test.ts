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
  addAgent,
  AddAgentInputSchema,
} from "@powerhousedao/agent-manager/document-models/claude-chat";

describe("Agents Operations", () => {
  it("should handle addAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentInputSchema());

    const updatedDocument = reducer(document, addAgent(input));

    expect(isClaudeChatDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_AGENT");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should add a new agent to the agents array", () => {
    const document = utils.createDocument();
    const input = {
      id: generateId(),
      name: "Claude Assistant",
      model: "claude-3-opus-20240229",
      apiKey: "test-api-key-123",
      initialPrompt: "You are a helpful assistant",
    };

    const updatedDocument = reducer(document, addAgent(input));

    expect(updatedDocument.state.global.agents).toHaveLength(1);
    const addedAgent = updatedDocument.state.global.agents[0];
    expect(addedAgent.name).toBe(input.name);
    expect(addedAgent.model).toBe(input.model);
    expect(addedAgent.apiKey).toBe(input.apiKey);
    expect(addedAgent.initialPrompt).toBe(input.initialPrompt);
    expect(addedAgent.id).toBeDefined();
    expect(typeof addedAgent.id).toBe("string");
  });

  it("should use the provided IDs for each agent", () => {
    const document = utils.createDocument();
    const firstId = generateId();
    const secondId = generateId();
    const firstAgent = {
      id: firstId,
      name: "Claude",
      model: "claude-3-opus",
      apiKey: "key1",
      initialPrompt: "Be concise",
    };
    const secondAgent = {
      id: secondId,
      name: "GPT",
      model: "gpt-4",
      apiKey: "key2",
      initialPrompt: "Be detailed",
    };

    let updatedDocument = reducer(document, addAgent(firstAgent));
    updatedDocument = reducer(updatedDocument, addAgent(secondAgent));

    const agents = updatedDocument.state.global.agents;
    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe(firstId);
    expect(agents[1].id).toBe(secondId);
    expect(agents[0].id).not.toBe(agents[1].id);
  });

  it("should preserve existing agents when adding new ones", () => {
    const document = utils.createDocument();
    const firstAgent = {
      id: generateId(),
      name: "Agent1",
      model: "model1",
      apiKey: "key1",
      initialPrompt: "First prompt",
    };
    const secondAgent = {
      id: generateId(),
      name: "Agent2",
      model: "model2",
      apiKey: "key2",
      initialPrompt: "Second prompt",
    };

    let updatedDocument = reducer(document, addAgent(firstAgent));
    const firstAgentData = updatedDocument.state.global.agents[0];

    updatedDocument = reducer(updatedDocument, addAgent(secondAgent));

    expect(updatedDocument.state.global.agents).toHaveLength(2);
    expect(updatedDocument.state.global.agents[0]).toStrictEqual(
      firstAgentData,
    );
    expect(updatedDocument.state.global.agents[1].name).toBe(secondAgent.name);
  });

  it("should handle multiple agents with the same name", () => {
    const document = utils.createDocument();
    const agent1 = {
      id: generateId(),
      name: "Claude",
      model: "claude-3-opus",
      apiKey: "key1",
      initialPrompt: "Be creative",
    };
    const agent2 = {
      id: generateId(),
      name: "Claude",
      model: "claude-3-sonnet",
      apiKey: "key2",
      initialPrompt: "Be analytical",
    };

    let updatedDocument = reducer(document, addAgent(agent1));
    updatedDocument = reducer(updatedDocument, addAgent(agent2));

    const agents = updatedDocument.state.global.agents;
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe("Claude");
    expect(agents[1].name).toBe("Claude");
    expect(agents[0].model).not.toBe(agents[1].model);
    expect(agents[0].id).not.toBe(agents[1].id);
  });

  it("should preserve other state properties when adding agents", () => {
    const document = utils.createDocument();
    const initialUsername = document.state.global.username;
    const initialMessages = document.state.global.messages;

    const input = {
      id: generateId(),
      name: "Test Agent",
      model: "test-model",
      apiKey: "test-key",
      initialPrompt: "Test prompt",
    };

    const updatedDocument = reducer(document, addAgent(input));

    expect(updatedDocument.state.global.username).toBe(initialUsername);
    expect(updatedDocument.state.global.messages).toStrictEqual(
      initialMessages,
    );
  });

  describe("initialPrompt handling", () => {
    it("should set initialPrompt when provided", () => {
      const document = utils.createDocument();
      const input = {
        id: generateId(),
        name: "JSON Agent",
        model: "claude-3-sonnet",
        apiKey: "test-key",
        initialPrompt: "Always respond in JSON format",
      };

      const updatedDocument = reducer(document, addAgent(input));

      const addedAgent = updatedDocument.state.global.agents[0];
      expect(addedAgent.initialPrompt).toBe("Always respond in JSON format");
    });

    it("should set initialPrompt to null when not provided", () => {
      const document = utils.createDocument();
      const input = {
        id: generateId(),
        name: "Basic Agent",
        model: "claude-3-haiku",
        apiKey: "test-key",
      };

      const updatedDocument = reducer(document, addAgent(input));

      const addedAgent = updatedDocument.state.global.agents[0];
      expect(addedAgent.initialPrompt).toBeNull();
    });

    it("should set initialPrompt to null when empty string provided", () => {
      const document = utils.createDocument();
      const input = {
        id: generateId(),
        name: "Empty Prompt Agent",
        model: "claude-3-opus",
        apiKey: "test-key",
        initialPrompt: "",
      };

      const updatedDocument = reducer(document, addAgent(input));

      const addedAgent = updatedDocument.state.global.agents[0];
      expect(addedAgent.initialPrompt).toBeNull();
    });

    it("should handle different initial prompts for agents with same model", () => {
      const document = utils.createDocument();
      const frenchAgent = {
        id: generateId(),
        name: "French Agent",
        model: "claude-3-sonnet",
        apiKey: "key1",
        initialPrompt: "Réponds toujours en français",
      };
      const jsonAgent = {
        id: generateId(),
        name: "JSON Agent",
        model: "claude-3-sonnet",
        apiKey: "key2",
        initialPrompt: "Always respond in valid JSON format",
      };

      let updatedDocument = reducer(document, addAgent(frenchAgent));
      updatedDocument = reducer(updatedDocument, addAgent(jsonAgent));

      const agents = updatedDocument.state.global.agents;
      expect(agents).toHaveLength(2);
      expect(agents[0].initialPrompt).toBe("Réponds toujours en français");
      expect(agents[1].initialPrompt).toBe(
        "Always respond in valid JSON format",
      );
    });
  });
});
