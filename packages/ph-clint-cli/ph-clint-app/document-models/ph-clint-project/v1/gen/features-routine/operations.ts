/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type { DisableRoutineAction, EnableRoutineAction } from "./actions.js";

export interface PhClintProjectFeaturesRoutineOperations {
  enableRoutineOperation: (
    state: PhClintProjectGlobalState,
    action: EnableRoutineAction,
    dispatch?: SignalDispatch,
  ) => void;
  disableRoutineOperation: (
    state: PhClintProjectGlobalState,
    action: DisableRoutineAction,
    dispatch?: SignalDispatch,
  ) => void;
}
