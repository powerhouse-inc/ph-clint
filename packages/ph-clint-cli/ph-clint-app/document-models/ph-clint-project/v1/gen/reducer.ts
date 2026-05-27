/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from 'document-model';
import { createReducer, isDocumentAction } from 'document-model';
import type { PhClintProjectPHState } from 'document-models/ph-clint-project/v1';

import { phClintProjectDeploymentOperations } from '../src/reducers/deployment.js';
import { phClintProjectExternalSkillsOperations } from '../src/reducers/external-skills.js';
import { phClintProjectFeaturesMastraOperations } from '../src/reducers/features-mastra.js';
import { phClintProjectFeaturesPowerhouseOperations } from '../src/reducers/features-powerhouse.js';
import { phClintProjectFeaturesRoutineOperations } from '../src/reducers/features-routine.js';
import { phClintProjectIdentityOperations } from '../src/reducers/identity.js';
import { phClintProjectLifecycleOperations } from '../src/reducers/lifecycle.js';
import { phClintProjectMastraAgentBindingsOperations } from '../src/reducers/mastra-agent-bindings.js';
import { phClintProjectMastraMainAgentOperations } from '../src/reducers/mastra-main-agent.js';
import { phClintProjectMastraModelsOperations } from '../src/reducers/mastra-models.js';
import { phClintProjectMastraProfilesOperations } from '../src/reducers/mastra-profiles.js';
import { phClintProjectMastraSubAgentsOperations } from '../src/reducers/mastra-sub-agents.js';
import { phClintProjectPowerhousePackagesOperations } from '../src/reducers/powerhouse-packages.js';
import { phClintProjectPublishingOperations } from '../src/reducers/publishing.js';

import {
  AddAgentProfileRefInputSchema,
  AddAgentSkillInputSchema,
  AddAgentToolPatternInputSchema,
  AddExternalSkillInputSchema,
  AddModelInputSchema,
  AddPackageDocumentTypeInputSchema,
  AddPowerhousePackageInputSchema,
  AddProfileInputSchema,
  AddSubAgentInputSchema,
  AddSupportedResourceInputSchema,
  BumpVersionInputSchema,
  ClearMainAgentDescriptionInputSchema,
  ClearMainAgentImageInputSchema,
  DisableMastraInputSchema,
  DisableRoutineInputSchema,
  EnableMastraInputSchema,
  EnableRoutineInputSchema,
  ImportSpecInputSchema,
  PublishDevInputSchema,
  PublishProductionInputSchema,
  PublishStagingInputSchema,
  RemoveAgentProfileRefInputSchema,
  RemoveAgentSkillInputSchema,
  RemoveAgentToolPatternInputSchema,
  RemoveExternalSkillInputSchema,
  RemoveModelInputSchema,
  RemovePackageDocumentTypeInputSchema,
  RemovePowerhousePackageInputSchema,
  RemoveProfileInputSchema,
  RemoveSubAgentInputSchema,
  RemoveSupportedResourceInputSchema,
  ReorderAgentProfileRefsInputSchema,
  ReorderProfilesInputSchema,
  SetAgentModelInputSchema,
  SetDescriptionInputSchema,
  SetEnableChatInputSchema,
  SetExternalSkillGithubUrlInputSchema,
  SetExternalSkillNameInputSchema,
  SetMainAgentDescriptionInputSchema,
  SetMainAgentImageInputSchema,
  SetMainAgentNameInputSchema,
  SetObservabilityEnabledInputSchema,
  SetPackageIdentifierInputSchema,
  SetPackageVersionInputSchema,
  SetPowerhouseLevelInputSchema,
  SetProxyEnabledInputSchema,
  SetPublishStatusInputSchema,
  SetSubAgentDescriptionInputSchema,
  SetSubAgentNameInputSchema,
  SetVersionInputSchema,
  UpdateProfileInputSchema,
} from './schema/zod.js';

