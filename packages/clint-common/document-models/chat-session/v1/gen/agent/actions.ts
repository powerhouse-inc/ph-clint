/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AddAssistantMessageInput, AppendAssistantContentInput, SetMessageUsageInput, SetRespondingInput, UpdateAssistantContentInput } from '../types.js';

export type AddAssistantMessageAction = Action & {
  type: 'ADD_ASSISTANT_MESSAGE';
  input: AddAssistantMessageInput;
};
export type AppendAssistantContentAction = Action & {
  type: 'APPEND_ASSISTANT_CONTENT';
  input: AppendAssistantContentInput;
};
export type UpdateAssistantContentAction = Action & {
  type: 'UPDATE_ASSISTANT_CONTENT';
  input: UpdateAssistantContentInput;
};
export type SetMessageUsageAction = Action & {
  type: 'SET_MESSAGE_USAGE';
  input: SetMessageUsageInput;
};
export type SetRespondingAction = Action & {
  type: 'SET_RESPONDING';
  input: SetRespondingInput;
};

export type ChatSessionAgentAction = AddAssistantMessageAction | AppendAssistantContentAction | UpdateAssistantContentAction | SetMessageUsageAction | SetRespondingAction;
