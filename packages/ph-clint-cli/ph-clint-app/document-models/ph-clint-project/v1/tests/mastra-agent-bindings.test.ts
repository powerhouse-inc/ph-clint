import { generateMock } from "document-model";
import {
  addAgentProfileRef,
  AddAgentProfileRefInputSchema,
  addAgentSkill,
  AddAgentSkillInputSchema,
  addAgentToolPattern,
  AddAgentToolPatternInputSchema,
  isPhClintProjectDocument,
  reducer,
  removeAgentProfileRef,
  RemoveAgentProfileRefInputSchema,
  removeAgentSkill,
  RemoveAgentSkillInputSchema,
  removeAgentToolPattern,
  RemoveAgentToolPatternInputSchema,
  reorderAgentProfileRefs,
  ReorderAgentProfileRefsInputSchema,
  setAgentModel,
  SetAgentModelInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("MastraAgentBindingsOperations", () => {
  it("should handle setAgentModel operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentModelInputSchema());

    const updatedDocument = reducer(document, setAgentModel(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_MODEL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, addAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, removeAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderAgentProfileRefs operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderAgentProfileRefsInputSchema());

    const updatedDocument = reducer(document, reorderAgentProfileRefs(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_AGENT_PROFILE_REFS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentModel operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentModelInputSchema());

    const updatedDocument = reducer(document, setAgentModel(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_MODEL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, addAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, removeAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderAgentProfileRefs operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderAgentProfileRefsInputSchema());

    const updatedDocument = reducer(document, reorderAgentProfileRefs(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_AGENT_PROFILE_REFS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentSkillInputSchema());

    const updatedDocument = reducer(document, addAgentSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentSkillInputSchema());

    const updatedDocument = reducer(document, removeAgentSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentToolPattern operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentToolPatternInputSchema());

    const updatedDocument = reducer(document, addAgentToolPattern(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_TOOL_PATTERN",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentToolPattern operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentToolPatternInputSchema());

    const updatedDocument = reducer(document, removeAgentToolPattern(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_TOOL_PATTERN",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentModel operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentModelInputSchema());

    const updatedDocument = reducer(document, setAgentModel(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_MODEL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, addAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentProfileRef operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentProfileRefInputSchema());

    const updatedDocument = reducer(document, removeAgentProfileRef(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_PROFILE_REF",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderAgentProfileRefs operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderAgentProfileRefsInputSchema());

    const updatedDocument = reducer(document, reorderAgentProfileRefs(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_AGENT_PROFILE_REFS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentSkillInputSchema());

    const updatedDocument = reducer(document, addAgentSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentSkill operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentSkillInputSchema());

    const updatedDocument = reducer(document, removeAgentSkill(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_SKILL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addAgentToolPattern operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAgentToolPatternInputSchema());

    const updatedDocument = reducer(document, addAgentToolPattern(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_AGENT_TOOL_PATTERN",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeAgentToolPattern operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveAgentToolPatternInputSchema());

    const updatedDocument = reducer(document, removeAgentToolPattern(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_AGENT_TOOL_PATTERN",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
