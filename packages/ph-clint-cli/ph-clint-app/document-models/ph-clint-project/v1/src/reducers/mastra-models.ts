import type { PhClintProjectMastraModelsOperations } from "document-models/ph-clint-project/v1";
import {
  DuplicateModelError,
  InvalidModelIdError,
  MastraNotEnabledError,
  ModelInUseError,
  ModelNotFoundError,
} from "../../gen/mastra-models/error.js";

export const phClintProjectMastraModelsOperations: PhClintProjectMastraModelsOperations =
  {
    addModelOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot add model when Mastra is disabled.",
        );
      }
      if (!/^[a-z0-9-]+\/[a-z0-9._-]+$/.test(action.input.id)) {
        throw new InvalidModelIdError(
          `Invalid model ID: ${action.input.id}. Must be provider/model-name format.`,
        );
      }
      if (state.features.mastra.models.find((m) => m.id === action.input.id)) {
        throw new DuplicateModelError(
          `Model already exists: ${action.input.id}`,
        );
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
        throw new MastraNotEnabledError(
          "Cannot remove model when Mastra is disabled.",
        );
      }
      const idx = state.features.mastra.models.findIndex(
        (m) => m.id === action.input.id,
      );
      if (idx === -1) {
        throw new ModelNotFoundError(`Model not found: ${action.input.id}`);
      }
      const main = state.features.mastra.mainAgent;
      const usedByMain = !!main && main.modelId === action.input.id;
      const usedBySub = state.features.mastra.subAgents.some(
        (s) => s.modelId === action.input.id,
      );
      if (usedByMain || usedBySub) {
        throw new ModelInUseError(
          `Model ${action.input.id} is in use by an agent.`,
        );
      }
      const wasDefault = state.features.mastra.models[idx].isDefault;
      state.features.mastra.models.splice(idx, 1);
      if (wasDefault && state.features.mastra.models.length > 0) {
        state.features.mastra.models[0].isDefault = true;
      }
    },
    setDefaultModelOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot set default model when Mastra is disabled.",
        );
      }
      const model = state.features.mastra.models.find(
        (m) => m.id === action.input.id,
      );
      if (!model) {
        throw new ModelNotFoundError(`Model not found: ${action.input.id}`);
      }
      for (const m of state.features.mastra.models) {
        m.isDefault = false;
      }
      model.isDefault = true;
    },
  };
