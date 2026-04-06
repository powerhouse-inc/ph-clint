import type { PHDocument, PHBaseState } from "document-model";
import type { AchraPresentationAction } from "./actions.js";
import type { AchraPresentationState as AchraPresentationGlobalState } from "./schema/types.js";

type AchraPresentationLocalState = Record<PropertyKey, never>;
type AchraPresentationPHState = PHBaseState & {
  global: AchraPresentationGlobalState;
  local: AchraPresentationLocalState;
};
type AchraPresentationDocument = PHDocument<AchraPresentationPHState>;

export * from "./schema/types.js";

export type {
  AchraPresentationGlobalState,
  AchraPresentationLocalState,
  AchraPresentationPHState,
  AchraPresentationAction,
  AchraPresentationDocument,
};
