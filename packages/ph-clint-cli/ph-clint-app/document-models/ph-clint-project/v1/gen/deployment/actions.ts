/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddSupportedResourceInput,
  RemoveSupportedResourceInput,
  SetObservabilityEnabledInput,
  SetProxyEnabledInput,
} from "../types.js";

export type AddSupportedResourceAction = Action & {
  type: "ADD_SUPPORTED_RESOURCE";
  input: AddSupportedResourceInput;
};
export type RemoveSupportedResourceAction = Action & {
  type: "REMOVE_SUPPORTED_RESOURCE";
  input: RemoveSupportedResourceInput;
};
export type SetProxyEnabledAction = Action & {
  type: "SET_PROXY_ENABLED";
  input: SetProxyEnabledInput;
};
export type SetObservabilityEnabledAction = Action & {
  type: "SET_OBSERVABILITY_ENABLED";
  input: SetObservabilityEnabledInput;
};

export type PhClintProjectDeploymentAction =
  | AddSupportedResourceAction
  | RemoveSupportedResourceAction
  | SetProxyEnabledAction
  | SetObservabilityEnabledAction;
