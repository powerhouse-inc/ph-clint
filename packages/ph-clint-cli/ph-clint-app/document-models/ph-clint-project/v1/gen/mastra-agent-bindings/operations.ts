/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { AddAgentProfileRefAction, AddAgentSkillAction, AddAgentToolPatternAction, RemoveAgentProfileRefAction, RemoveAgentSkillAction, RemoveAgentToolPatternAction, ReorderAgentProfileRefsAction, SetAgentModelAction } from './actions.js';

export interface PhClintProjectMastraAgentBindingsOperations {
  setAgentModelOperation: (state: PhClintProjectGlobalState, action: SetAgentModelAction, dispatch?: SignalDispatch) => void;
  addAgentProfileRefOperation: (state: PhClintProjectGlobalState, action: AddAgentProfileRefAction, dispatch?: SignalDispatch) => void;
  removeAgentProfileRefOperation: (state: PhClintProjectGlobalState, action: RemoveAgentProfileRefAction, dispatch?: SignalDispatch) => void;
  reorderAgentProfileRefsOperation: (state: PhClintProjectGlobalState, action: ReorderAgentProfileRefsAction, dispatch?: SignalDispatch) => void;
  addAgentSkillOperation: (state: PhClintProjectGlobalState, action: AddAgentSkillAction, dispatch?: SignalDispatch) => void;
  removeAgentSkillOperation: (state: PhClintProjectGlobalState, action: RemoveAgentSkillAction, dispatch?: SignalDispatch) => void;
  addAgentToolPatternOperation: (state: PhClintProjectGlobalState, action: AddAgentToolPatternAction, dispatch?: SignalDispatch) => void;
  removeAgentToolPatternOperation: (state: PhClintProjectGlobalState, action: RemoveAgentToolPatternAction, dispatch?: SignalDispatch) => void;
}
