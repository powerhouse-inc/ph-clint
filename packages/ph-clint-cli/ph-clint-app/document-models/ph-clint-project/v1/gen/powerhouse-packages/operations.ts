/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { PhClintProjectGlobalState } from "../types.js";
import type {
  AddPackageDocumentTypeAction,
  AddPowerhousePackageAction,
  RemovePackageDocumentTypeAction,
  RemovePowerhousePackageAction,
  SetPackageVersionAction,
} from "./actions.js";

export interface PhClintProjectPowerhousePackagesOperations {
  addPowerhousePackageOperation: (
    state: PhClintProjectGlobalState,
    action: AddPowerhousePackageAction,
    dispatch?: SignalDispatch,
  ) => void;
  removePowerhousePackageOperation: (
    state: PhClintProjectGlobalState,
    action: RemovePowerhousePackageAction,
    dispatch?: SignalDispatch,
  ) => void;
  addPackageDocumentTypeOperation: (
    state: PhClintProjectGlobalState,
    action: AddPackageDocumentTypeAction,
    dispatch?: SignalDispatch,
  ) => void;
  removePackageDocumentTypeOperation: (
    state: PhClintProjectGlobalState,
    action: RemovePackageDocumentTypeAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPackageVersionOperation: (
    state: PhClintProjectGlobalState,
    action: SetPackageVersionAction,
    dispatch?: SignalDispatch,
  ) => void;
}
