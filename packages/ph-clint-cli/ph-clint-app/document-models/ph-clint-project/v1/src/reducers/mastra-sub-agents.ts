import type { PhClintProjectMastraSubAgentsOperations } from "document-models/ph-clint-project/v1";
import {
  AgentNotFoundError,
  DuplicateAgentIdError,
  InvalidAgentIdError,
  InvalidAgentNameError,
  MastraNotEnabledError,
  ModelReferenceNotFoundError,
} from "../../gen/mastra-sub-agents/error.js";

export const phClintProjectMastraSubAgentsOperations: PhClintProjectMastraSubAgentsOperations =
  {
    addSubAgentOperation(state, action) {
      if (
        !state.features.mastra.enabled ||
        state.features.mastra.mainAgent === null
      ) {
        throw new MastraNotEnabledError(
          "Cannot add sub-agent when Mastra is disabled.",
        );
      }
      if (!/^[a-z][a-z0-9-]*$/.test(action.input.id)) {
        throw new InvalidAgentIdError(
          `Invalid sub-agent ID: ${action.input.id}. Must be lowercase kebab-case.`,
        );
      }
      const trimmedName = action.input.name.trim();
      if (!trimmedName) {
        throw new InvalidAgentNameError("Sub-agent name must not be empty.");
      }
      if (state.features.mastra.mainAgent.id === action.input.id) {
        throw new DuplicateAgentIdError(
          `Agent ID already taken by main agent: ${action.input.id}`,
        );
      }
      if (
        state.features.mastra.subAgents.find((s) => s.id === action.input.id)
      ) {
        throw new DuplicateAgentIdError(
          `Sub-agent already exists: ${action.input.id}`,
        );
      }
      if (
        !state.features.mastra.models.find((m) => m.id === action.input.modelId)
      ) {
        throw new ModelReferenceNotFoundError(
          `Model not in library: ${action.input.modelId}`,
        );
      }
      state.features.mastra.subAgents.push({
        id: action.input.id,
        name: trimmedName,
        description: action.input.description,
        modelId: action.input.modelId,
        profileIds: [],
        skills: [],
        toolPatterns: [],
      });
    },
    removeSubAgentOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot remove sub-agent when Mastra is disabled.",
        );
      }
      const idx = state.features.mastra.subAgents.findIndex(
        (s) => s.id === action.input.id,
      );
      if (idx === -1) {
        throw new AgentNotFoundError(`Sub-agent not found: ${action.input.id}`);
      }
      state.features.mastra.subAgents.splice(idx, 1);
    },
    setSubAgentNameOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot set sub-agent name when Mastra is disabled.",
        );
      }
      const sub = state.features.mastra.subAgents.find(
        (s) => s.id === action.input.id,
      );
      if (!sub) {
        throw new AgentNotFoundError(`Sub-agent not found: ${action.input.id}`);
      }
      const trimmed = action.input.name.trim();
      if (!trimmed) {
        throw new InvalidAgentNameError("Sub-agent name must not be empty.");
      }
      sub.name = trimmed;
    },
    setSubAgentDescriptionOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot set sub-agent description when Mastra is disabled.",
        );
      }
      const sub = state.features.mastra.subAgents.find(
        (s) => s.id === action.input.id,
      );
      if (!sub) {
        throw new AgentNotFoundError(`Sub-agent not found: ${action.input.id}`);
      }
      sub.description = action.input.description;
    },
  };
