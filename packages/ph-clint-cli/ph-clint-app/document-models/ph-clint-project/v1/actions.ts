/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { baseActions } from "document-model";
import {
  phClintProjectDeploymentActions,
  phClintProjectExternalSkillsActions,
  phClintProjectFeaturesMastraActions,
  phClintProjectFeaturesPowerhouseActions,
  phClintProjectFeaturesRoutineActions,
  phClintProjectIdentityActions,
  phClintProjectLifecycleActions,
  phClintProjectMastraAgentBindingsActions,
  phClintProjectMastraMainAgentActions,
  phClintProjectMastraModelsActions,
  phClintProjectMastraProfilesActions,
  phClintProjectMastraSubAgentsActions,
  phClintProjectPowerhousePackagesActions,
  phClintProjectPublishingActions,
} from "./gen/creators.js";

/** Actions for the PhClintProject document model */

export const actions = {
  ...baseActions,
  ...phClintProjectIdentityActions,
  ...phClintProjectFeaturesPowerhouseActions,
  ...phClintProjectFeaturesRoutineActions,
  ...phClintProjectPowerhousePackagesActions,
  ...phClintProjectExternalSkillsActions,
  ...phClintProjectPublishingActions,
  ...phClintProjectLifecycleActions,
  ...phClintProjectDeploymentActions,
  ...phClintProjectFeaturesMastraActions,
  ...phClintProjectMastraModelsActions,
  ...phClintProjectMastraProfilesActions,
  ...phClintProjectMastraMainAgentActions,
  ...phClintProjectMastraSubAgentsActions,
  ...phClintProjectMastraAgentBindingsActions,
};
