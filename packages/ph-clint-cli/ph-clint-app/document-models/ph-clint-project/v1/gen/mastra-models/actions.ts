/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddModelInput,
  RemoveModelInput,
  SetDefaultModelInput,
} from "../types.js";

export type AddModelAction = Action & {
  type: "ADD_MODEL";
  input: AddModelInput;
};
export type RemoveModelAction = Action & {
  type: "REMOVE_MODEL";
  input: RemoveModelInput;
};
export type SetDefaultModelAction = Action & {
  type: "SET_DEFAULT_MODEL";
  input: SetDefaultModelInput;
};

export type PhClintProjectMastraModelsAction =
  | AddModelAction
  | RemoveModelAction
  | SetDefaultModelAction;
