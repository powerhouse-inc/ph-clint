import type { WorkBreakdownStructureDocumentationAction } from "./documentation/actions.js";
import type { WorkBreakdownStructureHierarchyAction } from "./hierarchy/actions.js";
import type { WorkBreakdownStructureWorkflowAction } from "./workflow/actions.js";
import type { WorkBreakdownStructureMetadataAction } from "./metadata/actions.js";

export * from "./documentation/actions.js";
export * from "./hierarchy/actions.js";
export * from "./workflow/actions.js";
export * from "./metadata/actions.js";

export type WorkBreakdownStructureAction =
  | WorkBreakdownStructureDocumentationAction
  | WorkBreakdownStructureHierarchyAction
  | WorkBreakdownStructureWorkflowAction
  | WorkBreakdownStructureMetadataAction;
