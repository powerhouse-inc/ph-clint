/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { BumpVersionAction, PublishDevAction, PublishProductionAction, PublishStagingAction, SetPublishStatusAction } from './actions.js';

export interface PhClintProjectPublishingOperations {
  bumpVersionOperation: (state: PhClintProjectGlobalState, action: BumpVersionAction, dispatch?: SignalDispatch) => void;
  publishDevOperation: (state: PhClintProjectGlobalState, action: PublishDevAction, dispatch?: SignalDispatch) => void;
  publishStagingOperation: (state: PhClintProjectGlobalState, action: PublishStagingAction, dispatch?: SignalDispatch) => void;
  publishProductionOperation: (state: PhClintProjectGlobalState, action: PublishProductionAction, dispatch?: SignalDispatch) => void;
  setPublishStatusOperation: (state: PhClintProjectGlobalState, action: SetPublishStatusAction, dispatch?: SignalDispatch) => void;
}
