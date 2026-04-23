import { createAction } from 'document-model';
import { AddExternalSkillInputSchema, RemoveExternalSkillInputSchema, SetExternalSkillNameInputSchema, SetExternalSkillGithubUrlInputSchema } from '../schema/zod.js';
import type { AddExternalSkillInput, RemoveExternalSkillInput, SetExternalSkillNameInput, SetExternalSkillGithubUrlInput } from '../types.js';
import type { AddExternalSkillAction, RemoveExternalSkillAction, SetExternalSkillNameAction, SetExternalSkillGithubUrlAction } from './actions.js';

export const addExternalSkill = (input: AddExternalSkillInput) => createAction<AddExternalSkillAction>('ADD_EXTERNAL_SKILL', { ...input }, undefined, AddExternalSkillInputSchema, 'global');

export const removeExternalSkill = (input: RemoveExternalSkillInput) => createAction<RemoveExternalSkillAction>('REMOVE_EXTERNAL_SKILL', { ...input }, undefined, RemoveExternalSkillInputSchema, 'global');

export const setExternalSkillName = (input: SetExternalSkillNameInput) => createAction<SetExternalSkillNameAction>('SET_EXTERNAL_SKILL_NAME', { ...input }, undefined, SetExternalSkillNameInputSchema, 'global');

export const setExternalSkillGithubUrl = (input: SetExternalSkillGithubUrlInput) => createAction<SetExternalSkillGithubUrlAction>('SET_EXTERNAL_SKILL_GITHUB_URL', { ...input }, undefined, SetExternalSkillGithubUrlInputSchema, 'global');
