/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "@powerhousedao/codegen";
import {
  reducer,
  utils,
  isAchraPresentationDocument,
  setPresentationInfo,
  SetPresentationInfoInputSchema,
  addSlide,
  AddSlideInputSchema,
  deleteSlide,
  DeleteSlideInputSchema,
  duplicateSlide,
  DuplicateSlideInputSchema,
  reorderSlides,
  ReorderSlidesInputSchema,
  setSlideTemplate,
  SetSlideTemplateInputSchema,
  updateSlideContent,
  UpdateSlideContentInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

describe("Core Operations", () => {
  it("should handle setPresentationInfo operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPresentationInfoInputSchema());

    const updatedDocument = reducer(document, setPresentationInfo(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PRESENTATION_INFO",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle addSlide operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSlideInputSchema());

    const updatedDocument = reducer(document, addSlide(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_SLIDE");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteSlide operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteSlideInputSchema());

    const updatedDocument = reducer(document, deleteSlide(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_SLIDE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle duplicateSlide operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DuplicateSlideInputSchema());

    const updatedDocument = reducer(document, duplicateSlide(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DUPLICATE_SLIDE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderSlides operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderSlidesInputSchema());

    const updatedDocument = reducer(document, reorderSlides(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_SLIDES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle setSlideTemplate operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetSlideTemplateInputSchema());

    const updatedDocument = reducer(document, setSlideTemplate(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_SLIDE_TEMPLATE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateSlideContent operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateSlideContentInputSchema());

    const updatedDocument = reducer(document, updateSlideContent(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_SLIDE_CONTENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
