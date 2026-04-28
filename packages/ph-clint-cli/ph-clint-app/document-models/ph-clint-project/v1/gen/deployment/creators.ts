import { createAction } from 'document-model';
import { SetServiceAnnouncementInputSchema, AddSupportedResourceInputSchema, RemoveSupportedResourceInputSchema } from '../schema/zod.js';
import type { SetServiceAnnouncementInput, AddSupportedResourceInput, RemoveSupportedResourceInput } from '../types.js';
import type { SetServiceAnnouncementAction, AddSupportedResourceAction, RemoveSupportedResourceAction } from './actions.js';

export const setServiceAnnouncement = (input: SetServiceAnnouncementInput) => createAction<SetServiceAnnouncementAction>('SET_SERVICE_ANNOUNCEMENT', { ...input }, undefined, SetServiceAnnouncementInputSchema, 'global');

export const addSupportedResource = (input: AddSupportedResourceInput) => createAction<AddSupportedResourceAction>('ADD_SUPPORTED_RESOURCE', { ...input }, undefined, AddSupportedResourceInputSchema, 'global');

export const removeSupportedResource = (input: RemoveSupportedResourceInput) => createAction<RemoveSupportedResourceAction>('REMOVE_SUPPORTED_RESOURCE', { ...input }, undefined, RemoveSupportedResourceInputSchema, 'global');
