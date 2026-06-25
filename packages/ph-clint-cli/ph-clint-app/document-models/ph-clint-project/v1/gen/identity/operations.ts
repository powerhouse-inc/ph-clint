/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type {
  SetDescriptionAction,
  SetPackageIdentifierAction,
  SetVersionAction,
} from "./actions.js";

export interface PhClintProjectIdentityOperations {
  setDescriptionOperation: (
    state: PhClintProjectGlobalState,
    action: SetDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setVersionOperation: (
    state: PhClintProjectGlobalState,
    action: SetVersionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPackageIdentifierOperation: (
    state: PhClintProjectGlobalState,
    action: SetPackageIdentifierAction,
    dispatch?: SignalDispatch,
  ) => void;
}
