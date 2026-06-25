/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
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
  PhClintProjectAction,
  PhClintProjectDocument,
  PhClintProjectGlobalState,
  PhClintProjectLocalState,
  PhClintProjectPHState,
};
