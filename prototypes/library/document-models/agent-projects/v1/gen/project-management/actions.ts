import type { Action } from "document-model";
import type {
  RegisterProjectInput,
  UpdateProjectConfigInput,
  UpdateProjectStatusInput,
} from "../types.js";

export type RegisterProjectAction = Action & {
  type: "REGISTER_PROJECT";
  input: RegisterProjectInput;
};
export type UpdateProjectConfigAction = Action & {
  type: "UPDATE_PROJECT_CONFIG";
  input: UpdateProjectConfigInput;
};
export type UpdateProjectStatusAction = Action & {
  type: "UPDATE_PROJECT_STATUS";
  input: UpdateProjectStatusInput;
};

export type AgentProjectsProjectManagementAction =
  | RegisterProjectAction
  | UpdateProjectConfigAction
  | UpdateProjectStatusAction;
