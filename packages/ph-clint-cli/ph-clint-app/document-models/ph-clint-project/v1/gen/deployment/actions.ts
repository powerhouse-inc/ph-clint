import type { Action } from "document-model";
import type {
  AddSupportedResourceInput,
  RemoveSupportedResourceInput,
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

export type PhClintProjectDeploymentAction =
  | AddSupportedResourceAction
  | RemoveSupportedResourceAction
  | SetProxyEnabledAction;
