/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { AbortSessionInput, AddUserMessageInput, DeleteUserMessageInput } from '../types.js';

export type AddUserMessageAction = Action & {
  type: 'ADD_USER_MESSAGE';
  input: AddUserMessageInput;
};
export type DeleteUserMessageAction = Action & {
  type: 'DELETE_USER_MESSAGE';
  input: DeleteUserMessageInput;
};
export type AbortSessionAction = Action & {
  type: 'ABORT_SESSION';
  input: AbortSessionInput;
};

export type ChatSessionUserAction = AddUserMessageAction | DeleteUserMessageAction | AbortSessionAction;
