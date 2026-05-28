/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AddProfileInput, RemoveProfileInput, ReorderProfilesInput, UpdateProfileInput } from '../types.js';

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

export type PhClintProjectMastraProfilesAction = AddProfileAction | UpdateProfileAction | RemoveProfileAction | ReorderProfilesAction;
