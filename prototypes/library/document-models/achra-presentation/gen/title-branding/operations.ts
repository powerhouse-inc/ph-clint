import { type SignalDispatch } from "document-model";
import {
  type AddLinkAction,
  type UpdateLinkAction,
  type DeleteLinkAction,
  type ReorderLinksAction,
} from "./actions.js";
import { type AchraPresentationState } from "../types.js";

export interface AchraPresentationTitleBrandingOperations {
  addLinkOperation: (
    state: AchraPresentationState,
    action: AddLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateLinkOperation: (
    state: AchraPresentationState,
    action: UpdateLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteLinkOperation: (
    state: AchraPresentationState,
    action: DeleteLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderLinksOperation: (
    state: AchraPresentationState,
    action: ReorderLinksAction,
    dispatch?: SignalDispatch,
  ) => void;
}
