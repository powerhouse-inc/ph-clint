import { type SignalDispatch } from "document-model";
import type { AddLogEntryAction, ClearProjectLogsAction } from "./actions.js";
import type { AgentProjectsState } from "../types.js";

export interface AgentProjectsLogsOperations {
  addLogEntryOperation: (
    state: AgentProjectsState,
    action: AddLogEntryAction,
    dispatch?: SignalDispatch,
  ) => void;
  clearProjectLogsOperation: (
    state: AgentProjectsState,
    action: ClearProjectLogsAction,
    dispatch?: SignalDispatch,
  ) => void;
}
