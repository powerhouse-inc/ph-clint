/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AddSubAgentInput, RemoveSubAgentInput, SetSubAgentDescriptionInput, SetSubAgentNameInput } from '../types.js';

export type AddSubAgentAction = Action & {
  type: 'ADD_SUB_AGENT';
  input: AddSubAgentInput;
};
export type RemoveSubAgentAction = Action & {
  type: 'REMOVE_SUB_AGENT';
  input: RemoveSubAgentInput;
};
export type SetSubAgentNameAction = Action & {
  type: 'SET_SUB_AGENT_NAME';
  input: SetSubAgentNameInput;
};
export type SetSubAgentDescriptionAction = Action & {
  type: 'SET_SUB_AGENT_DESCRIPTION';
  input: SetSubAgentDescriptionInput;
};

export type PhClintProjectMastraSubAgentsAction = AddSubAgentAction | RemoveSubAgentAction | SetSubAgentNameAction | SetSubAgentDescriptionAction;
