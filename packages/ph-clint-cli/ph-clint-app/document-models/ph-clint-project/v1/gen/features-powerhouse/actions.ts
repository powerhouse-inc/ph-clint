import type { Action } from 'document-model';
import type { SetPowerhouseLevelInput } from '../types.js';

export type SetPowerhouseLevelAction = Action & {
  type: 'SET_POWERHOUSE_LEVEL';
  input: SetPowerhouseLevelInput;
};

export type PhClintProjectFeaturesPowerhouseAction = SetPowerhouseLevelAction;
