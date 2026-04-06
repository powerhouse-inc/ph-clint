import { createAction } from "document-model/core";
import {
  SetPresentationInfoInputSchema,
  AddSlideInputSchema,
  DeleteSlideInputSchema,
  DuplicateSlideInputSchema,
  ReorderSlidesInputSchema,
  SetSlideTemplateInputSchema,
  UpdateSlideContentInputSchema,
} from "../schema/zod.js";
import type {
  SetPresentationInfoInput,
  AddSlideInput,
  DeleteSlideInput,
  DuplicateSlideInput,
  ReorderSlidesInput,
  SetSlideTemplateInput,
  UpdateSlideContentInput,
} from "../types.js";
import type {
  SetPresentationInfoAction,
  AddSlideAction,
  DeleteSlideAction,
  DuplicateSlideAction,
  ReorderSlidesAction,
  SetSlideTemplateAction,
  UpdateSlideContentAction,
} from "./actions.js";

export const setPresentationInfo = (input: SetPresentationInfoInput) =>
  createAction<SetPresentationInfoAction>(
    "SET_PRESENTATION_INFO",
    { ...input },
    undefined,
    SetPresentationInfoInputSchema,
    "global",
  );

export const addSlide = (input: AddSlideInput) =>
  createAction<AddSlideAction>(
    "ADD_SLIDE",
    { ...input },
    undefined,
    AddSlideInputSchema,
    "global",
  );

export const deleteSlide = (input: DeleteSlideInput) =>
  createAction<DeleteSlideAction>(
    "DELETE_SLIDE",
    { ...input },
    undefined,
    DeleteSlideInputSchema,
    "global",
  );

export const duplicateSlide = (input: DuplicateSlideInput) =>
  createAction<DuplicateSlideAction>(
    "DUPLICATE_SLIDE",
    { ...input },
    undefined,
    DuplicateSlideInputSchema,
    "global",
  );

export const reorderSlides = (input: ReorderSlidesInput) =>
  createAction<ReorderSlidesAction>(
    "REORDER_SLIDES",
    { ...input },
    undefined,
    ReorderSlidesInputSchema,
    "global",
  );

export const setSlideTemplate = (input: SetSlideTemplateInput) =>
  createAction<SetSlideTemplateAction>(
    "SET_SLIDE_TEMPLATE",
    { ...input },
    undefined,
    SetSlideTemplateInputSchema,
    "global",
  );

export const updateSlideContent = (input: UpdateSlideContentInput) =>
  createAction<UpdateSlideContentAction>(
    "UPDATE_SLIDE_CONTENT",
    { ...input },
    undefined,
    UpdateSlideContentInputSchema,
    "global",
  );
