import type { Action } from "document-model";
import type { UpdateRuntimeInfoInput } from "../types.js";

export type UpdateRuntimeInfoAction = Action & {
  type: "UPDATE_RUNTIME_INFO";
  input: UpdateRuntimeInfoInput;
};

export type AgentProjectsRuntimeInfoAction = UpdateRuntimeInfoAction;
