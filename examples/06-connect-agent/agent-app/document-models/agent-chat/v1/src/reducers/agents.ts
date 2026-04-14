import type { AgentChatAgentsOperations } from "document-models/agent-chat/v1";
import {
  DuplicateAgentError,
  AgentNotFoundError,
} from "../../gen/agents/error.js";

export const agentChatAgentsOperations: AgentChatAgentsOperations = {
  addAgentOperation(state, action) {
    const exists = state.agents.some((a) => a.id === action.input.id);
    if (exists) {
      throw new DuplicateAgentError(
        `Agent with ID ${action.input.id} already exists`,
      );
    }
    state.agents.push({
      id: action.input.id,
      name: action.input.name || null,
      ethAddress: action.input.ethAddress || null,
      role: action.input.role || null,
      description: action.input.description || null,
      avatar: action.input.avatar || null,
      removed: false,
    });
  },
  setAgentNameOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.name = action.input.name || null;
  },
  setAgentEthAddressOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.ethAddress = action.input.ethAddress || null;
  },
  setAgentRoleOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.role = action.input.role || null;
  },
  setAgentDescriptionOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.description = action.input.description || null;
  },
  setAgentAvatarOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.avatar = action.input.avatar || null;
  },
  removeAgentOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.removed = true;
  },
  readdAgentOperation(state, action) {
    const agent = state.agents.find((a) => a.id === action.input.id);
    if (!agent) {
      throw new AgentNotFoundError(
        `Agent with ID ${action.input.id} not found`,
      );
    }
    agent.removed = false;
  },
};
