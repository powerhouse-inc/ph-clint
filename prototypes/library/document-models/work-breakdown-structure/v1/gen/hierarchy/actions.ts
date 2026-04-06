import type { Action } from "document-model";
import type {
  ReorderInput,
  AddDependenciesInput,
  RemoveDependenciesInput,
} from "../types.js";

export type ReorderAction = Action & { type: "REORDER"; input: ReorderInput };
export type AddDependenciesAction = Action & {
  type: "ADD_DEPENDENCIES";
  input: AddDependenciesInput;
};
export type RemoveDependenciesAction = Action & {
  type: "REMOVE_DEPENDENCIES";
  input: RemoveDependenciesInput;
};

export type WorkBreakdownStructureHierarchyAction =
  | ReorderAction
  | AddDependenciesAction
  | RemoveDependenciesAction;
