import type { Action } from 'document-model';
import type { SetServiceAnnouncementInput, AddSupportedResourceInput, RemoveSupportedResourceInput } from '../types.js';

export type SetServiceAnnouncementAction = Action & {
  type: 'SET_SERVICE_ANNOUNCEMENT';
  input: SetServiceAnnouncementInput;
};
export type AddSupportedResourceAction = Action & {
  type: 'ADD_SUPPORTED_RESOURCE';
  input: AddSupportedResourceInput;
};
export type RemoveSupportedResourceAction = Action & {
  type: 'REMOVE_SUPPORTED_RESOURCE';
  input: RemoveSupportedResourceInput;
};

export type PhClintProjectDeploymentAction = SetServiceAnnouncementAction | AddSupportedResourceAction | RemoveSupportedResourceAction;
