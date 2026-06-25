import { generateMock } from "document-model";
import {
  isPhClintProjectDocument,
  reducer,
  setPowerhouseLevel,
  SetPowerhouseLevelInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("FeaturesPowerhouseOperations", () => {
  it("should handle setPowerhouseLevel operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPowerhouseLevelInputSchema());

    const updatedDocument = reducer(document, setPowerhouseLevel(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_POWERHOUSE_LEVEL",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
