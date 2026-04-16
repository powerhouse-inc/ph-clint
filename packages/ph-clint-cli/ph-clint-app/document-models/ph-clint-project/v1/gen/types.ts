import type { PHDocument, PHBaseState } from "document-model";
import type { PhClintProjectAction } from "./actions.js";
import type { PhClintProjectState as PhClintProjectGlobalState } from "./schema/types.js";

type PhClintProjectLocalState = Record<PropertyKey, never>;

type PhClintProjectPHState = PHBaseState & {
  global: PhClintProjectGlobalState;
  local: PhClintProjectLocalState;
};
type PhClintProjectDocument = PHDocument<PhClintProjectPHState>;

export * from "./schema/types.js";

export type {
  PhClintProjectGlobalState,
  PhClintProjectLocalState,
  PhClintProjectPHState,
  PhClintProjectAction,
  PhClintProjectDocument,
};
