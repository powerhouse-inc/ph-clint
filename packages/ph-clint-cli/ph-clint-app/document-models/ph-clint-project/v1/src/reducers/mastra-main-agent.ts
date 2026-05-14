import type { PhClintProjectMastraMainAgentOperations } from "document-models/ph-clint-project/v1";
import {
  InvalidAgentImageError,
  InvalidAgentNameError,
  MastraNotEnabledError,
} from "../../gen/mastra-main-agent/error.js";

export const phClintProjectMastraMainAgentOperations: PhClintProjectMastraMainAgentOperations =
  {
    setMainAgentNameOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot set main agent name when Mastra is disabled.",
        );
      }
      const trimmed = action.input.name.trim();
      if (!trimmed) {
        throw new InvalidAgentNameError("Agent name must not be empty.");
      }
      state.features.mastra.mainAgent.name = trimmed;
    },
    setMainAgentDescriptionOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot set main agent description when Mastra is disabled.",
        );
      }
      state.features.mastra.mainAgent.description = action.input.description;
    },
    clearMainAgentDescriptionOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot clear main agent description when Mastra is disabled.",
        );
      }
      state.features.mastra.mainAgent.description = null;
    },
    setMainAgentImageOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot set main agent image when Mastra is disabled.",
        );
      }
      if (!/^data:[a-z]+\/[a-z0-9.+-]+;base64,/.test(action.input.image)) {
        throw new InvalidAgentImageError(
          "Agent image must be a data URL (data:image/...;base64,...)",
        );
      }
      state.features.mastra.mainAgent.image = action.input.image;
    },
    clearMainAgentImageOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot clear main agent image when Mastra is disabled.",
        );
      }
      state.features.mastra.mainAgent.image = null;
    },
  };
