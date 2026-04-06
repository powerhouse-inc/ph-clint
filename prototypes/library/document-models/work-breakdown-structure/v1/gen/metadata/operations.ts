import { type SignalDispatch } from "document-model";
import type { SetReferencesAction, SetMetaDataAction } from "./actions.js";
import type { WorkBreakdownStructureState } from "../types.js";

export interface WorkBreakdownStructureMetadataOperations {
  setReferencesOperation: (
    state: WorkBreakdownStructureState,
    action: SetReferencesAction,
    dispatch?: SignalDispatch,
  ) => void;
  setMetaDataOperation: (
    state: WorkBreakdownStructureState,
    action: SetMetaDataAction,
    dispatch?: SignalDispatch,
  ) => void;
}
