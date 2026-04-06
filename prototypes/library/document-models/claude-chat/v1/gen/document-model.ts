import type { DocumentModelGlobalState } from "document-model";

export const documentModel: DocumentModelGlobalState = {
  author: {
    name: "",
    website: "",
  },
  description: "Document model for the chat history with Claude AI agent(s)",
  extension: ".cchat",
  id: "powerhouse/claude-chat",
  name: "ClaudeChat",
  specifications: [
    {
      changeLog: [],
      modules: [
        {
          description: "",
          id: "1e768a92-d269-4dc9-b7df-862186bd863c",
          name: "agents",
          operations: [
            {
              description: "",
              errors: [],
              examples: [],
              id: "db81ddf7-8fc3-4d70-96e5-3835e7ede604",
              name: "ADD_AGENT",
              reducer:
                "const newAgent = {\n  id: action.input.id,\n  name: action.input.name,\n  model: action.input.model,\n  apiKey: action.input.apiKey,\n  initialPrompt: action.input.initialPrompt || null,\n};\nstate.agents.push(newAgent);",
              schema:
                "input AddAgentInput {\n  id: OID!\n  name: String!\n  apiKey: String!\n  model: String!\n  initialPrompt: String\n}",
              scope: "global",
              template: "",
            },
          ],
        },
        {
          description: "",
          id: "5933bb59-a4ac-4385-9ad6-38c8f3cb2b42",
          name: "messages",
          operations: [
            {
              description: "",
              errors: [],
              examples: [],
              id: "8f0926f1-6876-4fe8-89c5-fa06e406a0a6",
              name: "ADD_USER_MESSAGE",
              reducer: "",
              schema:
                "input AddUserMessageInput {\n  id: OID!\n  content: String!\n}",
              scope: "global",
              template: "",
            },
            {
              description: "",
              errors: [],
              examples: [],
              id: "b6b0f020-2d6e-49d9-8bdc-969632e903a3",
              name: "ADD_AGENT_MESSAGE",
              reducer: "",
              schema:
                "input AddAgentMessageInput {\n  id: OID!\n  agent: OID!\n  content: String!\n}",
              scope: "global",
              template: "",
            },
          ],
        },
        {
          description: "",
          id: "083b79c1-64dd-4c93-a9d5-69bee60fba19",
          name: "user",
          operations: [
            {
              description: "",
              errors: [],
              examples: [],
              id: "bc9faf58-08b5-43d7-9f85-6804505bd402",
              name: "SET_USERNAME",
              reducer: "",
              schema: "input SetUsernameInput {\n  username: String!\n}",
              scope: "global",
              template: "",
            },
            {
              description:
                "Sets the currently selected agent for the chat interface",
              errors: [],
              examples: [],
              id: "f4c8b2a1-3e5d-42a8-9f1c-8d7e6b9a0c3f",
              name: "SET_SELECTED_AGENT",
              reducer: "state.selectedAgent = action.input.agentId || null;",
              schema: "input SetSelectedAgentInput {\n  agentId: OID\n}",
              scope: "global",
              template:
                "Sets the currently selected agent for the chat interface",
            },
          ],
        },
      ],
      state: {
        global: {
          examples: [],
          initialValue:
            '{\n  "username": "",\n  "agents": [],\n  "messages": [],\n  "selectedAgent": null\n}',
          schema:
            'type ClaudeChatState {\n  username: String!\n  agents: [Agent!]!\n  messages: [Message!]!\n  selectedAgent: OID\n}\n\ntype Message {\n  id: OID!\n  "Agent ID or null in case of the user"\n  agent: OID\n  content: String!\n}\n\ntype Agent {\n  id: OID!\n  name: String!\n  apiKey: String!\n  model: String!\n  initialPrompt: String\n}',
        },
        local: {
          examples: [],
          initialValue: "",
          schema: "",
        },
      },
      version: 1,
    },
  ],
};
