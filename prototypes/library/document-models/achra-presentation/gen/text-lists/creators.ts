import { createAction } from "document-model/core";
import {
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
} from "../schema/zod.js";
import type {
  AddTextItemInput,
  UpdateTextItemInput,
  DeleteTextItemInput,
  ReorderTextItemsInput,
  SetColumnTitleInput,
  AddColumnBulletInput,
  UpdateColumnBulletInput,
  DeleteColumnBulletInput,
  ReorderColumnBulletsInput,
  AddChecklistItemInput,
  UpdateChecklistItemInput,
  DeleteChecklistItemInput,
  ReorderChecklistItemsInput,
  AddIconListItemInput,
  UpdateIconListItemInput,
  DeleteIconListItemInput,
  ReorderIconListItemsInput,
  AddHighlightInput,
  UpdateHighlightInput,
  DeleteHighlightInput,
  ReorderHighlightsInput,
} from "../types.js";
import type {
  AddTextItemAction,
  UpdateTextItemAction,
  DeleteTextItemAction,
  ReorderTextItemsAction,
  SetColumnTitleAction,
  AddColumnBulletAction,
  UpdateColumnBulletAction,
  DeleteColumnBulletAction,
  ReorderColumnBulletsAction,
  AddChecklistItemAction,
  UpdateChecklistItemAction,
  DeleteChecklistItemAction,
  ReorderChecklistItemsAction,
  AddIconListItemAction,
  UpdateIconListItemAction,
  DeleteIconListItemAction,
  ReorderIconListItemsAction,
  AddHighlightAction,
  UpdateHighlightAction,
  DeleteHighlightAction,
  ReorderHighlightsAction,
} from "./actions.js";

export const addTextItem = (input: AddTextItemInput) =>
  createAction<AddTextItemAction>(
    "ADD_TEXT_ITEM",
    { ...input },
    undefined,
    AddTextItemInputSchema,
    "global",
  );

export const updateTextItem = (input: UpdateTextItemInput) =>
  createAction<UpdateTextItemAction>(
    "UPDATE_TEXT_ITEM",
    { ...input },
    undefined,
    UpdateTextItemInputSchema,
    "global",
  );

export const deleteTextItem = (input: DeleteTextItemInput) =>
  createAction<DeleteTextItemAction>(
    "DELETE_TEXT_ITEM",
    { ...input },
    undefined,
    DeleteTextItemInputSchema,
    "global",
  );

export const reorderTextItems = (input: ReorderTextItemsInput) =>
  createAction<ReorderTextItemsAction>(
    "REORDER_TEXT_ITEMS",
    { ...input },
    undefined,
    ReorderTextItemsInputSchema,
    "global",
  );

export const setColumnTitle = (input: SetColumnTitleInput) =>
  createAction<SetColumnTitleAction>(
    "SET_COLUMN_TITLE",
    { ...input },
    undefined,
    SetColumnTitleInputSchema,
    "global",
  );

export const addColumnBullet = (input: AddColumnBulletInput) =>
  createAction<AddColumnBulletAction>(
    "ADD_COLUMN_BULLET",
    { ...input },
    undefined,
    AddColumnBulletInputSchema,
    "global",
  );

export const updateColumnBullet = (input: UpdateColumnBulletInput) =>
  createAction<UpdateColumnBulletAction>(
    "UPDATE_COLUMN_BULLET",
    { ...input },
    undefined,
    UpdateColumnBulletInputSchema,
    "global",
  );

export const deleteColumnBullet = (input: DeleteColumnBulletInput) =>
  createAction<DeleteColumnBulletAction>(
    "DELETE_COLUMN_BULLET",
    { ...input },
    undefined,
    DeleteColumnBulletInputSchema,
    "global",
  );

export const reorderColumnBullets = (input: ReorderColumnBulletsInput) =>
  createAction<ReorderColumnBulletsAction>(
    "REORDER_COLUMN_BULLETS",
    { ...input },
    undefined,
    ReorderColumnBulletsInputSchema,
    "global",
  );

export const addChecklistItem = (input: AddChecklistItemInput) =>
  createAction<AddChecklistItemAction>(
    "ADD_CHECKLIST_ITEM",
    { ...input },
    undefined,
    AddChecklistItemInputSchema,
    "global",
  );

export const updateChecklistItem = (input: UpdateChecklistItemInput) =>
  createAction<UpdateChecklistItemAction>(
    "UPDATE_CHECKLIST_ITEM",
    { ...input },
    undefined,
    UpdateChecklistItemInputSchema,
    "global",
  );

export const deleteChecklistItem = (input: DeleteChecklistItemInput) =>
  createAction<DeleteChecklistItemAction>(
    "DELETE_CHECKLIST_ITEM",
    { ...input },
    undefined,
    DeleteChecklistItemInputSchema,
    "global",
  );

export const reorderChecklistItems = (input: ReorderChecklistItemsInput) =>
  createAction<ReorderChecklistItemsAction>(
    "REORDER_CHECKLIST_ITEMS",
    { ...input },
    undefined,
    ReorderChecklistItemsInputSchema,
    "global",
  );

export const addIconListItem = (input: AddIconListItemInput) =>
  createAction<AddIconListItemAction>(
    "ADD_ICON_LIST_ITEM",
    { ...input },
    undefined,
    AddIconListItemInputSchema,
    "global",
  );

export const updateIconListItem = (input: UpdateIconListItemInput) =>
  createAction<UpdateIconListItemAction>(
    "UPDATE_ICON_LIST_ITEM",
    { ...input },
    undefined,
    UpdateIconListItemInputSchema,
    "global",
  );

export const deleteIconListItem = (input: DeleteIconListItemInput) =>
  createAction<DeleteIconListItemAction>(
    "DELETE_ICON_LIST_ITEM",
    { ...input },
    undefined,
    DeleteIconListItemInputSchema,
    "global",
  );

export const reorderIconListItems = (input: ReorderIconListItemsInput) =>
  createAction<ReorderIconListItemsAction>(
    "REORDER_ICON_LIST_ITEMS",
    { ...input },
    undefined,
    ReorderIconListItemsInputSchema,
    "global",
  );

export const addHighlight = (input: AddHighlightInput) =>
  createAction<AddHighlightAction>(
    "ADD_HIGHLIGHT",
    { ...input },
    undefined,
    AddHighlightInputSchema,
    "global",
  );

export const updateHighlight = (input: UpdateHighlightInput) =>
  createAction<UpdateHighlightAction>(
    "UPDATE_HIGHLIGHT",
    { ...input },
    undefined,
    UpdateHighlightInputSchema,
    "global",
  );

export const deleteHighlight = (input: DeleteHighlightInput) =>
  createAction<DeleteHighlightAction>(
    "DELETE_HIGHLIGHT",
    { ...input },
    undefined,
    DeleteHighlightInputSchema,
    "global",
  );

export const reorderHighlights = (input: ReorderHighlightsInput) =>
  createAction<ReorderHighlightsAction>(
    "REORDER_HIGHLIGHTS",
    { ...input },
    undefined,
    ReorderHighlightsInputSchema,
    "global",
  );
