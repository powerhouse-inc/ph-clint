import { generateMock } from 'document-model';
import {
  addExternalSkill,
  AddExternalSkillInputSchema,
  isPhClintProjectDocument,
  reducer,
  removeExternalSkill,
  RemoveExternalSkillInputSchema,
  setExternalSkillGithubUrl,
  SetExternalSkillGithubUrlInputSchema,
  setExternalSkillName,
  SetExternalSkillNameInputSchema,
  utils,
} from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

describe('ExternalSkillsOperations', () => {
  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle addExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('ADD_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle removeExternalSkill operation', () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('REMOVE_EXTERNAL_SKILL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillName operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_NAME');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setExternalSkillGithubUrl operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_EXTERNAL_SKILL_GITHUB_URL');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  describe('ADD_EXTERNAL_SKILL', () => {
    it('adds a valid skill', () => {
      const doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'playwright-cli',
          githubUrl: 'https://github.com/example/playwright-cli',
        }),
      );
      expect(doc.operations.global[0].error).toBeUndefined();
      expect(doc.state.global.externalSkills).toEqual([
        {
          id: 'skill-1',
          name: 'playwright-cli',
          githubUrl: 'https://github.com/example/playwright-cli',
        },
      ]);
    });

    it('rejects an invalid (non kebab-case) name', () => {
      const doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'Bad-Skill',
          githubUrl: 'https://github.com/example/skill',
        }),
      );
      expect(doc.operations.global[0].error).toContain('Invalid skill name');
      expect(doc.state.global.externalSkills).toEqual([]);
    });

    it('rejects a duplicate id', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'first-skill',
          githubUrl: 'https://github.com/example/first',
        }),
      );
      doc = reducer(
        doc,
        addExternalSkill({
          id: 'skill-1',
          name: 'second-skill',
          githubUrl: 'https://github.com/example/second',
        }),
      );
      expect(doc.operations.global[1].error).toContain('Skill already exists');
      expect(doc.state.global.externalSkills).toHaveLength(1);
    });

    it('rejects a duplicate name', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'shared-name',
          githubUrl: 'https://github.com/example/first',
        }),
      );
      doc = reducer(
        doc,
        addExternalSkill({
          id: 'skill-2',
          name: 'shared-name',
          githubUrl: 'https://github.com/example/second',
        }),
      );
      expect(doc.operations.global[1].error).toContain('Skill already exists');
      expect(doc.state.global.externalSkills).toHaveLength(1);
    });
  });

  describe('REMOVE_EXTERNAL_SKILL', () => {
    it('removes an existing skill', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'playwright-cli',
          githubUrl: 'https://github.com/example/skill',
        }),
      );
      doc = reducer(doc, removeExternalSkill({ id: 'skill-1' }));
      expect(doc.operations.global[1].error).toBeUndefined();
      expect(doc.state.global.externalSkills).toEqual([]);
    });

    it('rejects removing a missing skill', () => {
      const doc = reducer(utils.createDocument(), removeExternalSkill({ id: 'missing' }));
      expect(doc.operations.global[0].error).toContain('Skill not found');
    });
  });

  describe('SET_EXTERNAL_SKILL_NAME', () => {
    it('renames an existing skill', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'old-name',
          githubUrl: 'https://github.com/example/skill',
        }),
      );
      doc = reducer(doc, setExternalSkillName({ id: 'skill-1', name: 'new-name' }));
      expect(doc.operations.global[1].error).toBeUndefined();
      expect(doc.state.global.externalSkills[0].name).toBe('new-name');
    });

    it('rejects renaming a missing skill', () => {
      const doc = reducer(utils.createDocument(), setExternalSkillName({ id: 'missing', name: 'new-name' }));
      expect(doc.operations.global[0].error).toContain('Skill not found');
    });

    it('rejects an invalid new name', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'old-name',
          githubUrl: 'https://github.com/example/skill',
        }),
      );
      doc = reducer(doc, setExternalSkillName({ id: 'skill-1', name: 'Bad Name' }));
      expect(doc.operations.global[1].error).toContain('Invalid skill name');
      expect(doc.state.global.externalSkills[0].name).toBe('old-name');
    });

    it('rejects a name already in use by another skill', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'first-name',
          githubUrl: 'https://github.com/example/first',
        }),
      );
      doc = reducer(
        doc,
        addExternalSkill({
          id: 'skill-2',
          name: 'second-name',
          githubUrl: 'https://github.com/example/second',
        }),
      );
      doc = reducer(doc, setExternalSkillName({ id: 'skill-2', name: 'first-name' }));
      expect(doc.operations.global[2].error).toContain('already in use');
      expect(doc.state.global.externalSkills[1].name).toBe('second-name');
    });

    it('allows renaming a skill to its own current name', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'same-name',
          githubUrl: 'https://github.com/example/skill',
        }),
      );
      doc = reducer(doc, setExternalSkillName({ id: 'skill-1', name: 'same-name' }));
      expect(doc.operations.global[1].error).toBeUndefined();
      expect(doc.state.global.externalSkills[0].name).toBe('same-name');
    });
  });

  describe('SET_EXTERNAL_SKILL_GITHUB_URL', () => {
    it('updates the github url of an existing skill', () => {
      let doc = reducer(
        utils.createDocument(),
        addExternalSkill({
          id: 'skill-1',
          name: 'a-skill',
          githubUrl: 'https://github.com/example/old',
        }),
      );
      doc = reducer(
        doc,
        setExternalSkillGithubUrl({
          id: 'skill-1',
          githubUrl: 'https://github.com/example/new',
        }),
      );
      expect(doc.operations.global[1].error).toBeUndefined();
      expect(doc.state.global.externalSkills[0].githubUrl).toBe('https://github.com/example/new');
    });

    it('rejects updating the url of a missing skill', () => {
      const doc = reducer(
        utils.createDocument(),
        setExternalSkillGithubUrl({
          id: 'missing',
          githubUrl: 'https://github.com/example/new',
        }),
      );
      expect(doc.operations.global[0].error).toContain('Skill not found');
    });
  });
});
