import { type SignalDispatch } from "document-model";
import {
  type SetPresentationInfoAction,
  type AddSlideAction,
  type DeleteSlideAction,
  type DuplicateSlideAction,
  type ReorderSlidesAction,
  type SetSlideTemplateAction,
  type UpdateSlideContentAction,
} from "./actions.js";
import { type AchraPresentationState } from "../types.js";

export interface AchraPresentationCoreOperations {
  setPresentationInfoOperation: (
    state: AchraPresentationState,
    action: SetPresentationInfoAction,
    dispatch?: SignalDispatch,
  ) => void;
  addSlideOperation: (
    state: AchraPresentationState,
    action: AddSlideAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteSlideOperation: (
    state: AchraPresentationState,
    action: DeleteSlideAction,
    dispatch?: SignalDispatch,
  ) => void;
  duplicateSlideOperation: (
    state: AchraPresentationState,
    action: DuplicateSlideAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderSlidesOperation: (
    state: AchraPresentationState,
    action: ReorderSlidesAction,
    dispatch?: SignalDispatch,
  ) => void;
  setSlideTemplateOperation: (
    state: AchraPresentationState,
    action: SetSlideTemplateAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateSlideContentOperation: (
    state: AchraPresentationState,
    action: UpdateSlideContentAction,
    dispatch?: SignalDispatch,
  ) => void;
}
