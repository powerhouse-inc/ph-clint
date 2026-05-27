/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { ClearMainAgentDescriptionInputSchema, ClearMainAgentImageInputSchema, SetMainAgentDescriptionInputSchema, SetMainAgentImageInputSchema, SetMainAgentNameInputSchema } from '../schema/zod.js';
import type { ClearMainAgentDescriptionInput, ClearMainAgentImageInput, SetMainAgentDescriptionInput, SetMainAgentImageInput, SetMainAgentNameInput } from '../types.js';
import type { ClearMainAgentDescriptionAction, ClearMainAgentImageAction, SetMainAgentDescriptionAction, SetMainAgentImageAction, SetMainAgentNameAction } from './actions.js';

export const setMainAgentName = (input: SetMainAgentNameInput) => createAction<SetMainAgentNameAction>('SET_MAIN_AGENT_NAME', { ...input }, undefined, SetMainAgentNameInputSchema, 'global');

export const setMainAgentDescription = (input: SetMainAgentDescriptionInput) => createAction<SetMainAgentDescriptionAction>('SET_MAIN_AGENT_DESCRIPTION', { ...input }, undefined, SetMainAgentDescriptionInputSchema, 'global');

export const clearMainAgentDescription = (input: ClearMainAgentDescriptionInput) => createAction<ClearMainAgentDescriptionAction>('CLEAR_MAIN_AGENT_DESCRIPTION', { ...input }, undefined, ClearMainAgentDescriptionInputSchema, 'global');

export const setMainAgentImage = (input: SetMainAgentImageInput) => createAction<SetMainAgentImageAction>('SET_MAIN_AGENT_IMAGE', { ...input }, undefined, SetMainAgentImageInputSchema, 'global');

export const clearMainAgentImage = (input: ClearMainAgentImageInput) => createAction<ClearMainAgentImageAction>('CLEAR_MAIN_AGENT_IMAGE', { ...input }, undefined, ClearMainAgentImageInputSchema, 'global');
