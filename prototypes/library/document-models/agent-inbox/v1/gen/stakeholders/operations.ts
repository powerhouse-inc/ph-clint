import { type SignalDispatch } from "document-model";
import type {
  AddStakeholderAction,
  RemoveStakeholderAction,
  SetStakeholderNameAction,
  SetStakeholderAddressAction,
  SetStakeholderAvatarAction,
  MoveStakeholderAction,
} from "./actions.js";
import type { AgentInboxState } from "../types.js";

export interface AgentInboxStakeholdersOperations {
  addStakeholderOperation: (
    state: AgentInboxState,
    action: AddStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeStakeholderOperation: (
    state: AgentInboxState,
    action: RemoveStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderNameOperation: (
    state: AgentInboxState,
    action: SetStakeholderNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderAddressOperation: (
    state: AgentInboxState,
    action: SetStakeholderAddressAction,
    dispatch?: SignalDispatch,
  ) => void;
  setStakeholderAvatarOperation: (
    state: AgentInboxState,
    action: SetStakeholderAvatarAction,
    dispatch?: SignalDispatch,
  ) => void;
  moveStakeholderOperation: (
    state: AgentInboxState,
    action: MoveStakeholderAction,
    dispatch?: SignalDispatch,
  ) => void;
}
