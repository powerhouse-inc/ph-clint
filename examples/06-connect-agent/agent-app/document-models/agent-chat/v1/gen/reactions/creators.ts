import { createAction } from "document-model";
import {
  AddReactionInputSchema,
  RemoveReactionInputSchema,
} from "../schema/zod.js";
import type { AddReactionInput, RemoveReactionInput } from "../types.js";
import type { AddReactionAction, RemoveReactionAction } from "./actions.js";

export const addReaction = (input: AddReactionInput) =>
  createAction<AddReactionAction>(
    "ADD_REACTION",
    { ...input },
    undefined,
    AddReactionInputSchema,
    "global",
  );

export const removeReaction = (input: RemoveReactionInput) =>
  createAction<RemoveReactionAction>(
    "REMOVE_REACTION",
    { ...input },
    undefined,
    RemoveReactionInputSchema,
    "global",
  );
