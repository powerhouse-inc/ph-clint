import type { Action } from "document-model";
import type {
  AddPowerhousePackageInput,
  RemovePowerhousePackageInput,
  AddPackageDocumentTypeInput,
  RemovePackageDocumentTypeInput,
} from "../types.js";

export type AddPowerhousePackageAction = Action & {
  type: "ADD_POWERHOUSE_PACKAGE";
  input: AddPowerhousePackageInput;
};
export type RemovePowerhousePackageAction = Action & {
  type: "REMOVE_POWERHOUSE_PACKAGE";
  input: RemovePowerhousePackageInput;
};
export type AddPackageDocumentTypeAction = Action & {
  type: "ADD_PACKAGE_DOCUMENT_TYPE";
  input: AddPackageDocumentTypeInput;
};
export type RemovePackageDocumentTypeAction = Action & {
  type: "REMOVE_PACKAGE_DOCUMENT_TYPE";
  input: RemovePackageDocumentTypeInput;
};

export type PhClintProjectPowerhousePackagesAction =
  | AddPowerhousePackageAction
  | RemovePowerhousePackageAction
  | AddPackageDocumentTypeAction
  | RemovePackageDocumentTypeAction;
