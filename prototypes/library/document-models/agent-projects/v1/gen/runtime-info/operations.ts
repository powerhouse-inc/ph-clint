import { type SignalDispatch } from "document-model";
import type { UpdateRuntimeInfoAction } from "./actions.js";
import type { AgentProjectsState } from "../types.js";

export interface AgentProjectsRuntimeInfoOperations {
  updateRuntimeInfoOperation: (
    state: AgentProjectsState,
    action: UpdateRuntimeInfoAction,
    dispatch?: SignalDispatch,
  ) => void;
}
