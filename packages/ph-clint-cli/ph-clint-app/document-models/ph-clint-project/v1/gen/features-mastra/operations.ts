import { type SignalDispatch } from "document-model";
import type { EnableMastraAction, DisableMastraAction } from "./actions.js";
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
}
