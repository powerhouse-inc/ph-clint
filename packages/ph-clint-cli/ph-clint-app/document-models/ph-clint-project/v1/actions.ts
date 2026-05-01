import { baseActions } from "document-model";
import {
  phClintProjectIdentityActions,
  phClintProjectFeaturesPowerhouseActions,
  phClintProjectFeaturesMastraActions,
  phClintProjectFeaturesRoutineActions,
  phClintProjectPowerhousePackagesActions,
  phClintProjectExternalSkillsActions,
  phClintProjectPublishingActions,
  phClintProjectLifecycleActions,
  phClintProjectDeploymentActions,
} from "./gen/creators.js";

/** Actions for the PhClintProject document model */

export const actions = {
  ...baseActions,
  ...phClintProjectIdentityActions,
  ...phClintProjectFeaturesPowerhouseActions,
  ...phClintProjectFeaturesMastraActions,
  ...phClintProjectFeaturesRoutineActions,
  ...phClintProjectPowerhousePackagesActions,
  ...phClintProjectExternalSkillsActions,
  ...phClintProjectPublishingActions,
  ...phClintProjectLifecycleActions,
  ...phClintProjectDeploymentActions,
};
