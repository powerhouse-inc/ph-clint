import type { AgentInboxAgentAction } from "./agent/actions.js";
import type { AgentInboxStakeholdersAction } from "./stakeholders/actions.js";
import type { AgentInboxThreadsAction } from "./threads/actions.js";
import type { AgentInboxWorkflowAction } from "./workflow/actions.js";

export * from "./agent/actions.js";
export * from "./stakeholders/actions.js";
export * from "./threads/actions.js";
export * from "./workflow/actions.js";

export type AgentInboxAction =
  | AgentInboxAgentAction
  | AgentInboxStakeholdersAction
  | AgentInboxThreadsAction
  | AgentInboxWorkflowAction;
