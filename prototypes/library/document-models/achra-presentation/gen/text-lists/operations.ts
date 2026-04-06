import { type SignalDispatch } from "document-model";
import {
  type AddTextItemAction,
  type UpdateTextItemAction,
  type DeleteTextItemAction,
  type ReorderTextItemsAction,
  type SetColumnTitleAction,
  type AddColumnBulletAction,
  type UpdateColumnBulletAction,
  type DeleteColumnBulletAction,
  type ReorderColumnBulletsAction,
  type AddChecklistItemAction,
  type UpdateChecklistItemAction,
  type DeleteChecklistItemAction,
  type ReorderChecklistItemsAction,
  type AddIconListItemAction,
  type UpdateIconListItemAction,
  type DeleteIconListItemAction,
  type ReorderIconListItemsAction,
  type AddHighlightAction,
  type UpdateHighlightAction,
  type DeleteHighlightAction,
  type ReorderHighlightsAction,
} from "./actions.js";
import { type AchraPresentationState } from "../types.js";

export interface AchraPresentationTextListsOperations {
  addTextItemOperation: (
    state: AchraPresentationState,
    action: AddTextItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateTextItemOperation: (
    state: AchraPresentationState,
    action: UpdateTextItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteTextItemOperation: (
    state: AchraPresentationState,
    action: DeleteTextItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderTextItemsOperation: (
    state: AchraPresentationState,
    action: ReorderTextItemsAction,
    dispatch?: SignalDispatch,
  ) => void;
  setColumnTitleOperation: (
    state: AchraPresentationState,
    action: SetColumnTitleAction,
    dispatch?: SignalDispatch,
  ) => void;
  addColumnBulletOperation: (
    state: AchraPresentationState,
    action: AddColumnBulletAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateColumnBulletOperation: (
    state: AchraPresentationState,
    action: UpdateColumnBulletAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteColumnBulletOperation: (
    state: AchraPresentationState,
    action: DeleteColumnBulletAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderColumnBulletsOperation: (
    state: AchraPresentationState,
    action: ReorderColumnBulletsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addChecklistItemOperation: (
    state: AchraPresentationState,
    action: AddChecklistItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateChecklistItemOperation: (
    state: AchraPresentationState,
    action: UpdateChecklistItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteChecklistItemOperation: (
    state: AchraPresentationState,
    action: DeleteChecklistItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderChecklistItemsOperation: (
    state: AchraPresentationState,
    action: ReorderChecklistItemsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addIconListItemOperation: (
    state: AchraPresentationState,
    action: AddIconListItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateIconListItemOperation: (
    state: AchraPresentationState,
    action: UpdateIconListItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteIconListItemOperation: (
    state: AchraPresentationState,
    action: DeleteIconListItemAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderIconListItemsOperation: (
    state: AchraPresentationState,
    action: ReorderIconListItemsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addHighlightOperation: (
    state: AchraPresentationState,
    action: AddHighlightAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateHighlightOperation: (
    state: AchraPresentationState,
    action: UpdateHighlightAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteHighlightOperation: (
    state: AchraPresentationState,
    action: DeleteHighlightAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderHighlightsOperation: (
    state: AchraPresentationState,
    action: ReorderHighlightsAction,
    dispatch?: SignalDispatch,
  ) => void;
}
