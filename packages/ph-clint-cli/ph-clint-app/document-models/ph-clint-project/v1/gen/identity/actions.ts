import type { Action } from "document-model";
import type {
  SetPackageNameInput,
  ClearBinInput,
  SetBinInput,
  SetDescriptionInput,
  SetVersionInput,
  ClearScopeInput,
  SetScopeInput,
} from "../types.js";

export type SetPackageNameAction = Action & {
  type: "SET_PACKAGE_NAME";
  input: SetPackageNameInput;
};
export type ClearBinAction = Action & {
  type: "CLEAR_BIN";
  input: ClearBinInput;
};
export type SetBinAction = Action & { type: "SET_BIN"; input: SetBinInput };
export type SetDescriptionAction = Action & {
  type: "SET_DESCRIPTION";
  input: SetDescriptionInput;
};
export type SetVersionAction = Action & {
  type: "SET_VERSION";
  input: SetVersionInput;
};
export type ClearScopeAction = Action & {
  type: "CLEAR_SCOPE";
  input: ClearScopeInput;
};
export type SetScopeAction = Action & {
  type: "SET_SCOPE";
  input: SetScopeInput;
};

export type PhClintProjectIdentityAction =
  | SetPackageNameAction
  | ClearBinAction
  | SetBinAction
  | SetDescriptionAction
  | SetVersionAction
  | ClearScopeAction
  | SetScopeAction;
