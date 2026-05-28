/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import { ImportSpecInputSchema } from '../schema/zod.js';
import type { ImportSpecInput } from '../types.js';
import type { ImportSpecAction } from './actions.js';

export const importSpec = (input: ImportSpecInput) => createAction<ImportSpecAction>('IMPORT_SPEC', { ...input }, undefined, ImportSpecInputSchema, 'global');
