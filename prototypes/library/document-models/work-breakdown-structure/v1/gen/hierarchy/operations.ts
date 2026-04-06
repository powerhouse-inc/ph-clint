import { type SignalDispatch } from "document-model";
import type {
  ReorderAction,
  AddDependenciesAction,
  RemoveDependenciesAction,
} from "./actions.js";
import type { WorkBreakdownStructureState } from "../types.js";

export interface WorkBreakdownStructureHierarchyOperations {
  reorderOperation: (
    state: WorkBreakdownStructureState,
    action: ReorderAction,
    dispatch?: SignalDispatch,
  ) => void;
  addDependenciesOperation: (
    state: WorkBreakdownStructureState,
    action: AddDependenciesAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeDependenciesOperation: (
    state: WorkBreakdownStructureState,
    action: RemoveDependenciesAction,
    dispatch?: SignalDispatch,
  ) => void;
}
