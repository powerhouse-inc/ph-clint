import type { ClaudeChatUserOperations } from "@powerhousedao/agent-manager/document-models/claude-chat/v1";

export const claudeChatUserOperations: ClaudeChatUserOperations = {
  setUsernameOperation(state, action) {
    state.username = action.input.username;
  },
  setSelectedAgentOperation(state, action) {
    state.selectedAgent = action.input.agentId || null;
  },
};
