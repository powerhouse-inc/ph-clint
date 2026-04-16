import type { PhClintProjectIdentityAction } from "./identity/actions.js";
import type { PhClintProjectFeaturesPowerhouseAction } from "./features-powerhouse/actions.js";
import type { PhClintProjectFeaturesMastraAction } from "./features-mastra/actions.js";
import type { PhClintProjectFeaturesRoutineAction } from "./features-routine/actions.js";

export * from "./identity/actions.js";
export * from "./features-powerhouse/actions.js";
export * from "./features-mastra/actions.js";
export * from "./features-routine/actions.js";

export type PhClintProjectAction =
  | PhClintProjectIdentityAction
  | PhClintProjectFeaturesPowerhouseAction
  | PhClintProjectFeaturesMastraAction
  | PhClintProjectFeaturesRoutineAction;
