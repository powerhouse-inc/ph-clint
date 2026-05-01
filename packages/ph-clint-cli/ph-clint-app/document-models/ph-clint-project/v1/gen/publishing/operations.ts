import { type SignalDispatch } from "document-model";
import type {
  BumpVersionAction,
  PublishDevAction,
  PublishStagingAction,
  PublishProductionAction,
  SetPublishStatusAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectPublishingOperations {
  bumpVersionOperation: (
    state: PhClintProjectState,
    action: BumpVersionAction,
    dispatch?: SignalDispatch,
  ) => void;
  publishDevOperation: (
    state: PhClintProjectState,
    action: PublishDevAction,
    dispatch?: SignalDispatch,
  ) => void;
  publishStagingOperation: (
    state: PhClintProjectState,
    action: PublishStagingAction,
    dispatch?: SignalDispatch,
  ) => void;
  publishProductionOperation: (
    state: PhClintProjectState,
    action: PublishProductionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPublishStatusOperation: (
    state: PhClintProjectState,
    action: SetPublishStatusAction,
    dispatch?: SignalDispatch,
  ) => void;
}
