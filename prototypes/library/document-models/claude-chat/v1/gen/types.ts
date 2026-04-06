import type { PHDocument, PHBaseState } from "document-model";
import type { ClaudeChatAction } from "./actions.js";
import type { ClaudeChatState as ClaudeChatGlobalState } from "./schema/types.js";

type ClaudeChatLocalState = Record<PropertyKey, never>;

type ClaudeChatPHState = PHBaseState & {
  global: ClaudeChatGlobalState;
  local: ClaudeChatLocalState;
};
type ClaudeChatDocument = PHDocument<ClaudeChatPHState>;

export * from "./schema/types.js";

export type {
  ClaudeChatGlobalState,
  ClaudeChatLocalState,
  ClaudeChatPHState,
  ClaudeChatAction,
  ClaudeChatDocument,
};
