import { type SignalDispatch } from "document-model";
import type {
  RegisterProjectAction,
  UpdateProjectConfigAction,
  UpdateProjectStatusAction,
} from "./actions.js";
import type { AgentProjectsState } from "../types.js";

export interface AgentProjectsProjectManagementOperations {
  registerProjectOperation: (
    state: AgentProjectsState,
    action: RegisterProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateProjectConfigOperation: (
    state: AgentProjectsState,
    action: UpdateProjectConfigAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateProjectStatusOperation: (
    state: AgentProjectsState,
    action: UpdateProjectStatusAction,
    dispatch?: SignalDispatch,
  ) => void;
}
