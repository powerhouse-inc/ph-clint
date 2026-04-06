import type { Action } from "document-model";
import type {
  CreateProjectInput,
  RunProjectInput,
  StopProjectInput,
  DeleteProjectInput,
} from "../types.js";

export type CreateProjectAction = Action & {
  type: "CREATE_PROJECT";
  input: CreateProjectInput;
};
export type RunProjectAction = Action & {
  type: "RUN_PROJECT";
  input: RunProjectInput;
};
export type StopProjectAction = Action & {
  type: "STOP_PROJECT";
  input: StopProjectInput;
};
export type DeleteProjectAction = Action & {
  type: "DELETE_PROJECT";
  input: DeleteProjectInput;
};

export type AgentProjectsProjectTargetingAction =
  | CreateProjectAction
  | RunProjectAction
  | StopProjectAction
  | DeleteProjectAction;
