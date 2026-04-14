import type { AgentChatStakeholdersOperations } from "document-models/agent-chat/v1";
import {
  DuplicateStakeholderError,
  StakeholderNotFoundError,
} from "../../gen/stakeholders/error.js";

export const agentChatStakeholdersOperations: AgentChatStakeholdersOperations =
  {
    addStakeholderOperation(state, action) {
      const exists = state.stakeholders.some((s) => s.id === action.input.id);
      if (exists) {
        throw new DuplicateStakeholderError(
          `Stakeholder with ID ${action.input.id} already exists`,
        );
      }
      state.stakeholders.push({
        id: action.input.id,
        name: action.input.name,
        ethAddress: action.input.ethAddress || null,
        avatar: action.input.avatar || null,
        removed: false,
      });
    },
    setStakeholderNameOperation(state, action) {
      const stakeholder = state.stakeholders.find(
        (s) => s.id === action.input.id,
      );
      if (!stakeholder) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }
      if (action.input.name) {
        stakeholder.name = action.input.name;
      }
    },
    setStakeholderEthAddressOperation(state, action) {
      const stakeholder = state.stakeholders.find(
        (s) => s.id === action.input.id,
      );
      if (!stakeholder) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }
      stakeholder.ethAddress = action.input.ethAddress || null;
    },
    setStakeholderAvatarOperation(state, action) {
      const stakeholder = state.stakeholders.find(
        (s) => s.id === action.input.id,
      );
      if (!stakeholder) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }
      stakeholder.avatar = action.input.avatar || null;
    },
    removeStakeholderOperation(state, action) {
      const stakeholder = state.stakeholders.find(
        (s) => s.id === action.input.id,
      );
      if (!stakeholder) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }
      stakeholder.removed = true;
    },
    readdStakeholderOperation(state, action) {
      const stakeholder = state.stakeholders.find(
        (s) => s.id === action.input.id,
      );
      if (!stakeholder) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }
      stakeholder.removed = false;
    },
  };
