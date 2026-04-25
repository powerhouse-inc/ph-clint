import type { Action } from 'document-model';
import type { EnableMastraInput, DisableMastraInput, SetAgentIdInput, SetAgentNameInput, AddModelInput, RemoveModelInput, SetDefaultModelInput, AddProfileInput, UpdateProfileInput, RemoveProfileInput, ReorderProfilesInput } from '../types.js';

export type EnableMastraAction = Action & {
  type: 'ENABLE_MASTRA';
  input: EnableMastraInput;
};
export type DisableMastraAction = Action & {
  type: 'DISABLE_MASTRA';
  input: DisableMastraInput;
};
export type SetAgentIdAction = Action & {
  type: 'SET_AGENT_ID';
  input: SetAgentIdInput;
};
export type SetAgentNameAction = Action & {
  type: 'SET_AGENT_NAME';
  input: SetAgentNameInput;
};
export type AddModelAction = Action & {
  type: 'ADD_MODEL';
  input: AddModelInput;
};
export type RemoveModelAction = Action & {
  type: 'REMOVE_MODEL';
  input: RemoveModelInput;
};
export type SetDefaultModelAction = Action & {
  type: 'SET_DEFAULT_MODEL';
  input: SetDefaultModelInput;
};
export type AddProfileAction = Action & {
  type: 'ADD_PROFILE';
  input: AddProfileInput;
};
export type UpdateProfileAction = Action & {
  type: 'UPDATE_PROFILE';
  input: UpdateProfileInput;
};
export type RemoveProfileAction = Action & {
  type: 'REMOVE_PROFILE';
  input: RemoveProfileInput;
};
export type ReorderProfilesAction = Action & {
  type: 'REORDER_PROFILES';
  input: ReorderProfilesInput;
};

export type PhClintProjectFeaturesMastraAction =
  | EnableMastraAction
  | DisableMastraAction
  | SetAgentIdAction
  | SetAgentNameAction
  | AddModelAction
  | RemoveModelAction
  | SetDefaultModelAction
  | AddProfileAction
  | UpdateProfileAction
  | RemoveProfileAction
  | ReorderProfilesAction;
