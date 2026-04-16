import { type SignalDispatch } from "document-model";
import type { EnableRoutineAction, DisableRoutineAction } from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectFeaturesRoutineOperations {
  enableRoutineOperation: (
    state: PhClintProjectState,
    action: EnableRoutineAction,
    dispatch?: SignalDispatch,
  ) => void;
  disableRoutineOperation: (
    state: PhClintProjectState,
    action: DisableRoutineAction,
    dispatch?: SignalDispatch,
  ) => void;
}
