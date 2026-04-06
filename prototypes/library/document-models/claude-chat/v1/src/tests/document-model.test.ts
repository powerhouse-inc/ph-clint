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
  claudeChatDocumentType,
  isClaudeChatDocument,
  assertIsClaudeChatDocument,
  isClaudeChatState,
  assertIsClaudeChatState,
} from "@powerhousedao/agent-manager/document-models/claude-chat";
import { ZodError } from "zod";

describe("ClaudeChat Document Model", () => {
  it("should create a new ClaudeChat document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(claudeChatDocumentType);
  });

  it("should create a new ClaudeChat document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isClaudeChatDocument(document)).toBe(true);
    expect(isClaudeChatState(document.state)).toBe(true);
  });
  it("should reject a document that is not a ClaudeChat document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsClaudeChatDocument(wrongDocumentType)).toThrow();
      expect(isClaudeChatDocument(wrongDocumentType)).toBe(false);
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
    expect(isClaudeChatState(wrongState.state)).toBe(false);
    expect(assertIsClaudeChatState(wrongState.state)).toThrow();
    expect(isClaudeChatDocument(wrongState)).toBe(false);
    expect(assertIsClaudeChatDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isClaudeChatState(wrongInitialState.state)).toBe(false);
    expect(assertIsClaudeChatState(wrongInitialState.state)).toThrow();
    expect(isClaudeChatDocument(wrongInitialState)).toBe(false);
    expect(assertIsClaudeChatDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isClaudeChatDocument(missingIdInHeader)).toBe(false);
    expect(assertIsClaudeChatDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isClaudeChatDocument(missingNameInHeader)).toBe(false);
    expect(assertIsClaudeChatDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isClaudeChatDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsClaudeChatDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isClaudeChatDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsClaudeChatDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
