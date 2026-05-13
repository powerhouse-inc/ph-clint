/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from 'vitest';
import { utils, initialGlobalState, initialLocalState, phClintProjectDocumentType, isPhClintProjectDocument, assertIsPhClintProjectDocument, isPhClintProjectState, assertIsPhClintProjectState } from 'document-models/ph-clint-project/v1';
import { ZodError } from 'zod';

describe('PhClintProject Document Model', () => {
  it('should create a new PhClintProject document', () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(phClintProjectDocumentType);
  });

  it('should create a new PhClintProject document with a valid initial state', () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isPhClintProjectDocument(document)).toBe(true);
    expect(isPhClintProjectState(document.state)).toBe(true);
  });
  it('should reject a document that is not a PhClintProject document', () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = 'the-wrong-thing-1234';
    try {
      expect(assertIsPhClintProjectDocument(wrongDocumentType)).toThrow();
      expect(isPhClintProjectDocument(wrongDocumentType)).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
  const wrongState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongState.state.global = {
    ...{ notWhat: 'you want' },
  };
  try {
    expect(isPhClintProjectState(wrongState.state)).toBe(false);
    expect(assertIsPhClintProjectState(wrongState.state)).toThrow();
    expect(isPhClintProjectDocument(wrongState)).toBe(false);
    expect(assertIsPhClintProjectDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: 'you want' },
  };
  try {
    expect(isPhClintProjectState(wrongInitialState.state)).toBe(false);
    expect(assertIsPhClintProjectState(wrongInitialState.state)).toThrow();
    expect(isPhClintProjectDocument(wrongInitialState)).toBe(false);
    expect(assertIsPhClintProjectDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isPhClintProjectDocument(missingIdInHeader)).toBe(false);
    expect(assertIsPhClintProjectDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isPhClintProjectDocument(missingNameInHeader)).toBe(false);
    expect(assertIsPhClintProjectDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isPhClintProjectDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsPhClintProjectDocument(missingCreatedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isPhClintProjectDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsPhClintProjectDocument(missingLastModifiedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
