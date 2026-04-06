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
  agentInboxDocumentType,
  isAgentInboxDocument,
  assertIsAgentInboxDocument,
  isAgentInboxState,
  assertIsAgentInboxState,
} from "@powerhousedao/agent-manager/document-models/agent-inbox";
import { ZodError } from "zod";

describe("AgentInbox Document Model", () => {
  it("should create a new AgentInbox document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(agentInboxDocumentType);
  });

  it("should create a new AgentInbox document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isAgentInboxDocument(document)).toBe(true);
    expect(isAgentInboxState(document.state)).toBe(true);
  });
  it("should reject a document that is not a AgentInbox document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsAgentInboxDocument(wrongDocumentType)).toThrow();
      expect(isAgentInboxDocument(wrongDocumentType)).toBe(false);
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
    expect(isAgentInboxState(wrongState.state)).toBe(false);
    expect(assertIsAgentInboxState(wrongState.state)).toThrow();
    expect(isAgentInboxDocument(wrongState)).toBe(false);
    expect(assertIsAgentInboxDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isAgentInboxState(wrongInitialState.state)).toBe(false);
    expect(assertIsAgentInboxState(wrongInitialState.state)).toThrow();
    expect(isAgentInboxDocument(wrongInitialState)).toBe(false);
    expect(assertIsAgentInboxDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isAgentInboxDocument(missingIdInHeader)).toBe(false);
    expect(assertIsAgentInboxDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isAgentInboxDocument(missingNameInHeader)).toBe(false);
    expect(assertIsAgentInboxDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isAgentInboxDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsAgentInboxDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isAgentInboxDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsAgentInboxDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
