/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from 'document-model';
import {
  AddAgentProfileRefInputSchema,
  AddAgentSkillInputSchema,
  AddAgentToolPatternInputSchema,
  RemoveAgentProfileRefInputSchema,
  RemoveAgentSkillInputSchema,
  RemoveAgentToolPatternInputSchema,
  ReorderAgentProfileRefsInputSchema,
  SetAgentModelInputSchema,
} from '../schema/zod.js';
import type { AddAgentProfileRefInput, AddAgentSkillInput, AddAgentToolPatternInput, RemoveAgentProfileRefInput, RemoveAgentSkillInput, RemoveAgentToolPatternInput, ReorderAgentProfileRefsInput, SetAgentModelInput } from '../types.js';
import type { AddAgentProfileRefAction, AddAgentSkillAction, AddAgentToolPatternAction, RemoveAgentProfileRefAction, RemoveAgentSkillAction, RemoveAgentToolPatternAction, ReorderAgentProfileRefsAction, SetAgentModelAction } from './actions.js';

export const setAgentModel = (input: SetAgentModelInput) => createAction<SetAgentModelAction>('SET_AGENT_MODEL', { ...input }, undefined, SetAgentModelInputSchema, 'global');

export const addAgentProfileRef = (input: AddAgentProfileRefInput) => createAction<AddAgentProfileRefAction>('ADD_AGENT_PROFILE_REF', { ...input }, undefined, AddAgentProfileRefInputSchema, 'global');

export const removeAgentProfileRef = (input: RemoveAgentProfileRefInput) => createAction<RemoveAgentProfileRefAction>('REMOVE_AGENT_PROFILE_REF', { ...input }, undefined, RemoveAgentProfileRefInputSchema, 'global');

export const reorderAgentProfileRefs = (input: ReorderAgentProfileRefsInput) => createAction<ReorderAgentProfileRefsAction>('REORDER_AGENT_PROFILE_REFS', { ...input }, undefined, ReorderAgentProfileRefsInputSchema, 'global');

export const addAgentSkill = (input: AddAgentSkillInput) => createAction<AddAgentSkillAction>('ADD_AGENT_SKILL', { ...input }, undefined, AddAgentSkillInputSchema, 'global');

export const removeAgentSkill = (input: RemoveAgentSkillInput) => createAction<RemoveAgentSkillAction>('REMOVE_AGENT_SKILL', { ...input }, undefined, RemoveAgentSkillInputSchema, 'global');

export const addAgentToolPattern = (input: AddAgentToolPatternInput) => createAction<AddAgentToolPatternAction>('ADD_AGENT_TOOL_PATTERN', { ...input }, undefined, AddAgentToolPatternInputSchema, 'global');

export const removeAgentToolPattern = (input: RemoveAgentToolPatternInput) => createAction<RemoveAgentToolPatternAction>('REMOVE_AGENT_TOOL_PATTERN', { ...input }, undefined, RemoveAgentToolPatternInputSchema, 'global');
