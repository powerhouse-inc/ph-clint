import type { PhClintProjectMastraAgentBindingsOperations } from "document-models/ph-clint-project/v1";
import {
  AgentNotFoundError,
  InvalidSkillNameError,
  InvalidToolPatternError,
  MastraNotEnabledError,
  ModelReferenceNotFoundError,
  ProfileReferenceNotFoundError,
  SkillNotFoundError,
  ToolPatternNotFoundError,
} from "../../gen/mastra-agent-bindings/error.js";

export const phClintProjectMastraAgentBindingsOperations: PhClintProjectMastraAgentBindingsOperations =
  {
    setAgentModelOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot set agent model when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      if (
        !state.features.mastra.models.find((m) => m.id === action.input.modelId)
      ) {
        throw new ModelReferenceNotFoundError(
          `Model not in library: ${action.input.modelId}`,
        );
      }
      agent.modelId = action.input.modelId;
    },
    addAgentProfileRefOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot add profile ref when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      if (
        !state.features.mastra.profiles.find(
          (p) => p.id === action.input.profileId,
        )
      ) {
        throw new ProfileReferenceNotFoundError(
          `Profile not in library: ${action.input.profileId}`,
        );
      }
      if (agent.profileIds.includes(action.input.profileId)) {
        return;
      }
      if (action.input.insertBefore) {
        const beforeIdx = agent.profileIds.indexOf(action.input.insertBefore);
        if (beforeIdx === -1) {
          throw new ProfileReferenceNotFoundError(
            `insertBefore profile not in agent's profileIds: ${action.input.insertBefore}`,
          );
        }
        agent.profileIds.splice(beforeIdx, 0, action.input.profileId);
      } else {
        agent.profileIds.push(action.input.profileId);
      }
    },
    removeAgentProfileRefOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot remove profile ref when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      const idx = agent.profileIds.indexOf(action.input.profileId);
      if (idx === -1) {
        throw new ProfileReferenceNotFoundError(
          `Profile not in agent's profileIds: ${action.input.profileId}`,
        );
      }
      agent.profileIds.splice(idx, 1);
    },
    reorderAgentProfileRefsOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot reorder profile refs when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      for (const id of action.input.ids) {
        if (!agent.profileIds.includes(id)) {
          throw new ProfileReferenceNotFoundError(
            `Profile not in agent's profileIds: ${id}`,
          );
        }
      }
      const remaining = agent.profileIds.filter(
        (id) => !action.input.ids.includes(id),
      );
      if (action.input.insertBefore) {
        const beforeIdx = remaining.indexOf(action.input.insertBefore);
        if (beforeIdx === -1) {
          throw new ProfileReferenceNotFoundError(
            `insertBefore profile not in agent's profileIds: ${action.input.insertBefore}`,
          );
        }
        remaining.splice(beforeIdx, 0, ...action.input.ids);
      } else {
        remaining.push(...action.input.ids);
      }
      agent.profileIds = remaining;
    },
    addAgentSkillOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot add skill when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      const trimmed = action.input.name.trim();
      if (!/^[a-z][a-z0-9-]*$/.test(trimmed)) {
        throw new InvalidSkillNameError(
          `Invalid skill name: ${action.input.name}. Must be lowercase kebab-case.`,
        );
      }
      if (!agent.skills.includes(trimmed)) {
        agent.skills.push(trimmed);
      }
    },
    removeAgentSkillOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot remove skill when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      const idx = agent.skills.indexOf(action.input.name);
      if (idx === -1) {
        throw new SkillNotFoundError(
          `Skill not on agent: ${action.input.name}`,
        );
      }
      agent.skills.splice(idx, 1);
    },
    addAgentToolPatternOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot add tool pattern when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      const trimmed = action.input.pattern.trim();
      if (!trimmed) {
        throw new InvalidToolPatternError(
          "Tool pattern must not be empty after trimming.",
        );
      }
      if (!agent.toolPatterns.includes(trimmed)) {
        agent.toolPatterns.push(trimmed);
      }
    },
    removeAgentToolPatternOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot remove tool pattern when Mastra is disabled.",
        );
      }
      let agent = null;
      if (
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.id === action.input.agentId
      ) {
        agent = state.features.mastra.mainAgent;
      } else {
        agent =
          state.features.mastra.subAgents.find(
            (s) => s.id === action.input.agentId,
          ) || null;
      }
      if (agent === null) {
        throw new AgentNotFoundError(
          `Agent not found: ${action.input.agentId}`,
        );
      }
      const idx = agent.toolPatterns.indexOf(action.input.pattern);
      if (idx === -1) {
        throw new ToolPatternNotFoundError(
          `Tool pattern not on agent: ${action.input.pattern}`,
        );
      }
      agent.toolPatterns.splice(idx, 1);
    },
  };
