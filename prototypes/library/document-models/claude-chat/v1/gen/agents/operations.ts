import { type SignalDispatch } from "document-model";
import type { AddAgentAction } from "./actions.js";
import type { ClaudeChatState } from "../types.js";

export interface ClaudeChatAgentsOperations {
  addAgentOperation: (
    state: ClaudeChatState,
    action: AddAgentAction,
    dispatch?: SignalDispatch,
  ) => void;
}
