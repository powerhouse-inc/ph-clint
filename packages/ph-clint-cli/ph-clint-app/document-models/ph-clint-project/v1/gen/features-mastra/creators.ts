/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import {
  AddModelInputSchema,
  AddProfileInputSchema,
  ClearAgentImageInputSchema,
  DisableMastraInputSchema,
  EnableMastraInputSchema,
  RemoveModelInputSchema,
  RemoveProfileInputSchema,
  ReorderProfilesInputSchema,
  SetAgentDescriptionInputSchema,
  SetAgentIdInputSchema,
  SetAgentImageInputSchema,
  SetAgentNameInputSchema,
  SetDefaultModelInputSchema,
  SetEnableChatInputSchema,
  UpdateProfileInputSchema,
} from '../schema/zod.js';
import type {
  AddModelInput,
  AddProfileInput,
  ClearAgentImageInput,
  DisableMastraInput,
  EnableMastraInput,
  RemoveModelInput,
  RemoveProfileInput,
  ReorderProfilesInput,
  SetAgentDescriptionInput,
  SetAgentIdInput,
  SetAgentImageInput,
  SetAgentNameInput,
  SetDefaultModelInput,
  SetEnableChatInput,
  UpdateProfileInput,
} from '../types.js';
import type {
  AddModelAction,
  AddProfileAction,
  ClearAgentImageAction,
  DisableMastraAction,
  EnableMastraAction,
  RemoveModelAction,
  RemoveProfileAction,
  ReorderProfilesAction,
  SetAgentDescriptionAction,
  SetAgentIdAction,
  SetAgentImageAction,
  SetAgentNameAction,
  SetDefaultModelAction,
  SetEnableChatAction,
  UpdateProfileAction,
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

export const setAgentDescription = (input: SetAgentDescriptionInput) => createAction<SetAgentDescriptionAction>('SET_AGENT_DESCRIPTION', { ...input }, undefined, SetAgentDescriptionInputSchema, 'global');

export const setAgentImage = (input: SetAgentImageInput) => createAction<SetAgentImageAction>('SET_AGENT_IMAGE', { ...input }, undefined, SetAgentImageInputSchema, 'global');

export const clearAgentImage = (input: ClearAgentImageInput) => createAction<ClearAgentImageAction>('CLEAR_AGENT_IMAGE', { ...input }, undefined, ClearAgentImageInputSchema, 'global');

export const setEnableChat = (input: SetEnableChatInput) => createAction<SetEnableChatAction>('SET_ENABLE_CHAT', { ...input }, undefined, SetEnableChatInputSchema, 'global');
