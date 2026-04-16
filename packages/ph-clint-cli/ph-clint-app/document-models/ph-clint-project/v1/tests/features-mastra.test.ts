import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  enableMastra,
  disableMastra,
  EnableMastraInputSchema,
  DisableMastraInputSchema,
} from "document-models/ph-clint-project/v1";

describe("FeaturesMastraOperations", () => {
  it("should handle enableMastra operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EnableMastraInputSchema());

    const updatedDocument = reducer(document, enableMastra(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ENABLE_MASTRA",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle disableMastra operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DisableMastraInputSchema());

    const updatedDocument = reducer(document, disableMastra(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DISABLE_MASTRA",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
