import type { PHDocument, PHBaseState } from "document-model";
import type { AgentInboxAction } from "./actions.js";
import type { AgentInboxState as AgentInboxGlobalState } from "./schema/types.js";

type AgentInboxLocalState = Record<PropertyKey, never>;

type AgentInboxPHState = PHBaseState & {
  global: AgentInboxGlobalState;
  local: AgentInboxLocalState;
};
type AgentInboxDocument = PHDocument<AgentInboxPHState>;

export * from "./schema/types.js";

export type {
  AgentInboxGlobalState,
  AgentInboxLocalState,
  AgentInboxPHState,
  AgentInboxAction,
  AgentInboxDocument,
};
