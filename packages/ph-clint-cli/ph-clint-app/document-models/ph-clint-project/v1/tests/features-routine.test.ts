import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isPhClintProjectDocument,
  enableRoutine,
  disableRoutine,
  EnableRoutineInputSchema,
  DisableRoutineInputSchema,
} from "document-models/ph-clint-project/v1";

describe("FeaturesRoutineOperations", () => {
  it("should handle enableRoutine operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EnableRoutineInputSchema());

    const updatedDocument = reducer(document, enableRoutine(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ENABLE_ROUTINE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle disableRoutine operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DisableRoutineInputSchema());

    const updatedDocument = reducer(document, disableRoutine(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DISABLE_ROUTINE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
