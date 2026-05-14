/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type {
  DisableMastraAction,
  EnableMastraAction,
  SetEnableChatAction,
} from "./actions.js";

export interface PhClintProjectFeaturesMastraOperations {
  enableMastraOperation: (
    state: PhClintProjectGlobalState,
    action: EnableMastraAction,
    dispatch?: SignalDispatch,
  ) => void;
  disableMastraOperation: (
    state: PhClintProjectGlobalState,
    action: DisableMastraAction,
    dispatch?: SignalDispatch,
  ) => void;
  setEnableChatOperation: (
    state: PhClintProjectGlobalState,
    action: SetEnableChatAction,
    dispatch?: SignalDispatch,
  ) => void;
}
