import { generateMock } from "@powerhousedao/common/utils";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAchraPresentationDocument,
  addTextItem,
  updateTextItem,
  deleteTextItem,
  reorderTextItems,
  setColumnTitle,
  addColumnBullet,
  updateColumnBullet,
  deleteColumnBullet,
  reorderColumnBullets,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  addIconListItem,
  updateIconListItem,
  deleteIconListItem,
  reorderIconListItems,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  reorderHighlights,
  AddTextItemInputSchema,
  UpdateTextItemInputSchema,
  DeleteTextItemInputSchema,
  ReorderTextItemsInputSchema,
  SetColumnTitleInputSchema,
  AddColumnBulletInputSchema,
  UpdateColumnBulletInputSchema,
  DeleteColumnBulletInputSchema,
  ReorderColumnBulletsInputSchema,
  AddChecklistItemInputSchema,
  UpdateChecklistItemInputSchema,
  DeleteChecklistItemInputSchema,
  ReorderChecklistItemsInputSchema,
  AddIconListItemInputSchema,
  UpdateIconListItemInputSchema,
  DeleteIconListItemInputSchema,
  ReorderIconListItemsInputSchema,
  AddHighlightInputSchema,
  UpdateHighlightInputSchema,
  DeleteHighlightInputSchema,
  ReorderHighlightsInputSchema,
} from "@powerhousedao/agent-manager/document-models/achra-presentation/v1";

describe("TextListsOperations", () => {
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

  it("should handle updateChecklistItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateChecklistItemInputSchema());

    const updatedDocument = reducer(document, updateChecklistItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_CHECKLIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteChecklistItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteChecklistItemInputSchema());

    const updatedDocument = reducer(document, deleteChecklistItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_CHECKLIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderChecklistItems operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderChecklistItemsInputSchema());

    const updatedDocument = reducer(document, reorderChecklistItems(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_CHECKLIST_ITEMS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addIconListItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddIconListItemInputSchema());

    const updatedDocument = reducer(document, addIconListItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_ICON_LIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateIconListItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateIconListItemInputSchema());

    const updatedDocument = reducer(document, updateIconListItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_ICON_LIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteIconListItem operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteIconListItemInputSchema());

    const updatedDocument = reducer(document, deleteIconListItem(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_ICON_LIST_ITEM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderIconListItems operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderIconListItemsInputSchema());

    const updatedDocument = reducer(document, reorderIconListItems(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_ICON_LIST_ITEMS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addHighlight operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddHighlightInputSchema());

    const updatedDocument = reducer(document, addHighlight(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_HIGHLIGHT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateHighlight operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateHighlightInputSchema());

    const updatedDocument = reducer(document, updateHighlight(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_HIGHLIGHT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteHighlight operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteHighlightInputSchema());

    const updatedDocument = reducer(document, deleteHighlight(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_HIGHLIGHT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderHighlights operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderHighlightsInputSchema());

    const updatedDocument = reducer(document, reorderHighlights(input));

    expect(isAchraPresentationDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_HIGHLIGHTS",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
