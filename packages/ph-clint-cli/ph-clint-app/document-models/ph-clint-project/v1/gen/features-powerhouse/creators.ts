import { createAction } from 'document-model';
import { SetPowerhouseLevelInputSchema } from '../schema/zod.js';
import type { SetPowerhouseLevelInput } from '../types.js';
import type { SetPowerhouseLevelAction } from './actions.js';

export const setPowerhouseLevel = (input: SetPowerhouseLevelInput) => createAction<SetPowerhouseLevelAction>('SET_POWERHOUSE_LEVEL', { ...input }, undefined, SetPowerhouseLevelInputSchema, 'global');
