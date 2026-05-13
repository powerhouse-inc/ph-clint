/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from 'document-model';
import type { PhClintProjectGlobalState } from '../types.js';
import type { AddSupportedResourceAction, RemoveSupportedResourceAction, SetObservabilityEnabledAction, SetProxyEnabledAction } from './actions.js';

export interface PhClintProjectDeploymentOperations {
  addSupportedResourceOperation: (state: PhClintProjectGlobalState, action: AddSupportedResourceAction, dispatch?: SignalDispatch) => void;
  removeSupportedResourceOperation: (state: PhClintProjectGlobalState, action: RemoveSupportedResourceAction, dispatch?: SignalDispatch) => void;
  setProxyEnabledOperation: (state: PhClintProjectGlobalState, action: SetProxyEnabledAction, dispatch?: SignalDispatch) => void;
  setObservabilityEnabledOperation: (state: PhClintProjectGlobalState, action: SetObservabilityEnabledAction, dispatch?: SignalDispatch) => void;
}
