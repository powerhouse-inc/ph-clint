import { type SignalDispatch } from "document-model";
import type {
  SetDescriptionAction,
  SetVersionAction,
  SetPackageIdentifierAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectIdentityOperations {
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
  setPackageIdentifierOperation: (
    state: PhClintProjectState,
    action: SetPackageIdentifierAction,
    dispatch?: SignalDispatch,
  ) => void;
}
