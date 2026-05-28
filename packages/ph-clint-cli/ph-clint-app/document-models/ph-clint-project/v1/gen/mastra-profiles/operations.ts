/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { AddProfileAction, RemoveProfileAction, ReorderProfilesAction, UpdateProfileAction } from './actions.js';

export interface PhClintProjectMastraProfilesOperations {
  addProfileOperation: (state: PhClintProjectGlobalState, action: AddProfileAction, dispatch?: SignalDispatch) => void;
  updateProfileOperation: (state: PhClintProjectGlobalState, action: UpdateProfileAction, dispatch?: SignalDispatch) => void;
  removeProfileOperation: (state: PhClintProjectGlobalState, action: RemoveProfileAction, dispatch?: SignalDispatch) => void;
  reorderProfilesOperation: (state: PhClintProjectGlobalState, action: ReorderProfilesAction, dispatch?: SignalDispatch) => void;
}
