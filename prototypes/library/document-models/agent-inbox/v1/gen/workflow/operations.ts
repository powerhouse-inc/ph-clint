import { type SignalDispatch } from "document-model";
import type {
  ProposeThreadResolvedAction,
  ConfirmThreadResolvedAction,
  ArchiveThreadAction,
  ReopenThreadAction,
} from "./actions.js";
import type { AgentInboxState } from "../types.js";

export interface AgentInboxWorkflowOperations {
  proposeThreadResolvedOperation: (
    state: AgentInboxState,
    action: ProposeThreadResolvedAction,
    dispatch?: SignalDispatch,
  ) => void;
  confirmThreadResolvedOperation: (
    state: AgentInboxState,
    action: ConfirmThreadResolvedAction,
    dispatch?: SignalDispatch,
  ) => void;
  archiveThreadOperation: (
    state: AgentInboxState,
    action: ArchiveThreadAction,
    dispatch?: SignalDispatch,
  ) => void;
  reopenThreadOperation: (
    state: AgentInboxState,
    action: ReopenThreadAction,
    dispatch?: SignalDispatch,
  ) => void;
}
