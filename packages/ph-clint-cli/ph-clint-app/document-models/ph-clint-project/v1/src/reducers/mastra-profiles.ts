import type { PhClintProjectMastraProfilesOperations } from "document-models/ph-clint-project/v1";
import {
  DuplicateProfileError,
  InvalidProfileIdError,
  MastraNotEnabledError,
  ProfileInUseError,
  ProfileNotFoundError,
} from "../../gen/mastra-profiles/error.js";

export const phClintProjectMastraProfilesOperations: PhClintProjectMastraProfilesOperations =
  {
    addProfileOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot add profile when Mastra is disabled.",
        );
      }
      if (!/^[a-z][a-z0-9-]*$/.test(action.input.id)) {
        throw new InvalidProfileIdError(
          `Invalid profile ID: ${action.input.id}. Must be lowercase kebab-case.`,
        );
      }
      if (
        state.features.mastra.profiles.find((p) => p.id === action.input.id)
      ) {
        throw new DuplicateProfileError(
          `Profile already exists: ${action.input.id}`,
        );
      }
      const profile = {
        id: action.input.id,
        title: action.input.title,
        content: action.input.content,
      };
      if (action.input.insertBefore) {
        const beforeIdx = state.features.mastra.profiles.findIndex(
          (p) => p.id === action.input.insertBefore,
        );
        if (beforeIdx === -1) {
          throw new ProfileNotFoundError(
            `insertBefore profile not found: ${action.input.insertBefore}`,
          );
        }
        state.features.mastra.profiles.splice(beforeIdx, 0, profile);
      } else {
        state.features.mastra.profiles.push(profile);
      }
    },
    updateProfileOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot update profile when Mastra is disabled.",
        );
      }
      const profile = state.features.mastra.profiles.find(
        (p) => p.id === action.input.id,
      );
      if (!profile) {
        throw new ProfileNotFoundError(`Profile not found: ${action.input.id}`);
      }
      if (action.input.title) profile.title = action.input.title;
      if (action.input.content) profile.content = action.input.content;
    },
    removeProfileOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot remove profile when Mastra is disabled.",
        );
      }
      const idx = state.features.mastra.profiles.findIndex(
        (p) => p.id === action.input.id,
      );
      if (idx === -1) {
        throw new ProfileNotFoundError(`Profile not found: ${action.input.id}`);
      }
      const usedByMain =
        state.features.mastra.mainAgent !== null &&
        state.features.mastra.mainAgent.profileIds.includes(action.input.id);
      const usedBySub = state.features.mastra.subAgents.find((s) =>
        s.profileIds.includes(action.input.id),
      );
      if (usedByMain || usedBySub) {
        throw new ProfileInUseError(
          `Profile ${action.input.id} is in use by an agent.`,
        );
      }
      state.features.mastra.profiles.splice(idx, 1);
    },
    reorderProfilesOperation(state, action) {
      if (!state.features.mastra.enabled) {
        throw new MastraNotEnabledError(
          "Cannot reorder profiles when Mastra is disabled.",
        );
      }
      const moving = [];
      for (const id of action.input.ids) {
        const profile = state.features.mastra.profiles.find((p) => p.id === id);
        if (!profile) {
          throw new ProfileNotFoundError(`Profile not found: ${id}`);
        }
        moving.push(profile);
      }
      state.features.mastra.profiles = state.features.mastra.profiles.filter(
        (p) => !action.input.ids.includes(p.id),
      );
      if (action.input.insertBefore) {
        const beforeIdx = state.features.mastra.profiles.findIndex(
          (p) => p.id === action.input.insertBefore,
        );
        if (beforeIdx === -1) {
          throw new ProfileNotFoundError(
            `insertBefore profile not found: ${action.input.insertBefore}`,
          );
        }
        state.features.mastra.profiles.splice(beforeIdx, 0, ...moving);
      } else {
        state.features.mastra.profiles.push(...moving);
      }
    },
  };
