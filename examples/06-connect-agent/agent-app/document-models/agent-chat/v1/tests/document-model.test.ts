/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import {
  utils,
  initialGlobalState,
  initialLocalState,
  agentChatDocumentType,
  isAgentChatDocument,
  assertIsAgentChatDocument,
  isAgentChatState,
  assertIsAgentChatState,
} from "document-models/agent-chat/v1";
import { ZodError } from "zod";

describe("AgentChat Document Model", () => {
  it("should create a new AgentChat document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(agentChatDocumentType);
  });

  it("should create a new AgentChat document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isAgentChatDocument(document)).toBe(true);
    expect(isAgentChatState(document.state)).toBe(true);
  });
  it("should reject a document that is not a AgentChat document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsAgentChatDocument(wrongDocumentType)).toThrow();
      expect(isAgentChatDocument(wrongDocumentType)).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
  const wrongState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongState.state.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isAgentChatState(wrongState.state)).toBe(false);
    expect(assertIsAgentChatState(wrongState.state)).toThrow();
    expect(isAgentChatDocument(wrongState)).toBe(false);
    expect(assertIsAgentChatDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isAgentChatState(wrongInitialState.state)).toBe(false);
    expect(assertIsAgentChatState(wrongInitialState.state)).toThrow();
    expect(isAgentChatDocument(wrongInitialState)).toBe(false);
    expect(assertIsAgentChatDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isAgentChatDocument(missingIdInHeader)).toBe(false);
    expect(assertIsAgentChatDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isAgentChatDocument(missingNameInHeader)).toBe(false);
    expect(assertIsAgentChatDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isAgentChatDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsAgentChatDocument(missingCreatedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isAgentChatDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsAgentChatDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