const stateReducer: StateReducer<PhClintProjectPHState> = (state, action, dispatch) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
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

    case 'SET_PACKAGE_IDENTIFIER': {
      SetPackageIdentifierInputSchema().parse(action.input);

      phClintProjectIdentityOperations.setPackageIdentifierOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_POWERHOUSE_LEVEL': {
      SetPowerhouseLevelInputSchema().parse(action.input);

      phClintProjectFeaturesPowerhouseOperations.setPowerhouseLevelOperation((state as any)[action.scope], action as any, dispatch);

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

    case 'SET_PACKAGE_VERSION': {
      SetPackageVersionInputSchema().parse(action.input);

      phClintProjectPowerhousePackagesOperations.setPackageVersionOperation((state as any)[action.scope], action as any, dispatch);

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

    case 'SET_OBSERVABILITY_ENABLED': {
      SetObservabilityEnabledInputSchema().parse(action.input);

      phClintProjectDeploymentOperations.setObservabilityEnabledOperation((state as any)[action.scope], action as any, dispatch);

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

    case 'SET_ENABLE_CHAT': {
      SetEnableChatInputSchema().parse(action.input);

      phClintProjectFeaturesMastraOperations.setEnableChatOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_MODEL': {
      AddModelInputSchema().parse(action.input);

      phClintProjectMastraModelsOperations.addModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_MODEL': {
      RemoveModelInputSchema().parse(action.input);

      phClintProjectMastraModelsOperations.removeModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_PROFILE': {
      AddProfileInputSchema().parse(action.input);

      phClintProjectMastraProfilesOperations.addProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'UPDATE_PROFILE': {
      UpdateProfileInputSchema().parse(action.input);

      phClintProjectMastraProfilesOperations.updateProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_PROFILE': {
      RemoveProfileInputSchema().parse(action.input);

      phClintProjectMastraProfilesOperations.removeProfileOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REORDER_PROFILES': {
      ReorderProfilesInputSchema().parse(action.input);

      phClintProjectMastraProfilesOperations.reorderProfilesOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_MAIN_AGENT_NAME': {
      SetMainAgentNameInputSchema().parse(action.input);

      phClintProjectMastraMainAgentOperations.setMainAgentNameOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_MAIN_AGENT_DESCRIPTION': {
      SetMainAgentDescriptionInputSchema().parse(action.input);

      phClintProjectMastraMainAgentOperations.setMainAgentDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'CLEAR_MAIN_AGENT_DESCRIPTION': {
      ClearMainAgentDescriptionInputSchema().parse(action.input);

      phClintProjectMastraMainAgentOperations.clearMainAgentDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_MAIN_AGENT_IMAGE': {
      SetMainAgentImageInputSchema().parse(action.input);

      phClintProjectMastraMainAgentOperations.setMainAgentImageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'CLEAR_MAIN_AGENT_IMAGE': {
      ClearMainAgentImageInputSchema().parse(action.input);

      phClintProjectMastraMainAgentOperations.clearMainAgentImageOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_SUB_AGENT': {
      AddSubAgentInputSchema().parse(action.input);

      phClintProjectMastraSubAgentsOperations.addSubAgentOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_SUB_AGENT': {
      RemoveSubAgentInputSchema().parse(action.input);

      phClintProjectMastraSubAgentsOperations.removeSubAgentOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_SUB_AGENT_NAME': {
      SetSubAgentNameInputSchema().parse(action.input);

      phClintProjectMastraSubAgentsOperations.setSubAgentNameOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_SUB_AGENT_DESCRIPTION': {
      SetSubAgentDescriptionInputSchema().parse(action.input);

      phClintProjectMastraSubAgentsOperations.setSubAgentDescriptionOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'SET_AGENT_MODEL': {
      SetAgentModelInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.setAgentModelOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_AGENT_PROFILE_REF': {
      AddAgentProfileRefInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.addAgentProfileRefOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_AGENT_PROFILE_REF': {
      RemoveAgentProfileRefInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.removeAgentProfileRefOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REORDER_AGENT_PROFILE_REFS': {
      ReorderAgentProfileRefsInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.reorderAgentProfileRefsOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_AGENT_SKILL': {
      AddAgentSkillInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.addAgentSkillOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_AGENT_SKILL': {
      RemoveAgentSkillInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.removeAgentSkillOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'ADD_AGENT_TOOL_PATTERN': {
      AddAgentToolPatternInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.addAgentToolPatternOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    case 'REMOVE_AGENT_TOOL_PATTERN': {
      RemoveAgentToolPatternInputSchema().parse(action.input);

      phClintProjectMastraAgentBindingsOperations.removeAgentToolPatternOperation((state as any)[action.scope], action as any, dispatch);

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<PhClintProjectPHState> = createReducer(stateReducer);
