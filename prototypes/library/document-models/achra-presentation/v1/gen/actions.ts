import type { AchraPresentationCoreAction } from "./core/actions.js";
import type { AchraPresentationTitleBrandingAction } from "./title-branding/actions.js";
import type { AchraPresentationStructureFlowAction } from "./structure-flow/actions.js";
import type { AchraPresentationTextListsAction } from "./text-lists/actions.js";

export * from "./core/actions.js";
export * from "./title-branding/actions.js";
export * from "./structure-flow/actions.js";
export * from "./text-lists/actions.js";

export type AchraPresentationAction =
  | AchraPresentationCoreAction
  | AchraPresentationTitleBrandingAction
  | AchraPresentationStructureFlowAction
  | AchraPresentationTextListsAction;
