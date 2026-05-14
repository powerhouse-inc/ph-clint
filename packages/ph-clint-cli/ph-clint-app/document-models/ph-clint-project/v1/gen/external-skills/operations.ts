/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type {
  AddExternalSkillAction,
  RemoveExternalSkillAction,
  SetExternalSkillGithubUrlAction,
  SetExternalSkillNameAction,
} from "./actions.js";

export interface PhClintProjectExternalSkillsOperations {
  addExternalSkillOperation: (
    state: PhClintProjectGlobalState,
    action: AddExternalSkillAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeExternalSkillOperation: (
    state: PhClintProjectGlobalState,
    action: RemoveExternalSkillAction,
    dispatch?: SignalDispatch,
  ) => void;
  setExternalSkillNameOperation: (
    state: PhClintProjectGlobalState,
    action: SetExternalSkillNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setExternalSkillGithubUrlOperation: (
    state: PhClintProjectGlobalState,
    action: SetExternalSkillGithubUrlAction,
    dispatch?: SignalDispatch,
  ) => void;
}
