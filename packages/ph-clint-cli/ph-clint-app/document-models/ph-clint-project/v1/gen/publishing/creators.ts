/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { BumpVersionInputSchema, PublishDevInputSchema, PublishProductionInputSchema, PublishStagingInputSchema, SetPublishStatusInputSchema } from '../schema/zod.js';
import type { BumpVersionInput, PublishDevInput, PublishProductionInput, PublishStagingInput, SetPublishStatusInput } from '../types.js';
import type { BumpVersionAction, PublishDevAction, PublishProductionAction, PublishStagingAction, SetPublishStatusAction } from './actions.js';

export const bumpVersion = (input: BumpVersionInput) => createAction<BumpVersionAction>('BUMP_VERSION', { ...input }, undefined, BumpVersionInputSchema, 'global');

export const publishDev = (input: PublishDevInput) => createAction<PublishDevAction>('PUBLISH_DEV', { ...input }, undefined, PublishDevInputSchema, 'global');

export const publishStaging = (input: PublishStagingInput) => createAction<PublishStagingAction>('PUBLISH_STAGING', { ...input }, undefined, PublishStagingInputSchema, 'global');

export const publishProduction = (input: PublishProductionInput) => createAction<PublishProductionAction>('PUBLISH_PRODUCTION', { ...input }, undefined, PublishProductionInputSchema, 'global');

export const setPublishStatus = (input: SetPublishStatusInput) => createAction<SetPublishStatusAction>('SET_PUBLISH_STATUS', { ...input }, undefined, SetPublishStatusInputSchema, 'global');
