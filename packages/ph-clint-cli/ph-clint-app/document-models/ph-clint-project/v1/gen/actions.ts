/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PhClintProjectDeploymentAction } from './deployment/actions.js';
import type { PhClintProjectExternalSkillsAction } from './external-skills/actions.js';
import type { PhClintProjectFeaturesMastraAction } from './features-mastra/actions.js';
import type { PhClintProjectFeaturesPowerhouseAction } from './features-powerhouse/actions.js';
import type { PhClintProjectFeaturesRoutineAction } from './features-routine/actions.js';
import type { PhClintProjectIdentityAction } from './identity/actions.js';
import type { PhClintProjectLifecycleAction } from './lifecycle/actions.js';
import type { PhClintProjectPowerhousePackagesAction } from './powerhouse-packages/actions.js';
import type { PhClintProjectPublishingAction } from './publishing/actions.js';

export * from './deployment/actions.js';
export * from './external-skills/actions.js';
export * from './features-mastra/actions.js';
export * from './features-powerhouse/actions.js';
export * from './features-routine/actions.js';
export * from './identity/actions.js';
export * from './lifecycle/actions.js';
export * from './powerhouse-packages/actions.js';
export * from './publishing/actions.js';

export type PhClintProjectAction =
  | PhClintProjectIdentityAction
  | PhClintProjectFeaturesPowerhouseAction
  | PhClintProjectFeaturesMastraAction
  | PhClintProjectFeaturesRoutineAction
  | PhClintProjectPowerhousePackagesAction
  | PhClintProjectExternalSkillsAction
  | PhClintProjectPublishingAction
  | PhClintProjectLifecycleAction
  | PhClintProjectDeploymentAction;
