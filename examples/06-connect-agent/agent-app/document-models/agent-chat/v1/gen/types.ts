import type { PHDocument, PHBaseState } from "document-model";
import type { AgentChatAction } from "./actions.js";
import type { AgentChatState as AgentChatGlobalState } from "./schema/types.js";

type AgentChatLocalState = Record<PropertyKey, never>;

type AgentChatPHState = PHBaseState & {
  global: AgentChatGlobalState;
  local: AgentChatLocalState;
};
type AgentChatDocument = PHDocument<AgentChatPHState>;

export * from "./schema/types.js";

export type {
  AgentChatGlobalState,
  AgentChatLocalState,
  AgentChatPHState,
  AgentChatAction,
  AgentChatDocument,
};
