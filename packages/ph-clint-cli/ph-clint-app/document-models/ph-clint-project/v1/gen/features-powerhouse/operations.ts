import { type SignalDispatch } from "document-model";
import type { SetPowerhouseLevelAction } from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectFeaturesPowerhouseOperations {
  setPowerhouseLevelOperation: (
    state: PhClintProjectState,
    action: SetPowerhouseLevelAction,
    dispatch?: SignalDispatch,
  ) => void;
}
