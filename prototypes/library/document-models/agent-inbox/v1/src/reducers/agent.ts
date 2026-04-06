import type { AgentInboxAgentOperations } from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

export const agentInboxAgentOperations: AgentInboxAgentOperations = {
  setAgentNameOperation(state, action) {
    state.agent.name = action.input.name;
  },
  setAgentAddressOperation(state, action) {
    state.agent.ethAddress = action.input.ethAddress || null;
  },
  setAgentRoleOperation(state, action) {
    state.agent.role = action.input.role || null;
  },
  setAgentDescriptionOperation(state, action) {
    state.agent.description = action.input.description || null;
  },
  setAgentAvatarOperation(state, action) {
    state.agent.avatar = action.input.avatar || null;
  },
};
