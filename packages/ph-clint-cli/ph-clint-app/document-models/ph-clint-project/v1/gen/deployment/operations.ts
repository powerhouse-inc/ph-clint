import { type SignalDispatch } from 'document-model';
import type { SetServiceAnnouncementAction, AddSupportedResourceAction, RemoveSupportedResourceAction } from './actions.js';
import type { PhClintProjectState } from '../types.js';

export interface PhClintProjectDeploymentOperations {
  setServiceAnnouncementOperation: (state: PhClintProjectState, action: SetServiceAnnouncementAction, dispatch?: SignalDispatch) => void;
  addSupportedResourceOperation: (state: PhClintProjectState, action: AddSupportedResourceAction, dispatch?: SignalDispatch) => void;
  removeSupportedResourceOperation: (state: PhClintProjectState, action: RemoveSupportedResourceAction, dispatch?: SignalDispatch) => void;
}
