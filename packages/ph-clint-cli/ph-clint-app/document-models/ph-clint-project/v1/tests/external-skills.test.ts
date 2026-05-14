import { generateMock } from "document-model";
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
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("ExternalSkillsOperations", () => {
  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddExternalSkillInputSchema());

    const updatedDocument = reducer(document, addExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeExternalSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveExternalSkillInputSchema());

    const updatedDocument = reducer(document, removeExternalSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_EXTERNAL_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillNameInputSchema());

    const updatedDocument = reducer(document, setExternalSkillName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setExternalSkillGithubUrl operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetExternalSkillGithubUrlInputSchema());

    const updatedDocument = reducer(document, setExternalSkillGithubUrl(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_EXTERNAL_SKILL_GITHUB_URL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
