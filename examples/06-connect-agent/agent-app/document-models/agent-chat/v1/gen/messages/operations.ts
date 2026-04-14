import { type SignalDispatch } from "document-model";
import type {
  SendTextAction,
  SendErrorAction,
  SendToolCallAction,
  SendToolResultAction,
  DeleteMessageAction,
  MarkAsReadAction,
} from "./actions.js";
import type { AgentChatState } from "../types.js";

export interface AgentChatMessagesOperations {
  sendTextOperation: (
    state: AgentChatState,
    action: SendTextAction,
    dispatch?: SignalDispatch,
  ) => void;
  sendErrorOperation: (
    state: AgentChatState,
    action: SendErrorAction,
    dispatch?: SignalDispatch,
  ) => void;
  sendToolCallOperation: (
    state: AgentChatState,
    action: SendToolCallAction,
    dispatch?: SignalDispatch,
  ) => void;
  sendToolResultOperation: (
    state: AgentChatState,
    action: SendToolResultAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteMessageOperation: (
    state: AgentChatState,
    action: DeleteMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
  markAsReadOperation: (
    state: AgentChatState,
    action: MarkAsReadAction,
    dispatch?: SignalDispatch,
  ) => void;
}
