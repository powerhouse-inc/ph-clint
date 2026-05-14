import type { PhClintProjectFeaturesMastraOperations } from "document-models/ph-clint-project/v1";
import {
  InvalidAgentIdError,
  InvalidAgentNameError,
  MastraNotEnabledError,
  PowerhouseNotEnabledError,
} from "../../gen/features-mastra/error.js";

export const phClintProjectFeaturesMastraOperations: PhClintProjectFeaturesMastraOperations =
  {
    enableMastraOperation(state, action) {
      if (!/^[a-z][a-z0-9-]*$/.test(action.input.agentId)) {
        throw new InvalidAgentIdError(
          `Invalid agent ID: ${action.input.agentId}. Must be lowercase kebab-case.`,
        );
      }
      const trimmedName = action.input.agentName.trim();
      if (!trimmedName) {
        throw new InvalidAgentNameError("Agent name must not be empty.");
      }
      state.features.mastra.enabled = true;
      if (state.features.mastra.models.length === 0) {
        state.features.mastra.models.push({ id: "clint/demo-agent" });
      }
      if (state.features.mastra.profiles.length === 0) {
        state.features.mastra.profiles.push({
          id: "base",
          title: "Base Profile",
          content: "You are a helpful assistant.",
        });
      }
      const existing = state.features.mastra.mainAgent;
      if (!existing) {
        state.features.mastra.mainAgent = {
          id: action.input.agentId,
          name: trimmedName,
          description: null,
          image: null,
          modelId: "clint/demo-agent",
          profileIds: ["base"],
          skills: [],
          toolPatterns: [],
        };
      } else {
        existing.id = action.input.agentId;
        existing.name = trimmedName;
      }
    },
    disableMastraOperation(state) {
      state.features.mastra.enabled = false;
      state.features.mastra.mainAgent = null;
      state.features.mastra.subAgents = [];
      state.features.mastra.models = [];
      state.features.mastra.profiles = [];
      state.features.mastra.common.enableChat = false;
      const ccIdx = state.packages.findIndex(
        (p) => p.packageName === "@powerhousedao/clint-common" && p.managed,
      );
      if (ccIdx !== -1) {
        state.packages.splice(ccIdx, 1);
      }
    },
    setEnableChatOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot toggle chat when Mastra is disabled.",
        );
      }
      if (state.features.powerhouse === "Disabled") {
        throw new PowerhouseNotEnabledError(
          "Cannot toggle chat when Powerhouse is disabled.",
        );
      }
      state.features.mastra.common.enableChat = action.input.enabled;
      const CLINT_COMMON_PKG = "@powerhousedao/clint-common";
      const CHAT_DOC_TYPE = "powerhouse/chat-session";
      if (action.input.enabled) {
        const existing = state.packages.find(
          (p) => p.packageName === CLINT_COMMON_PKG,
        );
        if (!existing) {
          state.packages.push({
            id: "pkg-clint-common",
            packageName: CLINT_COMMON_PKG,
            documentTypes: [CHAT_DOC_TYPE],
            version: null,
            managed: true,
          });
        } else if (!existing.documentTypes.includes(CHAT_DOC_TYPE)) {
          existing.documentTypes.push(CHAT_DOC_TYPE);
        }
      } else {
        const idx = state.packages.findIndex(
          (p) => p.packageName === CLINT_COMMON_PKG && p.managed,
        );
        if (idx !== -1) {
          const pkg = state.packages[idx];
          if (
            pkg.documentTypes.length === 1 &&
            pkg.documentTypes[0] === CHAT_DOC_TYPE
          ) {
            state.packages.splice(idx, 1);
          } else {
            const dtIdx = pkg.documentTypes.indexOf(CHAT_DOC_TYPE);
            if (dtIdx !== -1) pkg.documentTypes.splice(dtIdx, 1);
          }
        }
      }
    },
  };
