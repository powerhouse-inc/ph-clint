import { type SignalDispatch } from 'document-model';
import type { ImportSpecAction } from './actions.js';
import type { PhClintProjectState } from '../types.js';

export interface PhClintProjectLifecycleOperations {
  importSpecOperation: (state: PhClintProjectState, action: ImportSpecAction, dispatch?: SignalDispatch) => void;
}
