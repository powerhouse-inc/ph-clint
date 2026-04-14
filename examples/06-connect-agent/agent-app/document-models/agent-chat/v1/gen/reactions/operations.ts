import { type SignalDispatch } from "document-model";
import type { AddReactionAction, RemoveReactionAction } from "./actions.js";
import type { AgentChatState } from "../types.js";

export interface AgentChatReactionsOperations {
  addReactionOperation: (
    state: AgentChatState,
    action: AddReactionAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeReactionOperation: (
    state: AgentChatState,
    action: RemoveReactionAction,
    dispatch?: SignalDispatch,
  ) => void;
}
