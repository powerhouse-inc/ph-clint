import { type Action } from "document-model";
import type {
  SetPresentationInfoInput,
  AddSlideInput,
  DeleteSlideInput,
  DuplicateSlideInput,
  ReorderSlidesInput,
  SetSlideTemplateInput,
  UpdateSlideContentInput,
} from "../types.js";

export type SetPresentationInfoAction = Action & {
  type: "SET_PRESENTATION_INFO";
  input: SetPresentationInfoInput;
};
export type AddSlideAction = Action & {
  type: "ADD_SLIDE";
  input: AddSlideInput;
};
export type DeleteSlideAction = Action & {
  type: "DELETE_SLIDE";
  input: DeleteSlideInput;
};
export type DuplicateSlideAction = Action & {
  type: "DUPLICATE_SLIDE";
  input: DuplicateSlideInput;
};
export type ReorderSlidesAction = Action & {
  type: "REORDER_SLIDES";
  input: ReorderSlidesInput;
};
export type SetSlideTemplateAction = Action & {
  type: "SET_SLIDE_TEMPLATE";
  input: SetSlideTemplateInput;
};
export type UpdateSlideContentAction = Action & {
  type: "UPDATE_SLIDE_CONTENT";
  input: UpdateSlideContentInput;
};

export type AchraPresentationCoreAction =
  | SetPresentationInfoAction
  | AddSlideAction
  | DeleteSlideAction
  | DuplicateSlideAction
  | ReorderSlidesAction
  | SetSlideTemplateAction
  | UpdateSlideContentAction;
