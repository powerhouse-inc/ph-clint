import { generateMock } from "document-model";
import {
  addSystemMessage,
  AddSystemMessageInputSchema,
  endSession,
  EndSessionInputSchema,
  isChatSessionDocument,
  reducer,
  setAgentInfo,
  SetAgentInfoInputSchema,
  startSession,
  StartSessionInputSchema,
  updateUsageSummary,
  UpdateUsageSummaryInputSchema,
  utils,
} from "document-models/chat-session/v1";
import { describe, expect, it } from "vitest";

describe("SystemOperations", () => {
  it("should handle startSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(StartSessionInputSchema());

    const updatedDocument = reducer(document, startSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "START_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle endSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EndSessionInputSchema());

    const updatedDocument = reducer(document, endSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "END_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentInfoInputSchema());

    const updatedDocument = reducer(document, setAgentInfo(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSystemMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSystemMessageInputSchema());

    const updatedDocument = reducer(document, addSystemMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SYSTEM_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateUsageSummary operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateUsageSummaryInputSchema());

    const updatedDocument = reducer(document, updateUsageSummary(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_USAGE_SUMMARY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle startSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(StartSessionInputSchema());

    const updatedDocument = reducer(document, startSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "START_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle endSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EndSessionInputSchema());

    const updatedDocument = reducer(document, endSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "END_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentInfoInputSchema());

    const updatedDocument = reducer(document, setAgentInfo(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSystemMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSystemMessageInputSchema());

    const updatedDocument = reducer(document, addSystemMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SYSTEM_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateUsageSummary operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateUsageSummaryInputSchema());

    const updatedDocument = reducer(document, updateUsageSummary(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_USAGE_SUMMARY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle startSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(StartSessionInputSchema());

    const updatedDocument = reducer(document, startSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "START_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle endSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EndSessionInputSchema());

    const updatedDocument = reducer(document, endSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "END_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentInfoInputSchema());

    const updatedDocument = reducer(document, setAgentInfo(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSystemMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSystemMessageInputSchema());

    const updatedDocument = reducer(document, addSystemMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SYSTEM_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateUsageSummary operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateUsageSummaryInputSchema());

    const updatedDocument = reducer(document, updateUsageSummary(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_USAGE_SUMMARY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle startSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(StartSessionInputSchema());

    const updatedDocument = reducer(document, startSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "START_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle endSession operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EndSessionInputSchema());

    const updatedDocument = reducer(document, endSession(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "END_SESSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAgentInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAgentInfoInputSchema());

    const updatedDocument = reducer(document, setAgentInfo(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_AGENT_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addSystemMessage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSystemMessageInputSchema());

    const updatedDocument = reducer(document, addSystemMessage(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SYSTEM_MESSAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateUsageSummary operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateUsageSummaryInputSchema());

    const updatedDocument = reducer(document, updateUsageSummary(input));

    expect(isChatSessionDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_USAGE_SUMMARY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
