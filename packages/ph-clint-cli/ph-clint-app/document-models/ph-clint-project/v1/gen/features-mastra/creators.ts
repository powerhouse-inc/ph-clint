import { createAction } from 'document-model';
import {
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
} from '../schema/zod.js';
import type { EnableMastraInput, DisableMastraInput, SetAgentIdInput, SetAgentNameInput, AddModelInput, RemoveModelInput, SetDefaultModelInput, AddProfileInput, UpdateProfileInput, RemoveProfileInput, ReorderProfilesInput } from '../types.js';
import type {
  EnableMastraAction,
  DisableMastraAction,
  SetAgentIdAction,
  SetAgentNameAction,
  AddModelAction,
  RemoveModelAction,
  SetDefaultModelAction,
  AddProfileAction,
  UpdateProfileAction,
  RemoveProfileAction,
  ReorderProfilesAction,
} from './actions.js';

export const enableMastra = (input: EnableMastraInput) => createAction<EnableMastraAction>('ENABLE_MASTRA', { ...input }, undefined, EnableMastraInputSchema, 'global');

export const disableMastra = (input: DisableMastraInput) => createAction<DisableMastraAction>('DISABLE_MASTRA', { ...input }, undefined, DisableMastraInputSchema, 'global');

export const setAgentId = (input: SetAgentIdInput) => createAction<SetAgentIdAction>('SET_AGENT_ID', { ...input }, undefined, SetAgentIdInputSchema, 'global');

export const setAgentName = (input: SetAgentNameInput) => createAction<SetAgentNameAction>('SET_AGENT_NAME', { ...input }, undefined, SetAgentNameInputSchema, 'global');

export const addModel = (input: AddModelInput) => createAction<AddModelAction>('ADD_MODEL', { ...input }, undefined, AddModelInputSchema, 'global');

export const removeModel = (input: RemoveModelInput) => createAction<RemoveModelAction>('REMOVE_MODEL', { ...input }, undefined, RemoveModelInputSchema, 'global');

export const setDefaultModel = (input: SetDefaultModelInput) => createAction<SetDefaultModelAction>('SET_DEFAULT_MODEL', { ...input }, undefined, SetDefaultModelInputSchema, 'global');

export const addProfile = (input: AddProfileInput) => createAction<AddProfileAction>('ADD_PROFILE', { ...input }, undefined, AddProfileInputSchema, 'global');

export const updateProfile = (input: UpdateProfileInput) => createAction<UpdateProfileAction>('UPDATE_PROFILE', { ...input }, undefined, UpdateProfileInputSchema, 'global');

export const removeProfile = (input: RemoveProfileInput) => createAction<RemoveProfileAction>('REMOVE_PROFILE', { ...input }, undefined, RemoveProfileInputSchema, 'global');

export const reorderProfiles = (input: ReorderProfilesInput) => createAction<ReorderProfilesAction>('REORDER_PROFILES', { ...input }, undefined, ReorderProfilesInputSchema, 'global');
