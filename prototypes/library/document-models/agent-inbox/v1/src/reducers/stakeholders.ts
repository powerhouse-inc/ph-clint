import {
  DuplicateStakeholderError,
  StakeholderNotFoundError,
} from "../../gen/stakeholders/error.js";
import type { AgentInboxStakeholdersOperations } from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";

export const agentInboxStakeholdersOperations: AgentInboxStakeholdersOperations =
  {
    addStakeholderOperation(state, action) {
      // Check if stakeholder with same ID already exists
      const existing = state.stakeholders.find((s) => s.id === action.input.id);
      if (existing) {
        throw new DuplicateStakeholderError(
          `Stakeholder with ID ${action.input.id} already exists`,
        );
      }

      const newStakeholder = {
        id: action.input.id,
        name: action.input.name,
        ethAddress: action.input.ethAddress || null,
        avatar: action.input.avatar || null,
        removed: false,
      };

      state.stakeholders.push(newStakeholder);
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

      // Soft delete - set removed flag to true
      stakeholder.removed = true;

      // Archive all threads associated with this stakeholder
      const stakeholderThreads = state.threads.filter(
        (t) => t.stakeholder === action.input.id,
      );

      stakeholderThreads.forEach((thread) => {
        thread.status = "Archived";
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

      stakeholder.name = action.input.name;
    },
    setStakeholderAddressOperation(state, action) {
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
    moveStakeholderOperation(state, action) {
      const stakeholderIndex = state.stakeholders.findIndex(
        (s) => s.id === action.input.id,
      );
      if (stakeholderIndex === -1) {
        throw new StakeholderNotFoundError(
          `Stakeholder with ID ${action.input.id} not found`,
        );
      }

      // Remove stakeholder from current position
      const [stakeholder] = state.stakeholders.splice(stakeholderIndex, 1);

      if (!action.input.insertBefore) {
        // Move to end if no insertBefore specified
        state.stakeholders.push(stakeholder);
      } else {
        // Find position of stakeholder to insert before
        const insertIndex = state.stakeholders.findIndex(
          (s) => s.id === action.input.insertBefore,
        );
        if (insertIndex === -1) {
          // If insertBefore stakeholder not found, add to end
          state.stakeholders.push(stakeholder);
        } else {
          // Insert at the specified position
          state.stakeholders.splice(insertIndex, 0, stakeholder);
        }
      }
    },
  };
