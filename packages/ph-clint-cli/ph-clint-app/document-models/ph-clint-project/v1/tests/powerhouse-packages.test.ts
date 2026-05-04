import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  addPowerhousePackage,
  removePowerhousePackage,
  addPackageDocumentType,
  removePackageDocumentType,
} from "document-models/ph-clint-project/v1";

describe("PowerhousePackagesOperations", () => {
  describe("ADD_POWERHOUSE_PACKAGE", () => {
    it("should add a package", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        addPowerhousePackage({
          id: "pkg-1",
          packageName: "@myorg/my-package",
        }),
      );

      expect(updated.state.global.packages).toEqual([
        { id: "pkg-1", packageName: "@myorg/my-package", documentTypes: [] },
      ]);
      expect(updated.operations.global[0].error).toBeUndefined();
    });

    it("should reject duplicate package id", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "pkg-a" }),
      );
      const updated = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "pkg-b" }),
      );

      expect(updated.operations.global[1].error).toContain("already exists");
    });

    it("should reject duplicate package name", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-2", packageName: "my-package" }),
      );

      expect(updated.operations.global[1].error).toContain("already exists");
    });
  });

  describe("REMOVE_POWERHOUSE_PACKAGE", () => {
    it("should remove a package", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        removePowerhousePackage({ id: "pkg-1" }),
      );

      expect(updated.state.global.packages).toEqual([]);
      expect(updated.operations.global[1].error).toBeUndefined();
    });

    it("should error on non-existent package", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        removePowerhousePackage({ id: "nonexistent" }),
      );

      expect(updated.operations.global[0].error).toContain("not found");
    });
  });

  describe("ADD_PACKAGE_DOCUMENT_TYPE", () => {
    it("should add a document type to a package", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );

      expect(updated.state.global.packages[0].documentTypes).toEqual([
        "org/my-doc",
      ]);
      expect(updated.operations.global[1].error).toBeUndefined();
    });

    it("should reject invalid document type format", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "invalid-no-slash",
        }),
      );

      expect(updated.operations.global[1].error).toContain("Invalid document type");
    });

    it("should reject duplicate document type", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      doc = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );
      const updated = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );

      expect(updated.operations.global[2].error).toContain(
        "already registered",
      );
    });

    it("should error on non-existent package", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        addPackageDocumentType({
          packageId: "nonexistent",
          documentType: "org/doc",
        }),
      );

      expect(updated.operations.global[0].error).toContain("not found");
    });
  });

  describe("REMOVE_PACKAGE_DOCUMENT_TYPE", () => {
    it("should remove a document type", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      doc = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );
      const updated = reducer(
        doc,
        removePackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );

      expect(updated.state.global.packages[0].documentTypes).toEqual([]);
      expect(updated.operations.global[2].error).toBeUndefined();
    });

    it("should error on non-existent document type", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        removePackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/nonexistent",
        }),
      );

      expect(updated.operations.global[1].error).toContain("not found");
    });

    it("should error on non-existent package", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        removePackageDocumentType({
          packageId: "nonexistent",
          documentType: "org/doc",
        }),
      );

      expect(updated.operations.global[0].error).toContain("not found");
    });
  });

  it("should dispatch addPowerhousePackage with correct action type", () => {
    const document = utils.createDocument();
    const input = { id: "pkg-1", packageName: "test-package" };

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
});
