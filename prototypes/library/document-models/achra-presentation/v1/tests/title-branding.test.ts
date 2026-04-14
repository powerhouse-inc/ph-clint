import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAchraPresentationDocument,
  addLink,
  updateLink,
  deleteLink,
  reorderLinks,
  AddLinkInputSchema,
  UpdateLinkInputSchema,
  DeleteLinkInputSchema,
  ReorderLinksInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation/v1";

describe("TitleBrandingOperations", () => {
  it("should handle addLink operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddLinkInputSchema());

    const updatedDocument = reducer(document, addLink(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_LINK");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateLink operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateLinkInputSchema());

    const updatedDocument = reducer(document, updateLink(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_LINK",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteLink operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteLinkInputSchema());

    const updatedDocument = reducer(document, deleteLink(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_LINK",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderLinks operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderLinksInputSchema());

    const updatedDocument = reducer(document, reorderLinks(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_LINKS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
