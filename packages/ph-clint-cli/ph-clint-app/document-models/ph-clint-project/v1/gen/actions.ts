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
import type { PhClintProjectMastraAgentBindingsAction } from './mastra-agent-bindings/actions.js';
import type { PhClintProjectMastraMainAgentAction } from './mastra-main-agent/actions.js';
import type { PhClintProjectMastraModelsAction } from './mastra-models/actions.js';
import type { PhClintProjectMastraProfilesAction } from './mastra-profiles/actions.js';
import type { PhClintProjectMastraSubAgentsAction } from './mastra-sub-agents/actions.js';
import type { PhClintProjectPowerhousePackagesAction } from './powerhouse-packages/actions.js';
import type { PhClintProjectPublishingAction } from './publishing/actions.js';

export * from './deployment/actions.js';
export * from './external-skills/actions.js';
export * from './features-mastra/actions.js';
export * from './features-powerhouse/actions.js';
export * from './features-routine/actions.js';
export * from './identity/actions.js';
export * from './lifecycle/actions.js';
export * from './mastra-agent-bindings/actions.js';
export * from './mastra-main-agent/actions.js';
export * from './mastra-models/actions.js';
export * from './mastra-profiles/actions.js';
export * from './mastra-sub-agents/actions.js';
export * from './powerhouse-packages/actions.js';
export * from './publishing/actions.js';

export type PhClintProjectAction =
  | PhClintProjectIdentityAction
  | PhClintProjectFeaturesPowerhouseAction
  | PhClintProjectFeaturesRoutineAction
  | PhClintProjectPowerhousePackagesAction
  | PhClintProjectExternalSkillsAction
  | PhClintProjectPublishingAction
  | PhClintProjectLifecycleAction
  | PhClintProjectDeploymentAction
  | PhClintProjectFeaturesMastraAction
  | PhClintProjectMastraModelsAction
  | PhClintProjectMastraProfilesAction
  | PhClintProjectMastraMainAgentAction
  | PhClintProjectMastraSubAgentsAction
  | PhClintProjectMastraAgentBindingsAction;
