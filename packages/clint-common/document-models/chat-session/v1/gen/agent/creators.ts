/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { AddAssistantMessageInputSchema, AppendAssistantContentInputSchema, FinishAssistantMessageInputSchema, SetMessageUsageInputSchema, UpdateAssistantContentInputSchema } from '../schema/zod.js';
import type { AddAssistantMessageInput, AppendAssistantContentInput, FinishAssistantMessageInput, SetMessageUsageInput, UpdateAssistantContentInput } from '../types.js';
import type { AddAssistantMessageAction, AppendAssistantContentAction, FinishAssistantMessageAction, SetMessageUsageAction, UpdateAssistantContentAction } from './actions.js';

export const addAssistantMessage = (input: AddAssistantMessageInput) => createAction<AddAssistantMessageAction>('ADD_ASSISTANT_MESSAGE', { ...input }, undefined, AddAssistantMessageInputSchema, 'global');

export const appendAssistantContent = (input: AppendAssistantContentInput) => createAction<AppendAssistantContentAction>('APPEND_ASSISTANT_CONTENT', { ...input }, undefined, AppendAssistantContentInputSchema, 'global');

export const updateAssistantContent = (input: UpdateAssistantContentInput) => createAction<UpdateAssistantContentAction>('UPDATE_ASSISTANT_CONTENT', { ...input }, undefined, UpdateAssistantContentInputSchema, 'global');

export const setMessageUsage = (input: SetMessageUsageInput) => createAction<SetMessageUsageAction>('SET_MESSAGE_USAGE', { ...input }, undefined, SetMessageUsageInputSchema, 'global');

export const finishAssistantMessage = (input: FinishAssistantMessageInput) => createAction<FinishAssistantMessageAction>('FINISH_ASSISTANT_MESSAGE', { ...input }, undefined, FinishAssistantMessageInputSchema, 'global');
