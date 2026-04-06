import { type SignalDispatch } from "document-model";
import type {
  CreateThreadAction,
  SendAgentMessageAction,
  SetThreadTopicAction,
  EditMessageContentAction,
  MarkMessageReadAction,
  MarkMessageUnreadAction,
  SendStakeholderMessageAction,
} from "./actions.js";
import type { AgentInboxState } from "../types.js";

export interface AgentInboxThreadsOperations {
  createThreadOperation: (
    state: AgentInboxState,
    action: CreateThreadAction,
    dispatch?: SignalDispatch,
  ) => void;
  sendAgentMessageOperation: (
    state: AgentInboxState,
    action: SendAgentMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
  setThreadTopicOperation: (
    state: AgentInboxState,
    action: SetThreadTopicAction,
    dispatch?: SignalDispatch,
  ) => void;
  editMessageContentOperation: (
    state: AgentInboxState,
    action: EditMessageContentAction,
    dispatch?: SignalDispatch,
  ) => void;
  markMessageReadOperation: (
    state: AgentInboxState,
    action: MarkMessageReadAction,
    dispatch?: SignalDispatch,
  ) => void;
  markMessageUnreadOperation: (
    state: AgentInboxState,
    action: MarkMessageUnreadAction,
    dispatch?: SignalDispatch,
  ) => void;
  sendStakeholderMessageOperation: (
    state: AgentInboxState,
    action: SendStakeholderMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
}
