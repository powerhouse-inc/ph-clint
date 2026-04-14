import { type SignalDispatch } from "document-model";
import type {
  AddStakeholderAction,
  SetStakeholderNameAction,
  SetStakeholderEthAddressAction,
  SetStakeholderAvatarAction,
  RemoveStakeholderAction,
  ReaddStakeholderAction,
} from "./actions.js";
import type { AgentChatState } from "../types.js";

export interface AgentChatStakeholdersOperations {
  addStakeholderOperation: (
    state: AgentChatState,
    action: AddStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderNameOperation: (
    state: AgentChatState,
    action: SetStakeholderNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderEthAddressOperation: (
    state: AgentChatState,
    action: SetStakeholderEthAddressAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderAvatarOperation: (
    state: AgentChatState,
    action: SetStakeholderAvatarAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeStakeholderOperation: (
    state: AgentChatState,
    action: RemoveStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
  readdStakeholderOperation: (
    state: AgentChatState,
    action: ReaddStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
}
