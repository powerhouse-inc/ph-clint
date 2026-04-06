import type { PHDocument, PHBaseState } from "document-model";
import type { WorkBreakdownStructureAction } from "./actions.js";
import type { WorkBreakdownStructureState as WorkBreakdownStructureGlobalState } from "./schema/types.js";

type WorkBreakdownStructureLocalState = Record<PropertyKey, never>;

type WorkBreakdownStructurePHState = PHBaseState & {
  global: WorkBreakdownStructureGlobalState;
  local: WorkBreakdownStructureLocalState;
};
type WorkBreakdownStructureDocument = PHDocument<WorkBreakdownStructurePHState>;

export * from "./schema/types.js";

export type {
  WorkBreakdownStructureGlobalState,
  WorkBreakdownStructureLocalState,
  WorkBreakdownStructurePHState,
  WorkBreakdownStructureAction,
  WorkBreakdownStructureDocument,
};
