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
  addLink,
  AddLinkInputSchema,
  updateLink,
  UpdateLinkInputSchema,
  deleteLink,
  DeleteLinkInputSchema,
  reorderLinks,
  ReorderLinksInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

describe("TitleBranding Operations", () => {
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
