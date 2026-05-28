/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AddAgentProfileRefInput, AddAgentSkillInput, AddAgentToolPatternInput, RemoveAgentProfileRefInput, RemoveAgentSkillInput, RemoveAgentToolPatternInput, ReorderAgentProfileRefsInput, SetAgentModelInput } from '../types.js';

export type SetAgentModelAction = Action & {
  type: 'SET_AGENT_MODEL';
  input: SetAgentModelInput;
};
export type AddAgentProfileRefAction = Action & {
  type: 'ADD_AGENT_PROFILE_REF';
  input: AddAgentProfileRefInput;
};
export type RemoveAgentProfileRefAction = Action & {
  type: 'REMOVE_AGENT_PROFILE_REF';
  input: RemoveAgentProfileRefInput;
};
export type ReorderAgentProfileRefsAction = Action & {
  type: 'REORDER_AGENT_PROFILE_REFS';
  input: ReorderAgentProfileRefsInput;
};
export type AddAgentSkillAction = Action & {
  type: 'ADD_AGENT_SKILL';
  input: AddAgentSkillInput;
};
export type RemoveAgentSkillAction = Action & {
  type: 'REMOVE_AGENT_SKILL';
  input: RemoveAgentSkillInput;
};
export type AddAgentToolPatternAction = Action & {
  type: 'ADD_AGENT_TOOL_PATTERN';
  input: AddAgentToolPatternInput;
};
export type RemoveAgentToolPatternAction = Action & {
  type: 'REMOVE_AGENT_TOOL_PATTERN';
  input: RemoveAgentToolPatternInput;
};

export type PhClintProjectMastraAgentBindingsAction =
  | SetAgentModelAction
  | AddAgentProfileRefAction
  | RemoveAgentProfileRefAction
  | ReorderAgentProfileRefsAction
  | AddAgentSkillAction
  | RemoveAgentSkillAction
  | AddAgentToolPatternAction
  | RemoveAgentToolPatternAction;
