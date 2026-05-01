import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  addPowerhousePackage,
  removePowerhousePackage,
  addPackageDocumentType,
  removePackageDocumentType,
  AddPowerhousePackageInputSchema,
  RemovePowerhousePackageInputSchema,
  AddPackageDocumentTypeInputSchema,
  RemovePackageDocumentTypeInputSchema,
} from "document-models/ph-clint-project/v1";

describe("PowerhousePackagesOperations", () => {
  it("should handle addPowerhousePackage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddPowerhousePackageInputSchema());

    const updatedDocument = reducer(document, addPowerhousePackage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_POWERHOUSE_PACKAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removePowerhousePackage operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemovePowerhousePackageInputSchema());

    const updatedDocument = reducer(document, removePowerhousePackage(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_POWERHOUSE_PACKAGE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addPackageDocumentType operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddPackageDocumentTypeInputSchema());

    const updatedDocument = reducer(document, addPackageDocumentType(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_PACKAGE_DOCUMENT_TYPE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removePackageDocumentType operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemovePackageDocumentTypeInputSchema());

    const updatedDocument = reducer(document, removePackageDocumentType(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_PACKAGE_DOCUMENT_TYPE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
