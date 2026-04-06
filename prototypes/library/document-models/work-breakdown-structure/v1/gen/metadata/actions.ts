import type { Action } from "document-model";
import type { SetReferencesInput, SetMetaDataInput } from "../types.js";

export type SetReferencesAction = Action & {
  type: "SET_REFERENCES";
  input: SetReferencesInput;
};
export type SetMetaDataAction = Action & {
  type: "SET_META_DATA";
  input: SetMetaDataInput;
};

export type WorkBreakdownStructureMetadataAction =
  | SetReferencesAction
  | SetMetaDataAction;
