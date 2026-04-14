import { type SignalDispatch } from "document-model";
import type {
  SetTopicAction,
  ClearTopicAction,
  SetPruneLengthAction,
  RemovePruneLengthAction,
} from "./actions.js";
import type { AgentChatState } from "../types.js";

export interface AgentChatBaseOperations {
  setTopicOperation: (
    state: AgentChatState,
    action: SetTopicAction,
    dispatch?: SignalDispatch,
  ) => void;
  clearTopicOperation: (
    state: AgentChatState,
    action: ClearTopicAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPruneLengthOperation: (
    state: AgentChatState,
    action: SetPruneLengthAction,
    dispatch?: SignalDispatch,
  ) => void;
  removePruneLengthOperation: (
    state: AgentChatState,
    action: RemovePruneLengthAction,
    dispatch?: SignalDispatch,
  ) => void;
}
