import type { Action } from "document-model";
import type { AddLogEntryInput, ClearProjectLogsInput } from "../types.js";

export type AddLogEntryAction = Action & {
  type: "ADD_LOG_ENTRY";
  input: AddLogEntryInput;
};
export type ClearProjectLogsAction = Action & {
  type: "CLEAR_PROJECT_LOGS";
  input: ClearProjectLogsInput;
};

export type AgentProjectsLogsAction =
  | AddLogEntryAction
  | ClearProjectLogsAction;
