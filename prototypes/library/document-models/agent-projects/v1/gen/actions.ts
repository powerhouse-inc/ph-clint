import type { AgentProjectsProjectTargetingAction } from "./project-targeting/actions.js";
import type { AgentProjectsProjectManagementAction } from "./project-management/actions.js";
import type { AgentProjectsRuntimeInfoAction } from "./runtime-info/actions.js";
import type { AgentProjectsLogsAction } from "./logs/actions.js";

export * from "./project-targeting/actions.js";
export * from "./project-management/actions.js";
export * from "./runtime-info/actions.js";
export * from "./logs/actions.js";

export type AgentProjectsAction =
  | AgentProjectsProjectTargetingAction
  | AgentProjectsProjectManagementAction
  | AgentProjectsRuntimeInfoAction
  | AgentProjectsLogsAction;
