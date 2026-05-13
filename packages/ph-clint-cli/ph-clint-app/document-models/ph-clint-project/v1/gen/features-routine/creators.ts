/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { DisableRoutineInputSchema, EnableRoutineInputSchema } from '../schema/zod.js';
import type { DisableRoutineInput, EnableRoutineInput } from '../types.js';
import type { DisableRoutineAction, EnableRoutineAction } from './actions.js';

export const enableRoutine = (input: EnableRoutineInput) => createAction<EnableRoutineAction>('ENABLE_ROUTINE', { ...input }, undefined, EnableRoutineInputSchema, 'global');

export const disableRoutine = (input: DisableRoutineInput) => createAction<DisableRoutineAction>('DISABLE_ROUTINE', { ...input }, undefined, DisableRoutineInputSchema, 'global');
