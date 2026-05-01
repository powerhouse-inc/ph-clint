/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from 'document-model';
import { isDocumentAction, createReducer } from 'document-model';
import type { PhClintProjectPHState } from 'document-models/ph-clint-project/v1';

import { phClintProjectIdentityOperations } from '../src/reducers/identity.js';
import { phClintProjectFeaturesPowerhouseOperations } from '../src/reducers/features-powerhouse.js';
import { phClintProjectFeaturesMastraOperations } from '../src/reducers/features-mastra.js';
import { phClintProjectFeaturesRoutineOperations } from '../src/reducers/features-routine.js';
import { phClintProjectPowerhousePackagesOperations } from '../src/reducers/powerhouse-packages.js';
import { phClintProjectExternalSkillsOperations } from '../src/reducers/external-skills.js';
import { phClintProjectPublishingOperations } from '../src/reducers/publishing.js';
import { phClintProjectLifecycleOperations } from '../src/reducers/lifecycle.js';
import { phClintProjectDeploymentOperations } from '../src/reducers/deployment.js';

import {
  SetPackageNameInputSchema,
  ClearBinInputSchema,
  SetBinInputSchema,
  SetDescriptionInputSchema,
  SetVersionInputSchema,
  ClearScopeInputSchema,
  SetScopeInputSchema,
  SetPowerhouseLevelInputSchema,
  EnableMastraInputSchema,
  DisableMastraInputSchema,
  SetAgentIdInputSchema,
  SetAgentNameInputSchema,
  AddModelInputSchema,
  RemoveModelInputSchema,
  SetDefaultModelInputSchema,
  AddProfileInputSchema,
  UpdateProfileInputSchema,
  RemoveProfileInputSchema,
  ReorderProfilesInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentImageInputSchema,
  EnableRoutineInputSchema,
  DisableRoutineInputSchema,
  AddPowerhousePackageInputSchema,
  RemovePowerhousePackageInputSchema,
  AddPackageDocumentTypeInputSchema,
  RemovePackageDocumentTypeInputSchema,
  AddExternalSkillInputSchema,
  RemoveExternalSkillInputSchema,
  SetExternalSkillNameInputSchema,
  SetExternalSkillGithubUrlInputSchema,
  BumpVersionInputSchema,
  PublishDevInputSchema,
  PublishStagingInputSchema,
  PublishProductionInputSchema,
  SetPublishStatusInputSchema,
  ImportSpecInputSchema,
  AddSupportedResourceInputSchema,
  RemoveSupportedResourceInputSchema,
  SetProxyEnabledInputSchema,
} from './schema/zod.js';

const stateReducer: StateReducer<PhClintProjectPHState> = (state, action, dispatch) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case 'SET_PACKAGE_NAME': {
      SetPackageNameInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setPackageNameOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'CLEAR_BIN': {
      ClearBinInputSchema().parse(action.input);

      phClintProjectIdentityOperations.clearBinOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_BIN': {
      SetBinInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setBinOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_DESCRIPTION': {
      SetDescriptionInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_VERSION': {
      SetVersionInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setVersionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'CLEAR_SCOPE': {
      ClearScopeInputSchema().parse(action.input);

      phClintProjectIdentityOperations.clearScopeOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_SCOPE': {
      SetScopeInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setScopeOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_POWERHOUSE_LEVEL': {
      SetPowerhouseLevelInputSchema().parse(action.input);

      phClintProjectFeaturesPowerhouseOperations.setPowerhouseLevelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ENABLE_MASTRA': {
      EnableMastraInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.enableMastraOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'DISABLE_MASTRA': {
      DisableMastraInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.disableMastraOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_ID': {
      SetAgentIdInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setAgentIdOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_NAME': {
      SetAgentNameInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setAgentNameOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_MODEL': {
      AddModelInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.addModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_MODEL': {
      RemoveModelInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.removeModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_DEFAULT_MODEL': {
      SetDefaultModelInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setDefaultModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_PROFILE': {
      AddProfileInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.addProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'UPDATE_PROFILE': {
      UpdateProfileInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.updateProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_PROFILE': {
      RemoveProfileInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.removeProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REORDER_PROFILES': {
      ReorderProfilesInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.reorderProfilesOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_DESCRIPTION': {
      SetAgentDescriptionInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setAgentDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_IMAGE': {
      SetAgentImageInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setAgentImageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ENABLE_ROUTINE': {
      EnableRoutineInputSchema().parse(action.input);

      phClintProjectFeaturesRoutineOperations.enableRoutineOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'DISABLE_ROUTINE': {
      DisableRoutineInputSchema().parse(action.input);

      phClintProjectFeaturesRoutineOperations.disableRoutineOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_POWERHOUSE_PACKAGE': {
      AddPowerhousePackageInputSchema().parse(action.input);

      phClintProjectPowerhousePackagesOperations.addPowerhousePackageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_POWERHOUSE_PACKAGE': {
      RemovePowerhousePackageInputSchema().parse(action.input);

      phClintProjectPowerhousePackagesOperations.removePowerhousePackageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_PACKAGE_DOCUMENT_TYPE': {
      AddPackageDocumentTypeInputSchema().parse(action.input);

      phClintProjectPowerhousePackagesOperations.addPackageDocumentTypeOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_PACKAGE_DOCUMENT_TYPE': {
      RemovePackageDocumentTypeInputSchema().parse(action.input);

      phClintProjectPowerhousePackagesOperations.removePackageDocumentTypeOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_EXTERNAL_SKILL': {
      AddExternalSkillInputSchema().parse(action.input);

      phClintProjectExternalSkillsOperations.addExternalSkillOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_EXTERNAL_SKILL': {
      RemoveExternalSkillInputSchema().parse(action.input);

      phClintProjectExternalSkillsOperations.removeExternalSkillOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_EXTERNAL_SKILL_NAME': {
      SetExternalSkillNameInputSchema().parse(action.input);

      phClintProjectExternalSkillsOperations.setExternalSkillNameOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_EXTERNAL_SKILL_GITHUB_URL': {
      SetExternalSkillGithubUrlInputSchema().parse(action.input);

      phClintProjectExternalSkillsOperations.setExternalSkillGithubUrlOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'BUMP_VERSION': {
      BumpVersionInputSchema().parse(action.input);

      phClintProjectPublishingOperations.bumpVersionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'PUBLISH_DEV': {
      PublishDevInputSchema().parse(action.input);

      phClintProjectPublishingOperations.publishDevOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'PUBLISH_STAGING': {
      PublishStagingInputSchema().parse(action.input);

      phClintProjectPublishingOperations.publishStagingOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'PUBLISH_PRODUCTION': {
      PublishProductionInputSchema().parse(action.input);

      phClintProjectPublishingOperations.publishProductionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_PUBLISH_STATUS': {
      SetPublishStatusInputSchema().parse(action.input);

      phClintProjectPublishingOperations.setPublishStatusOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'IMPORT_SPEC': {
      ImportSpecInputSchema().parse(action.input);

      phClintProjectLifecycleOperations.importSpecOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_SUPPORTED_RESOURCE': {
      AddSupportedResourceInputSchema().parse(action.input);

      phClintProjectDeploymentOperations.addSupportedResourceOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_SUPPORTED_RESOURCE': {
      RemoveSupportedResourceInputSchema().parse(action.input);

      phClintProjectDeploymentOperations.removeSupportedResourceOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_PROXY_ENABLED': {
      SetProxyEnabledInputSchema().parse(action.input);

      phClintProjectDeploymentOperations.setProxyEnabledOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<PhClintProjectPHState> = createReducer(stateReducer);
