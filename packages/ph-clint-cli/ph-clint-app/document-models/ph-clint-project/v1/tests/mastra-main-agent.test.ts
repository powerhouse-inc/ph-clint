import { generateMock } from "document-model";
import {
  clearMainAgentDescription,
  ClearMainAgentDescriptionInputSchema,
  clearMainAgentImage,
  ClearMainAgentImageInputSchema,
  isPhClintProjectDocument,
  reducer,
  setMainAgentDescription,
  SetMainAgentDescriptionInputSchema,
  setMainAgentImage,
  SetMainAgentImageInputSchema,
  setMainAgentName,
  SetMainAgentNameInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("MastraMainAgentOperations", () => {
  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentNameInputSchema());

    const updatedDocument = reducer(document, setMainAgentName(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, setMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentDescription operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentDescriptionInputSchema());

    const updatedDocument = reducer(document, clearMainAgentDescription(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_DESCRIPTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetMainAgentImageInputSchema());

    const updatedDocument = reducer(document, setMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle clearMainAgentImage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ClearMainAgentImageInputSchema());

    const updatedDocument = reducer(document, clearMainAgentImage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "CLEAR_MAIN_AGENT_IMAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
