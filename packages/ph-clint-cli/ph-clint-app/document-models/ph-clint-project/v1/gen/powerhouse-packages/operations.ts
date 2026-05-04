import { type SignalDispatch } from "document-model";
import type {
  AddPowerhousePackageAction,
  RemovePowerhousePackageAction,
  AddPackageDocumentTypeAction,
  RemovePackageDocumentTypeAction,
  SetPackageVersionAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectPowerhousePackagesOperations {
  addPowerhousePackageOperation: (
    state: PhClintProjectState,
    action: AddPowerhousePackageAction,
    dispatch?: SignalDispatch,
  ) => void;
  removePowerhousePackageOperation: (
    state: PhClintProjectState,
    action: RemovePowerhousePackageAction,
    dispatch?: SignalDispatch,
  ) => void;
  addPackageDocumentTypeOperation: (
    state: PhClintProjectState,
    action: AddPackageDocumentTypeAction,
    dispatch?: SignalDispatch,
  ) => void;
  removePackageDocumentTypeOperation: (
    state: PhClintProjectState,
    action: RemovePackageDocumentTypeAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPackageVersionOperation: (
    state: PhClintProjectState,
    action: SetPackageVersionAction,
    dispatch?: SignalDispatch,
  ) => void;
}
