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
  agentProjectsDocumentType,
  isAgentProjectsDocument,
  assertIsAgentProjectsDocument,
  isAgentProjectsState,
  assertIsAgentProjectsState,
} from "@powerhousedao/agent-manager/document-models/agent-projects";
import { ZodError } from "zod";

describe("AgentProjects Document Model", () => {
  it("should create a new AgentProjects document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(agentProjectsDocumentType);
  });

  it("should create a new AgentProjects document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isAgentProjectsDocument(document)).toBe(true);
    expect(isAgentProjectsState(document.state)).toBe(true);
  });
  it("should reject a document that is not a AgentProjects document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsAgentProjectsDocument(wrongDocumentType)).toThrow();
      expect(isAgentProjectsDocument(wrongDocumentType)).toBe(false);
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
    expect(isAgentProjectsState(wrongState.state)).toBe(false);
    expect(assertIsAgentProjectsState(wrongState.state)).toThrow();
    expect(isAgentProjectsDocument(wrongState)).toBe(false);
    expect(assertIsAgentProjectsDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isAgentProjectsState(wrongInitialState.state)).toBe(false);
    expect(assertIsAgentProjectsState(wrongInitialState.state)).toThrow();
    expect(isAgentProjectsDocument(wrongInitialState)).toBe(false);
    expect(assertIsAgentProjectsDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isAgentProjectsDocument(missingIdInHeader)).toBe(false);
    expect(assertIsAgentProjectsDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isAgentProjectsDocument(missingNameInHeader)).toBe(false);
    expect(assertIsAgentProjectsDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isAgentProjectsDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsAgentProjectsDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isAgentProjectsDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsAgentProjectsDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
