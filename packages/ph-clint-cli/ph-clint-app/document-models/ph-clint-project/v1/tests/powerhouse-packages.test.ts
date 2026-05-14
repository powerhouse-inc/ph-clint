import { generateMock } from "@powerhousedao/codegen";
import {
  addPackageDocumentType,
  AddPackageDocumentTypeInputSchema,
  addPowerhousePackage,
  AddPowerhousePackageInputSchema,
  isPhClintProjectDocument,
  reducer,
  removePackageDocumentType,
  RemovePackageDocumentTypeInputSchema,
  removePowerhousePackage,
  RemovePowerhousePackageInputSchema,
  setPackageIdentifier,
  setPackageVersion,
  SetPackageVersionInputSchema,
  setPowerhouseLevel,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("PowerhousePackagesOperations", () => {
  describe("ADD_POWERHOUSE_PACKAGE", () => {
    it("should add a package with managed=false and version=null", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        addPowerhousePackage({
          id: "pkg-1",
          packageName: "@myorg/my-package",
        }),
      );

      expect(updated.state.global.packages).toEqual([
        {
          id: "pkg-1",
          packageName: "@myorg/my-package",
          documentTypes: [],
          version: null,
          managed: false,
        },
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
    it("should remove an unmanaged package", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(doc, removePowerhousePackage({ id: "pkg-1" }));

      expect(updated.state.global.packages).toEqual([]);
      expect(updated.operations.global[1].error).toBeUndefined();
    });

    it("should reject removing a managed package", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, setPackageIdentifier({ identifier: "my-tool-cli" }));
      doc = reducer(doc, setPowerhouseLevel({ level: "Reactor" as const }));
      const appPkg = doc.state.global.packages.find((p) => p.managed);
      expect(appPkg).toBeDefined();

      const updated = reducer(doc, removePowerhousePackage({ id: appPkg!.id }));

      expect(updated.operations.global[2].error).toContain(
        "Cannot remove a managed package",
      );
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

  describe("SET_PACKAGE_VERSION", () => {
    it("should set a valid semver version", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        setPackageVersion({ packageId: "pkg-1", version: "1.2.3" }),
      );

      expect(updated.state.global.packages[0].version).toBe("1.2.3");
      expect(updated.operations.global[1].error).toBeUndefined();
    });

    it("should set version to null for auto", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      doc = reducer(
        doc,
        setPackageVersion({ packageId: "pkg-1", version: "1.0.0" }),
      );
      const updated = reducer(
        doc,
        setPackageVersion({ packageId: "pkg-1", version: null }),
      );

      expect(updated.state.global.packages[0].version).toBeNull();
    });

    it("should reject invalid version string", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      const updated = reducer(
        doc,
        setPackageVersion({ packageId: "pkg-1", version: "not-semver" }),
      );

      expect(updated.operations.global[1].error).toContain("Invalid version");
    });

    it("should error on non-existent package", () => {
      const doc = utils.createDocument();
      const updated = reducer(
        doc,
        setPackageVersion({ packageId: "nonexistent", version: "1.0.0" }),
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

    it("should accept */* wildcard and clear existing types", () => {
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
          documentType: "*/*",
        }),
      );

      expect(updated.state.global.packages[0].documentTypes).toEqual(["*/*"]);
    });

    it("should silently skip adding specific type when */* is present", () => {
      let doc = utils.createDocument();
      doc = reducer(
        doc,
        addPowerhousePackage({ id: "pkg-1", packageName: "my-package" }),
      );
      doc = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "*/*",
        }),
      );
      const updated = reducer(
        doc,
        addPackageDocumentType({
          packageId: "pkg-1",
          documentType: "org/my-doc",
        }),
      );

      expect(updated.state.global.packages[0].documentTypes).toEqual(["*/*"]);
      expect(updated.operations.global[2].error).toBeUndefined();
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

      expect(updated.operations.global[1].error).toContain(
        "Invalid document type",
      );
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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

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

  it("should handle setPackageVersion operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPackageVersionInputSchema());

    const updatedDocument = reducer(document, setPackageVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PACKAGE_VERSION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
