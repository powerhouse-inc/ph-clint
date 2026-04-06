import { type SignalDispatch } from "document-model";
import type { SetUsernameAction, SetSelectedAgentAction } from "./actions.js";
import type { ClaudeChatState } from "../types.js";

export interface ClaudeChatUserOperations {
  setUsernameOperation: (
    state: ClaudeChatState,
    action: SetUsernameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setSelectedAgentOperation: (
    state: ClaudeChatState,
    action: SetSelectedAgentAction,
    dispatch?: SignalDispatch,
  ) => void;
}
