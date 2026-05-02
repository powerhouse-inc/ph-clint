/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { ChatSessionGlobalState } from "../types.js";
import type {
  AbortSessionAction,
  AddUserMessageAction,
  DeleteUserMessageAction,
} from "./actions.js";

export interface ChatSessionUserOperations {
  addUserMessageOperation: (
    state: ChatSessionGlobalState,
    action: AddUserMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteUserMessageOperation: (
    state: ChatSessionGlobalState,
    action: DeleteUserMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
  abortSessionOperation: (
    state: ChatSessionGlobalState,
    action: AbortSessionAction,
    dispatch?: SignalDispatch,
  ) => void;
}
