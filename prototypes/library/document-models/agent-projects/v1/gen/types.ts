import type { PHDocument, PHBaseState } from "document-model";
import type { AgentProjectsAction } from "./actions.js";
import type { AgentProjectsState as AgentProjectsGlobalState } from "./schema/types.js";

type AgentProjectsLocalState = Record<PropertyKey, never>;

type AgentProjectsPHState = PHBaseState & {
  global: AgentProjectsGlobalState;
  local: AgentProjectsLocalState;
};
type AgentProjectsDocument = PHDocument<AgentProjectsPHState>;

export * from "./schema/types.js";

export type {
  AgentProjectsGlobalState,
  AgentProjectsLocalState,
  AgentProjectsPHState,
  AgentProjectsAction,
  AgentProjectsDocument,
};
