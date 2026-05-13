/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AddExternalSkillInput, RemoveExternalSkillInput, SetExternalSkillGithubUrlInput, SetExternalSkillNameInput } from '../types.js';

export type AddExternalSkillAction = Action & {
  type: 'ADD_EXTERNAL_SKILL';
  input: AddExternalSkillInput;
};
export type RemoveExternalSkillAction = Action & {
  type: 'REMOVE_EXTERNAL_SKILL';
  input: RemoveExternalSkillInput;
};
export type SetExternalSkillNameAction = Action & {
  type: 'SET_EXTERNAL_SKILL_NAME';
  input: SetExternalSkillNameInput;
};
export type SetExternalSkillGithubUrlAction = Action & {
  type: 'SET_EXTERNAL_SKILL_GITHUB_URL';
  input: SetExternalSkillGithubUrlInput;
};

export type PhClintProjectExternalSkillsAction = AddExternalSkillAction | RemoveExternalSkillAction | SetExternalSkillNameAction | SetExternalSkillGithubUrlAction;
