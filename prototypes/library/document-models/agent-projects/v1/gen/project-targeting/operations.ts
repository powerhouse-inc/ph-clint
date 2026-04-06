import { type SignalDispatch } from "document-model";
import type {
  CreateProjectAction,
  RunProjectAction,
  StopProjectAction,
  DeleteProjectAction,
} from "./actions.js";
import type { AgentProjectsState } from "../types.js";

export interface AgentProjectsProjectTargetingOperations {
  createProjectOperation: (
    state: AgentProjectsState,
    action: CreateProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  runProjectOperation: (
    state: AgentProjectsState,
    action: RunProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  stopProjectOperation: (
    state: AgentProjectsState,
    action: StopProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteProjectOperation: (
    state: AgentProjectsState,
    action: DeleteProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
}
