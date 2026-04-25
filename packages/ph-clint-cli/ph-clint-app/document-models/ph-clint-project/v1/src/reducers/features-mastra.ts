import { InvalidAgentIdError, InvalidAgentNameError, MastraNotEnabledError, InvalidModelIdError, DuplicateModelError, ModelNotFoundError, InvalidProfileIdError, DuplicateProfileError, ProfileNotFoundError } from '../../gen/features-mastra/error.js';
import type { PhClintProjectFeaturesMastraOperations } from 'document-models/ph-clint-project/v1';

export const phClintProjectFeaturesMastraOperations: PhClintProjectFeaturesMastraOperations = {
  enableMastraOperation(state, action) {
    if (!/^[a-z][a-z0-9-]*$/.test(action.input.agentId)) {
      throw new InvalidAgentIdError(`Invalid agent ID: ${action.input.agentId}. Must be lowercase kebab-case.`);
    }
    const trimmedName = action.input.agentName.trim();
    if (!trimmedName) {
      throw new InvalidAgentNameError('Agent name must not be empty.');
    }
    state.features.mastra.enabled = true;
    state.features.mastra.agentId = action.input.agentId;
    state.features.mastra.agentName = trimmedName;
  },
  disableMastraOperation(state) {
    state.features.mastra.enabled = false;
    state.features.mastra.agentId = null;
    state.features.mastra.agentName = null;
    state.features.mastra.models = [];
    state.features.mastra.profiles = [];
  },
  setAgentIdOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot set agent ID when Mastra is disabled.');
    }
    if (!/^[a-z][a-z0-9-]*$/.test(action.input.agentId)) {
      throw new InvalidAgentIdError(`Invalid agent ID: ${action.input.agentId}. Must be lowercase kebab-case.`);
    }
    state.features.mastra.agentId = action.input.agentId;
  },
  setAgentNameOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot set agent name when Mastra is disabled.');
    }
    const trimmedName = action.input.agentName.trim();
    if (!trimmedName) {
      throw new InvalidAgentNameError('Agent name must not be empty.');
    }
    state.features.mastra.agentName = trimmedName;
  },
  addModelOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot add model when Mastra is disabled.');
    }
    if (!/^[a-z0-9-]+\/[a-z0-9._-]+$/.test(action.input.id)) {
      throw new InvalidModelIdError(`Invalid model ID: ${action.input.id}. Must be provider/model-name format.`);
    }
    if (state.features.mastra.models.find((m) => m.id === action.input.id)) {
      throw new DuplicateModelError(`Model already exists: ${action.input.id}`);
    }
    const isFirst = state.features.mastra.models.length === 0;
    const makeDefault = isFirst || action.input.isDefault === true;
    if (makeDefault) {
      for (const m of state.features.mastra.models) {
        m.isDefault = false;
      }
    }
    state.features.mastra.models.push({
      id: action.input.id,
      isDefault: makeDefault,
    });
  },
  removeModelOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot remove model when Mastra is disabled.');
    }
    const idx = state.features.mastra.models.findIndex((m) => m.id === action.input.id);
    if (idx === -1) {
      throw new ModelNotFoundError(`Model not found: ${action.input.id}`);
    }
    const wasDefault = state.features.mastra.models[idx].isDefault;
    state.features.mastra.models.splice(idx, 1);
    if (wasDefault && state.features.mastra.models.length > 0) {
      state.features.mastra.models[0].isDefault = true;
    }
  },
  setDefaultModelOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot set default model when Mastra is disabled.');
    }
    const model = state.features.mastra.models.find((m) => m.id === action.input.id);
    if (!model) {
      throw new ModelNotFoundError(`Model not found: ${action.input.id}`);
    }
    for (const m of state.features.mastra.models) {
      m.isDefault = false;
    }
    model.isDefault = true;
  },
  addProfileOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot add profile when Mastra is disabled.');
    }
    if (!/^[a-z][a-z0-9-]*$/.test(action.input.id)) {
      throw new InvalidProfileIdError(`Invalid profile ID: ${action.input.id}. Must be lowercase kebab-case.`);
    }
    if (state.features.mastra.profiles.find((p) => p.id === action.input.id)) {
      throw new DuplicateProfileError(`Profile already exists: ${action.input.id}`);
    }
    const profile = {
      id: action.input.id,
      title: action.input.title,
      content: action.input.content,
    };
    if (action.input.insertBefore) {
      const beforeIdx = state.features.mastra.profiles.findIndex((p) => p.id === action.input.insertBefore);
      if (beforeIdx === -1) {
        throw new ProfileNotFoundError(`insertBefore profile not found: ${action.input.insertBefore}`);
      }
      state.features.mastra.profiles.splice(beforeIdx, 0, profile);
    } else {
      state.features.mastra.profiles.push(profile);
    }
  },
  updateProfileOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot update profile when Mastra is disabled.');
    }
    const profile = state.features.mastra.profiles.find((p) => p.id === action.input.id);
    if (!profile) {
      throw new ProfileNotFoundError(`Profile not found: ${action.input.id}`);
    }
    if (action.input.title) profile.title = action.input.title;
    if (action.input.content) profile.content = action.input.content;
  },
  removeProfileOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot remove profile when Mastra is disabled.');
    }
    const idx = state.features.mastra.profiles.findIndex((p) => p.id === action.input.id);
    if (idx === -1) {
      throw new ProfileNotFoundError(`Profile not found: ${action.input.id}`);
    }
    state.features.mastra.profiles.splice(idx, 1);
  },
  reorderProfilesOperation(state, action) {
    if (!state.features.mastra.enabled) {
      throw new MastraNotEnabledError('Cannot reorder profiles when Mastra is disabled.');
    }
    const moving = [];
    for (const id of action.input.ids) {
      const profile = state.features.mastra.profiles.find((p) => p.id === id);
      if (!profile) {
        throw new ProfileNotFoundError(`Profile not found: ${id}`);
      }
      moving.push(profile);
    }
    // Remove moved profiles
    state.features.mastra.profiles = state.features.mastra.profiles.filter((p) => !action.input.ids.includes(p.id));
    // Insert at target position
    if (action.input.insertBefore) {
      const beforeIdx = state.features.mastra.profiles.findIndex((p) => p.id === action.input.insertBefore);
      if (beforeIdx === -1) {
        throw new ProfileNotFoundError(`insertBefore profile not found: ${action.input.insertBefore}`);
      }
      state.features.mastra.profiles.splice(beforeIdx, 0, ...moving);
    } else {
      state.features.mastra.profiles.push(...moving);
    }
  },
};
