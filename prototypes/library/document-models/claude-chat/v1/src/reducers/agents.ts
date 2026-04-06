import type { ClaudeChatAgentsOperations } from "@powerhousedao/agent-manager/document-models/claude-chat/v1";

export const claudeChatAgentsOperations: ClaudeChatAgentsOperations = {
  addAgentOperation(state, action) {
    const newAgent = {
      id: action.input.id,
      name: action.input.name,
      model: action.input.model,
      apiKey: action.input.apiKey,
      initialPrompt: action.input.initialPrompt || null,
    };
    state.agents.push(newAgent);
  },
};
