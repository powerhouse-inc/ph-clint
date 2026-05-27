/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { AddSubAgentAction, RemoveSubAgentAction, SetSubAgentDescriptionAction, SetSubAgentNameAction } from './actions.js';

export interface PhClintProjectMastraSubAgentsOperations {
  addSubAgentOperation: (state: PhClintProjectGlobalState, action: AddSubAgentAction, dispatch?: SignalDispatch) => void;
  removeSubAgentOperation: (state: PhClintProjectGlobalState, action: RemoveSubAgentAction, dispatch?: SignalDispatch) => void;
  setSubAgentNameOperation: (state: PhClintProjectGlobalState, action: SetSubAgentNameAction, dispatch?: SignalDispatch) => void;
  setSubAgentDescriptionOperation: (state: PhClintProjectGlobalState, action: SetSubAgentDescriptionAction, dispatch?: SignalDispatch) => void;
}
