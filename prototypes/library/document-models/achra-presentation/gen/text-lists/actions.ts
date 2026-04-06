import { type Action } from "document-model";
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

export type AddTextItemAction = Action & {
  type: "ADD_TEXT_ITEM";
  input: AddTextItemInput;
};
export type UpdateTextItemAction = Action & {
  type: "UPDATE_TEXT_ITEM";
  input: UpdateTextItemInput;
};
export type DeleteTextItemAction = Action & {
  type: "DELETE_TEXT_ITEM";
  input: DeleteTextItemInput;
};
export type ReorderTextItemsAction = Action & {
  type: "REORDER_TEXT_ITEMS";
  input: ReorderTextItemsInput;
};
export type SetColumnTitleAction = Action & {
  type: "SET_COLUMN_TITLE";
  input: SetColumnTitleInput;
};
export type AddColumnBulletAction = Action & {
  type: "ADD_COLUMN_BULLET";
  input: AddColumnBulletInput;
};
export type UpdateColumnBulletAction = Action & {
  type: "UPDATE_COLUMN_BULLET";
  input: UpdateColumnBulletInput;
};
export type DeleteColumnBulletAction = Action & {
  type: "DELETE_COLUMN_BULLET";
  input: DeleteColumnBulletInput;
};
export type ReorderColumnBulletsAction = Action & {
  type: "REORDER_COLUMN_BULLETS";
  input: ReorderColumnBulletsInput;
};
export type AddChecklistItemAction = Action & {
  type: "ADD_CHECKLIST_ITEM";
  input: AddChecklistItemInput;
};
export type UpdateChecklistItemAction = Action & {
  type: "UPDATE_CHECKLIST_ITEM";
  input: UpdateChecklistItemInput;
};
export type DeleteChecklistItemAction = Action & {
  type: "DELETE_CHECKLIST_ITEM";
  input: DeleteChecklistItemInput;
};
export type ReorderChecklistItemsAction = Action & {
  type: "REORDER_CHECKLIST_ITEMS";
  input: ReorderChecklistItemsInput;
};
export type AddIconListItemAction = Action & {
  type: "ADD_ICON_LIST_ITEM";
  input: AddIconListItemInput;
};
export type UpdateIconListItemAction = Action & {
  type: "UPDATE_ICON_LIST_ITEM";
  input: UpdateIconListItemInput;
};
export type DeleteIconListItemAction = Action & {
  type: "DELETE_ICON_LIST_ITEM";
  input: DeleteIconListItemInput;
};
export type ReorderIconListItemsAction = Action & {
  type: "REORDER_ICON_LIST_ITEMS";
  input: ReorderIconListItemsInput;
};
export type AddHighlightAction = Action & {
  type: "ADD_HIGHLIGHT";
  input: AddHighlightInput;
};
export type UpdateHighlightAction = Action & {
  type: "UPDATE_HIGHLIGHT";
  input: UpdateHighlightInput;
};
export type DeleteHighlightAction = Action & {
  type: "DELETE_HIGHLIGHT";
  input: DeleteHighlightInput;
};
export type ReorderHighlightsAction = Action & {
  type: "REORDER_HIGHLIGHTS";
  input: ReorderHighlightsInput;
};

export type AchraPresentationTextListsAction =
  | AddTextItemAction
  | UpdateTextItemAction
  | DeleteTextItemAction
  | ReorderTextItemsAction
  | SetColumnTitleAction
  | AddColumnBulletAction
  | UpdateColumnBulletAction
  | DeleteColumnBulletAction
  | ReorderColumnBulletsAction
  | AddChecklistItemAction
  | UpdateChecklistItemAction
  | DeleteChecklistItemAction
  | ReorderChecklistItemsAction
  | AddIconListItemAction
  | UpdateIconListItemAction
  | DeleteIconListItemAction
  | ReorderIconListItemsAction
  | AddHighlightAction
  | UpdateHighlightAction
  | DeleteHighlightAction
  | ReorderHighlightsAction;
