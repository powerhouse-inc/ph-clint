import { generateMock } from "document-model";
import {
  addProfile,
  AddProfileInputSchema,
  isPhClintProjectDocument,
  reducer,
  removeProfile,
  RemoveProfileInputSchema,
  reorderProfiles,
  ReorderProfilesInputSchema,
  updateProfile,
  UpdateProfileInputSchema,
  utils,
} from "document-models/ph-clint-project/v1";
import { describe, expect, it } from "vitest";

describe("MastraProfilesOperations", () => {
  it("should handle addProfile operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddProfileInputSchema());

    const updatedDocument = reducer(document, addProfile(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_PROFILE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateProfile operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateProfileInputSchema());

    const updatedDocument = reducer(document, updateProfile(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_PROFILE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeProfile operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveProfileInputSchema());

    const updatedDocument = reducer(document, removeProfile(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_PROFILE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderProfiles operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderProfilesInputSchema());

    const updatedDocument = reducer(document, reorderProfiles(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_PROFILES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
