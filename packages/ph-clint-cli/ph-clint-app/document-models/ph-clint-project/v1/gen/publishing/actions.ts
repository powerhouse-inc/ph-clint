/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from 'document-model';
import type { BumpVersionInput, PublishDevInput, PublishProductionInput, PublishStagingInput, SetPublishStatusInput } from '../types.js';

export type BumpVersionAction = Action & {
  type: 'BUMP_VERSION';
  input: BumpVersionInput;
};
export type PublishDevAction = Action & {
  type: 'PUBLISH_DEV';
  input: PublishDevInput;
};
export type PublishStagingAction = Action & {
  type: 'PUBLISH_STAGING';
  input: PublishStagingInput;
};
export type PublishProductionAction = Action & {
  type: 'PUBLISH_PRODUCTION';
  input: PublishProductionInput;
};
export type SetPublishStatusAction = Action & {
  type: 'SET_PUBLISH_STATUS';
  input: SetPublishStatusInput;
};

export type PhClintProjectPublishingAction = BumpVersionAction | PublishDevAction | PublishStagingAction | PublishProductionAction | SetPublishStatusAction;
