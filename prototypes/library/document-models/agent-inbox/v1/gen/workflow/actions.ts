import type { Action } from "document-model";
import type {
  ProposeThreadResolvedInput,
  ConfirmThreadResolvedInput,
  ArchiveThreadInput,
  ReopenThreadInput,
} from "../types.js";

export type ProposeThreadResolvedAction = Action & {
  type: "PROPOSE_THREAD_RESOLVED";
  input: ProposeThreadResolvedInput;
};
export type ConfirmThreadResolvedAction = Action & {
  type: "CONFIRM_THREAD_RESOLVED";
  input: ConfirmThreadResolvedInput;
};
export type ArchiveThreadAction = Action & {
  type: "ARCHIVE_THREAD";
  input: ArchiveThreadInput;
};
export type ReopenThreadAction = Action & {
  type: "REOPEN_THREAD";
  input: ReopenThreadInput;
};

export type AgentInboxWorkflowAction =
  | ProposeThreadResolvedAction
  | ConfirmThreadResolvedAction
  | ArchiveThreadAction
  | ReopenThreadAction;
