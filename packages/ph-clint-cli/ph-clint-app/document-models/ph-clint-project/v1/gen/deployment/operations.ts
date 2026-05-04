import { type SignalDispatch } from "document-model";
import type {
  AddSupportedResourceAction,
  RemoveSupportedResourceAction,
  SetProxyEnabledAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectDeploymentOperations {
  addSupportedResourceOperation: (
    state: PhClintProjectState,
    action: AddSupportedResourceAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeSupportedResourceOperation: (
    state: PhClintProjectState,
    action: RemoveSupportedResourceAction,
    dispatch?: SignalDispatch,
  ) => void;
  setProxyEnabledOperation: (
    state: PhClintProjectState,
    action: SetProxyEnabledAction,
    dispatch?: SignalDispatch,
  ) => void;
}
