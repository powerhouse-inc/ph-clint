import { createAction } from "document-model/core";
import {
  UpdateDescriptionInputSchema,
  UpdateInstructionsInputSchema,
  AddNoteInputSchema,
  ClearInstructionsInputSchema,
  ClearNotesInputSchema,
  RemoveNoteInputSchema,
  MarkAsDraftInputSchema,
  MarkAsReadyInputSchema,
  SetOwnerInputSchema,
} from "../schema/zod.js";
import type {
  UpdateDescriptionInput,
  UpdateInstructionsInput,
  AddNoteInput,
  ClearInstructionsInput,
  ClearNotesInput,
  RemoveNoteInput,
  MarkAsDraftInput,
  MarkAsReadyInput,
  SetOwnerInput,
} from "../types.js";
import type {
  UpdateDescriptionAction,
  UpdateInstructionsAction,
  AddNoteAction,
  ClearInstructionsAction,
  ClearNotesAction,
  RemoveNoteAction,
  MarkAsDraftAction,
  MarkAsReadyAction,
  SetOwnerAction,
} from "./actions.js";

export const updateDescription = (input: UpdateDescriptionInput) =>
  createAction<UpdateDescriptionAction>(
    "UPDATE_DESCRIPTION",
    { ...input },
    undefined,
    UpdateDescriptionInputSchema,
    "global",
  );

export const updateInstructions = (input: UpdateInstructionsInput) =>
  createAction<UpdateInstructionsAction>(
    "UPDATE_INSTRUCTIONS",
    { ...input },
    undefined,
    UpdateInstructionsInputSchema,
    "global",
  );

export const addNote = (input: AddNoteInput) =>
  createAction<AddNoteAction>(
    "ADD_NOTE",
    { ...input },
    undefined,
    AddNoteInputSchema,
    "global",
  );

export const clearInstructions = (input: ClearInstructionsInput) =>
  createAction<ClearInstructionsAction>(
    "CLEAR_INSTRUCTIONS",
    { ...input },
    undefined,
    ClearInstructionsInputSchema,
    "global",
  );

export const clearNotes = (input: ClearNotesInput) =>
  createAction<ClearNotesAction>(
    "CLEAR_NOTES",
    { ...input },
    undefined,
    ClearNotesInputSchema,
    "global",
  );

export const removeNote = (input: RemoveNoteInput) =>
  createAction<RemoveNoteAction>(
    "REMOVE_NOTE",
    { ...input },
    undefined,
    RemoveNoteInputSchema,
    "global",
  );

export const markAsDraft = (input: MarkAsDraftInput) =>
  createAction<MarkAsDraftAction>(
    "MARK_AS_DRAFT",
    { ...input },
    undefined,
    MarkAsDraftInputSchema,
    "global",
  );

export const markAsReady = (input: MarkAsReadyInput) =>
  createAction<MarkAsReadyAction>(
    "MARK_AS_READY",
    { ...input },
    undefined,
    MarkAsReadyInputSchema,
    "global",
  );

export const setOwner = (input: SetOwnerInput) =>
  createAction<SetOwnerAction>(
    "SET_OWNER",
    { ...input },
    undefined,
    SetOwnerInputSchema,
    "global",
  );
