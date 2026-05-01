import { type SignalDispatch } from "document-model";
import type {
  EnableMastraAction,
  DisableMastraAction,
  SetAgentIdAction,
  SetAgentNameAction,
  AddModelAction,
  RemoveModelAction,
  SetDefaultModelAction,
  AddProfileAction,
  UpdateProfileAction,
  RemoveProfileAction,
  ReorderProfilesAction,
  SetAgentDescriptionAction,
  SetAgentImageAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectFeaturesMastraOperations {
  enableMastraOperation: (
    state: PhClintProjectState,
    action: EnableMastraAction,
    dispatch?: SignalDispatch,
  ) => void;
  disableMastraOperation: (
    state: PhClintProjectState,
    action: DisableMastraAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentIdOperation: (
    state: PhClintProjectState,
    action: SetAgentIdAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentNameOperation: (
    state: PhClintProjectState,
    action: SetAgentNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  addModelOperation: (
    state: PhClintProjectState,
    action: AddModelAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeModelOperation: (
    state: PhClintProjectState,
    action: RemoveModelAction,
    dispatch?: SignalDispatch,
  ) => void;
  setDefaultModelOperation: (
    state: PhClintProjectState,
    action: SetDefaultModelAction,
    dispatch?: SignalDispatch,
  ) => void;
  addProfileOperation: (
    state: PhClintProjectState,
    action: AddProfileAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateProfileOperation: (
    state: PhClintProjectState,
    action: UpdateProfileAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeProfileOperation: (
    state: PhClintProjectState,
    action: RemoveProfileAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderProfilesOperation: (
    state: PhClintProjectState,
    action: ReorderProfilesAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentDescriptionOperation: (
    state: PhClintProjectState,
    action: SetAgentDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentImageOperation: (
    state: PhClintProjectState,
    action: SetAgentImageAction,
    dispatch?: SignalDispatch,
  ) => void;
}
