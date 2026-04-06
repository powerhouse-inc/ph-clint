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
  addTextItem,
  AddTextItemInputSchema,
  updateTextItem,
  UpdateTextItemInputSchema,
  deleteTextItem,
  DeleteTextItemInputSchema,
  reorderTextItems,
  ReorderTextItemsInputSchema,
  setColumnTitle,
  SetColumnTitleInputSchema,
  addColumnBullet,
  AddColumnBulletInputSchema,
  updateColumnBullet,
  UpdateColumnBulletInputSchema,
  deleteColumnBullet,
  DeleteColumnBulletInputSchema,
  reorderColumnBullets,
  ReorderColumnBulletsInputSchema,
  addChecklistItem,
  AddChecklistItemInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";

describe("TextLists Operations", () => {
  it("should handle addTextItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddTextItemInputSchema());

    const updatedDocument = reducer(document, addTextItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TEXT_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateTextItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateTextItemInputSchema());

    const updatedDocument = reducer(document, updateTextItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_TEXT_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteTextItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteTextItemInputSchema());

    const updatedDocument = reducer(document, deleteTextItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_TEXT_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderTextItems operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderTextItemsInputSchema());

    const updatedDocument = reducer(document, reorderTextItems(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_TEXT_ITEMS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle setColumnTitle operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetColumnTitleInputSchema());

    const updatedDocument = reducer(document, setColumnTitle(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_COLUMN_TITLE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle addColumnBullet operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddColumnBulletInputSchema());

    const updatedDocument = reducer(document, addColumnBullet(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_COLUMN_BULLET",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle updateColumnBullet operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateColumnBulletInputSchema());

    const updatedDocument = reducer(document, updateColumnBullet(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_COLUMN_BULLET",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle deleteColumnBullet operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteColumnBulletInputSchema());

    const updatedDocument = reducer(document, deleteColumnBullet(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_COLUMN_BULLET",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle reorderColumnBullets operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderColumnBulletsInputSchema());

    const updatedDocument = reducer(document, reorderColumnBullets(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_COLUMN_BULLETS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
  it("should handle addChecklistItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddChecklistItemInputSchema());

    const updatedDocument = reducer(document, addChecklistItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_CHECKLIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
