/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type { AddModelAction, RemoveModelAction } from "./actions.js";

export interface PhClintProjectMastraModelsOperations {
  addModelOperation: (
    state: PhClintProjectGlobalState,
    action: AddModelAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeModelOperation: (
    state: PhClintProjectGlobalState,
    action: RemoveModelAction,
    dispatch?: SignalDispatch,
  ) => void;
}
