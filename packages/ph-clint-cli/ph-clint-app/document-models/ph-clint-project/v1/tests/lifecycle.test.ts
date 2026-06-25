import { generateMock } from "document-model";
import {
  importSpec,
  ImportSpecInputSchema,
  isPhClintProjectDocument,
  reducer,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("LifecycleOperations", () => {
  it("should handle importSpec operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ImportSpecInputSchema());

    const updatedDocument = reducer(document, importSpec(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "IMPORT_SPEC",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
