import { type SignalDispatch } from "document-model";
import type {
  SetAgentNameAction,
  SetAgentAddressAction,
  SetAgentRoleAction,
  SetAgentDescriptionAction,
  SetAgentAvatarAction,
} from "./actions.js";
import type { AgentInboxState } from "../types.js";

export interface AgentInboxAgentOperations {
  setAgentNameOperation: (
    state: AgentInboxState,
    action: SetAgentNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentAddressOperation: (
    state: AgentInboxState,
    action: SetAgentAddressAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentRoleOperation: (
    state: AgentInboxState,
    action: SetAgentRoleAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentDescriptionOperation: (
    state: AgentInboxState,
    action: SetAgentDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentAvatarOperation: (
    state: AgentInboxState,
    action: SetAgentAvatarAction,
    dispatch?: SignalDispatch,
  ) => void;
}
