import { type SignalDispatch } from "document-model";
import type {
  SetPackageNameAction,
  ClearBinAction,
  SetBinAction,
  SetDescriptionAction,
  SetVersionAction,
  ClearScopeAction,
  SetScopeAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectIdentityOperations {
  setPackageNameOperation: (
    state: PhClintProjectState,
    action: SetPackageNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  clearBinOperation: (
    state: PhClintProjectState,
    action: ClearBinAction,
    dispatch?: SignalDispatch,
  ) => void;
  setBinOperation: (
    state: PhClintProjectState,
    action: SetBinAction,
    dispatch?: SignalDispatch,
  ) => void;
  setDescriptionOperation: (
    state: PhClintProjectState,
    action: SetDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setVersionOperation: (
    state: PhClintProjectState,
    action: SetVersionAction,
    dispatch?: SignalDispatch,
  ) => void;
  clearScopeOperation: (
    state: PhClintProjectState,
    action: ClearScopeAction,
    dispatch?: SignalDispatch,
  ) => void;
  setScopeOperation: (
    state: PhClintProjectState,
    action: SetScopeAction,
    dispatch?: SignalDispatch,
  ) => void;
}
