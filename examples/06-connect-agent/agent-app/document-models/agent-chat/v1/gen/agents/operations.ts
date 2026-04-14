import { type SignalDispatch } from "document-model";
import type {
  AddAgentAction,
  SetAgentNameAction,
  SetAgentEthAddressAction,
  SetAgentRoleAction,
  SetAgentDescriptionAction,
  SetAgentAvatarAction,
  RemoveAgentAction,
  ReaddAgentAction,
} from "./actions.js";
import type { AgentChatState } from "../types.js";

export interface AgentChatAgentsOperations {
  addAgentOperation: (
    state: AgentChatState,
    action: AddAgentAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentNameOperation: (
    state: AgentChatState,
    action: SetAgentNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentEthAddressOperation: (
    state: AgentChatState,
    action: SetAgentEthAddressAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentRoleOperation: (
    state: AgentChatState,
    action: SetAgentRoleAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentDescriptionOperation: (
    state: AgentChatState,
    action: SetAgentDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentAvatarOperation: (
    state: AgentChatState,
    action: SetAgentAvatarAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeAgentOperation: (
    state: AgentChatState,
    action: RemoveAgentAction,
    dispatch?: SignalDispatch,
  ) => void;
  readdAgentOperation: (
    state: AgentChatState,
    action: ReaddAgentAction,
    dispatch?: SignalDispatch,
  ) => void;
}
