import { createAction } from "document-model/core";
import {
  AddLinkInputSchema,
  UpdateLinkInputSchema,
  DeleteLinkInputSchema,
  ReorderLinksInputSchema,
} from "../schema/zod.js";
import type {
  AddLinkInput,
  UpdateLinkInput,
  DeleteLinkInput,
  ReorderLinksInput,
} from "../types.js";
import type {
  AddLinkAction,
  UpdateLinkAction,
  DeleteLinkAction,
  ReorderLinksAction,
} from "./actions.js";

export const addLink = (input: AddLinkInput) =>
  createAction<AddLinkAction>(
    "ADD_LINK",
    { ...input },
    undefined,
    AddLinkInputSchema,
    "global",
  );

export const updateLink = (input: UpdateLinkInput) =>
  createAction<UpdateLinkAction>(
    "UPDATE_LINK",
    { ...input },
    undefined,
    UpdateLinkInputSchema,
    "global",
  );

export const deleteLink = (input: DeleteLinkInput) =>
  createAction<DeleteLinkAction>(
    "DELETE_LINK",
    { ...input },
    undefined,
    DeleteLinkInputSchema,
    "global",
  );

export const reorderLinks = (input: ReorderLinksInput) =>
  createAction<ReorderLinksAction>(
    "REORDER_LINKS",
    { ...input },
    undefined,
    ReorderLinksInputSchema,
    "global",
  );
