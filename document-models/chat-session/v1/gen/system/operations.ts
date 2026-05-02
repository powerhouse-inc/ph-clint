/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { ChatSessionGlobalState } from "../types.js";
import type {
  AddSystemMessageAction,
  EndSessionAction,
  SetAgentInfoAction,
  StartSessionAction,
  UpdateUsageSummaryAction,
} from "./actions.js";

export interface ChatSessionSystemOperations {
  startSessionOperation: (
    state: ChatSessionGlobalState,
    action: StartSessionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setAgentInfoOperation: (
    state: ChatSessionGlobalState,
    action: SetAgentInfoAction,
    dispatch?: SignalDispatch,
  ) => void;
  endSessionOperation: (
    state: ChatSessionGlobalState,
    action: EndSessionAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateUsageSummaryOperation: (
    state: ChatSessionGlobalState,
    action: UpdateUsageSummaryAction,
    dispatch?: SignalDispatch,
  ) => void;
  addSystemMessageOperation: (
    state: ChatSessionGlobalState,
    action: AddSystemMessageAction,
    dispatch?: SignalDispatch,
  ) => void;
}
