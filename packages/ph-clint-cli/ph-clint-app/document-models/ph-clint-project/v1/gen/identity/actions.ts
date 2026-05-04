import type { Action } from "document-model";
import type {
  SetDescriptionInput,
  SetVersionInput,
  SetPackageIdentifierInput,
} from "../types.js";

export type SetDescriptionAction = Action & {
  type: "SET_DESCRIPTION";
  input: SetDescriptionInput;
};
export type SetVersionAction = Action & {
  type: "SET_VERSION";
  input: SetVersionInput;
};
export type SetPackageIdentifierAction = Action & {
  type: "SET_PACKAGE_IDENTIFIER";
  input: SetPackageIdentifierInput;
};

export type PhClintProjectIdentityAction =
  | SetDescriptionAction
  | SetVersionAction
  | SetPackageIdentifierAction;
