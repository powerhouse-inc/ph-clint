import type { PhClintProjectExternalSkillsOperations } from "document-models/ph-clint-project/v1";
import {
  DuplicateSkillError,
  InvalidSkillNameError,
  SkillNotFoundError,
} from "../../gen/external-skills/error.js";

export const phClintProjectExternalSkillsOperations: PhClintProjectExternalSkillsOperations =
  {
    addExternalSkillOperation(state, action) {
      if (!/^[a-z][a-z0-9-]*$/.test(action.input.name)) {
        throw new InvalidSkillNameError(
          `Invalid skill name: ${action.input.name}. Must be lowercase kebab-case.`,
        );
      }
      const exists = state.externalSkills.find(
        (s) => s.id === action.input.id || s.name === action.input.name,
      );
      if (exists) {
        throw new DuplicateSkillError(
          `Skill already exists: ${action.input.name}`,
        );
      }
      state.externalSkills.push({
        id: action.input.id,
        name: action.input.name,
        githubUrl: action.input.githubUrl,
      });
    },
    removeExternalSkillOperation(state, action) {
      const idx = state.externalSkills.findIndex(
        (s) => s.id === action.input.id,
      );
      if (idx === -1) {
        throw new SkillNotFoundError(`Skill not found: ${action.input.id}`);
      }
      state.externalSkills.splice(idx, 1);
    },
    setExternalSkillNameOperation(state, action) {
      const skill = state.externalSkills.find((s) => s.id === action.input.id);
      if (!skill) {
        throw new SkillNotFoundError(`Skill not found: ${action.input.id}`);
      }
      if (!/^[a-z][a-z0-9-]*$/.test(action.input.name)) {
        throw new InvalidSkillNameError(
          `Invalid skill name: ${action.input.name}. Must be lowercase kebab-case.`,
        );
      }
      const duplicate = state.externalSkills.find(
        (s) => s.name === action.input.name && s.id !== action.input.id,
      );
      if (duplicate) {
        throw new DuplicateSkillError(
          `Skill name already in use: ${action.input.name}`,
        );
      }
      skill.name = action.input.name;
    },
    setExternalSkillGithubUrlOperation(state, action) {
      const skill = state.externalSkills.find((s) => s.id === action.input.id);
      if (!skill) {
        throw new SkillNotFoundError(`Skill not found: ${action.input.id}`);
      }
      skill.githubUrl = action.input.githubUrl;
    },
  };
