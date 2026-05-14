import { generateMock } from "document-model";
import {
  addSubAgent,
  AddSubAgentInputSchema,
  isPhClintProjectDocument,
  reducer,
  removeSubAgent,
  RemoveSubAgentInputSchema,
  setSubAgentDescription,
  SetSubAgentDescriptionInputSchema,
  setSubAgentName,
  SetSubAgentNameInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("MastraSubAgentsOperations", () => {
  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubAgentInputSchema());

    const updatedDocument = reducer(document, addSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSubAgent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubAgentInputSchema());

    const updatedDocument = reducer(document, removeSubAgent(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUB_AGENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentNameInputSchema());

    const updatedDocument = reducer(document, setSubAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setSubAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSubAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setSubAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SUB_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
