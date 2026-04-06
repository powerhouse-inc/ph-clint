import type { ClaudeChatMessagesOperations } from "@powerhousedao/agent-manager/document-models/claude-chat/v1";

export const claudeChatMessagesOperations: ClaudeChatMessagesOperations = {
  addUserMessageOperation(state, action) {
    const userMessage = {
      id: action.input.id,
      content: action.input.content,
      agent: null,
    };
    state.messages.push(userMessage);
  },
  addAgentMessageOperation(state, action) {
    const agentMessage = {
      id: action.input.id,
      content: action.input.content,
      agent: action.input.agent,
    };
    state.messages.push(agentMessage);
  },
};
