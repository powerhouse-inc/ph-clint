/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { ClearMainAgentDescriptionAction, ClearMainAgentImageAction, SetMainAgentDescriptionAction, SetMainAgentImageAction, SetMainAgentNameAction } from './actions.js';

export interface PhClintProjectMastraMainAgentOperations {
  setMainAgentNameOperation: (state: PhClintProjectGlobalState, action: SetMainAgentNameAction, dispatch?: SignalDispatch) => void;
  setMainAgentDescriptionOperation: (state: PhClintProjectGlobalState, action: SetMainAgentDescriptionAction, dispatch?: SignalDispatch) => void;
  clearMainAgentDescriptionOperation: (state: PhClintProjectGlobalState, action: ClearMainAgentDescriptionAction, dispatch?: SignalDispatch) => void;
  setMainAgentImageOperation: (state: PhClintProjectGlobalState, action: SetMainAgentImageAction, dispatch?: SignalDispatch) => void;
  clearMainAgentImageOperation: (state: PhClintProjectGlobalState, action: ClearMainAgentImageAction, dispatch?: SignalDispatch) => void;
}
