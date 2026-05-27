/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { AddProfileInputSchema, RemoveProfileInputSchema, ReorderProfilesInputSchema, UpdateProfileInputSchema } from '../schema/zod.js';
import type { AddProfileInput, RemoveProfileInput, ReorderProfilesInput, UpdateProfileInput } from '../types.js';
import type { AddProfileAction, RemoveProfileAction, ReorderProfilesAction, UpdateProfileAction } from './actions.js';

export const addProfile = (input: AddProfileInput) => createAction<AddProfileAction>('ADD_PROFILE', { ...input }, undefined, AddProfileInputSchema, 'global');

export const updateProfile = (input: UpdateProfileInput) => createAction<UpdateProfileAction>('UPDATE_PROFILE', { ...input }, undefined, UpdateProfileInputSchema, 'global');

export const removeProfile = (input: RemoveProfileInput) => createAction<RemoveProfileAction>('REMOVE_PROFILE', { ...input }, undefined, RemoveProfileInputSchema, 'global');

export const reorderProfiles = (input: ReorderProfilesInput) => createAction<ReorderProfilesAction>('REORDER_PROFILES', { ...input }, undefined, ReorderProfilesInputSchema, 'global');
