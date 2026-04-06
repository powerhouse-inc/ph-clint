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
  achraPresentationDocumentType,
  isAchraPresentationDocument,
  assertIsAchraPresentationDocument,
  isAchraPresentationState,
  assertIsAchraPresentationState,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";
import { ZodError } from "zod";

describe("AchraPresentation Document Model", () => {
  it("should create a new AchraPresentation document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(achraPresentationDocumentType);
  });

  it("should create a new AchraPresentation document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isAchraPresentationDocument(document)).toBe(true);
    expect(isAchraPresentationState(document.state)).toBe(true);
  });
  it("should reject a document that is not a AchraPresentation document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsAchraPresentationDocument(wrongDocumentType)).toThrow();
      expect(isAchraPresentationDocument(wrongDocumentType)).toBe(false);
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
    expect(isAchraPresentationState(wrongState.state)).toBe(false);
    expect(assertIsAchraPresentationState(wrongState.state)).toThrow();
    expect(isAchraPresentationDocument(wrongState)).toBe(false);
    expect(assertIsAchraPresentationDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isAchraPresentationState(wrongInitialState.state)).toBe(false);
    expect(assertIsAchraPresentationState(wrongInitialState.state)).toThrow();
    expect(isAchraPresentationDocument(wrongInitialState)).toBe(false);
    expect(assertIsAchraPresentationDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isAchraPresentationDocument(missingIdInHeader)).toBe(false);
    expect(assertIsAchraPresentationDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isAchraPresentationDocument(missingNameInHeader)).toBe(false);
    expect(assertIsAchraPresentationDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isAchraPresentationDocument(missingCreatedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsAchraPresentationDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(
      isAchraPresentationDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toBe(false);
    expect(
      assertIsAchraPresentationDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
