/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { baseActions } from 'document-model';
import {
  phClintProjectDeploymentActions,
  phClintProjectExternalSkillsActions,
  phClintProjectFeaturesMastraActions,
  phClintProjectFeaturesPowerhouseActions,
  phClintProjectFeaturesRoutineActions,
  phClintProjectIdentityActions,
  phClintProjectLifecycleActions,
  phClintProjectPowerhousePackagesActions,
  phClintProjectPublishingActions,
} from './gen/creators.js';

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
