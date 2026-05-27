import type { PhClintProjectMastraMainAgentOperations } from "document-models/ph-clint-project/v1";
import {
  InvalidAgentImageError,
  InvalidAgentNameError,
  MastraNotEnabledError,
} from "../../gen/mastra-main-agent/error.js";

export const phClintProjectMastraMainAgentOperations: PhClintProjectMastraMainAgentOperations =
  {
    setMainAgentNameOperation(state, action) {
      const main = state.features.mastra.mainAgent;
      if (!state.features.mastra.enabled || !main) {
        throw new MastraNotEnabledError(
          "Cannot set main agent name when Mastra is disabled.",
        );
      }
      const trimmed = action.input.name.trim();
      if (!trimmed) {
        throw new InvalidAgentNameError("Agent name must not be empty.");
      }
      main.name = trimmed;
    },
    setMainAgentDescriptionOperation(state, action) {
      const main = state.features.mastra.mainAgent;
      if (!state.features.mastra.enabled || !main) {
        throw new MastraNotEnabledError(
          "Cannot set main agent description when Mastra is disabled.",
        );
      }
      main.description = action.input.description;
    },
    clearMainAgentDescriptionOperation(state) {
      const main = state.features.mastra.mainAgent;
      if (!state.features.mastra.enabled || !main) {
        throw new MastraNotEnabledError(
          "Cannot clear main agent description when Mastra is disabled.",
        );
      }
      main.description = null;
    },
    setMainAgentImageOperation(state, action) {
      const main = state.features.mastra.mainAgent;
      if (!state.features.mastra.enabled || !main) {
        throw new MastraNotEnabledError(
          "Cannot set main agent image when Mastra is disabled.",
        );
      }
      if (!action.input.attachment.startsWith("attachment://")) {
        throw new InvalidAgentImageError(
          "Agent image must be an attachment ref (attachment://...)",
        );
      }
      main.attachment = action.input.attachment;
    },
    clearMainAgentImageOperation(state) {
      const main = state.features.mastra.mainAgent;
      if (!state.features.mastra.enabled || !main) {
        throw new MastraNotEnabledError(
          "Cannot clear main agent image when Mastra is disabled.",
        );
      }
      main.attachment = null;
    },
  };
