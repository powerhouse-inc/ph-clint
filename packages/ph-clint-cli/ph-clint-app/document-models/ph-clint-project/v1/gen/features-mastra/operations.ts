/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type {
  AddModelAction,
  AddProfileAction,
  ClearAgentImageAction,
  DisableMastraAction,
  EnableMastraAction,
  RemoveModelAction,
  RemoveProfileAction,
  ReorderProfilesAction,
  SetAgentDescriptionAction,
  SetAgentIdAction,
  SetAgentImageAction,
  SetAgentNameAction,
  SetDefaultModelAction,
  SetEnableChatAction,
  UpdateProfileAction,
} from './actions.js';

export interface PhClintProjectFeaturesMastraOperations {
  enableMastraOperation: (state: PhClintProjectGlobalState, action: EnableMastraAction, dispatch?: SignalDispatch) => void;
  disableMastraOperation: (state: PhClintProjectGlobalState, action: DisableMastraAction, dispatch?: SignalDispatch) => void;
  setAgentIdOperation: (state: PhClintProjectGlobalState, action: SetAgentIdAction, dispatch?: SignalDispatch) => void;
  setAgentNameOperation: (state: PhClintProjectGlobalState, action: SetAgentNameAction, dispatch?: SignalDispatch) => void;
  addModelOperation: (state: PhClintProjectGlobalState, action: AddModelAction, dispatch?: SignalDispatch) => void;
  removeModelOperation: (state: PhClintProjectGlobalState, action: RemoveModelAction, dispatch?: SignalDispatch) => void;
  setDefaultModelOperation: (state: PhClintProjectGlobalState, action: SetDefaultModelAction, dispatch?: SignalDispatch) => void;
  addProfileOperation: (state: PhClintProjectGlobalState, action: AddProfileAction, dispatch?: SignalDispatch) => void;
  updateProfileOperation: (state: PhClintProjectGlobalState, action: UpdateProfileAction, dispatch?: SignalDispatch) => void;
  removeProfileOperation: (state: PhClintProjectGlobalState, action: RemoveProfileAction, dispatch?: SignalDispatch) => void;
  reorderProfilesOperation: (state: PhClintProjectGlobalState, action: ReorderProfilesAction, dispatch?: SignalDispatch) => void;
  setAgentDescriptionOperation: (state: PhClintProjectGlobalState, action: SetAgentDescriptionAction, dispatch?: SignalDispatch) => void;
  setAgentImageOperation: (state: PhClintProjectGlobalState, action: SetAgentImageAction, dispatch?: SignalDispatch) => void;
  clearAgentImageOperation: (state: PhClintProjectGlobalState, action: ClearAgentImageAction, dispatch?: SignalDispatch) => void;
  setEnableChatOperation: (state: PhClintProjectGlobalState, action: SetEnableChatAction, dispatch?: SignalDispatch) => void;
}
