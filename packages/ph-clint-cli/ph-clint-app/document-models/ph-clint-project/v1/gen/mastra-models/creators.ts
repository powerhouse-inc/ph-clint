/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import { AddModelInputSchema, RemoveModelInputSchema } from "../schema/zod.js";
import type { AddModelInput, RemoveModelInput } from "../types.js";
import type { AddModelAction, RemoveModelAction } from "./actions.js";

export const addModel = (input: AddModelInput) =>
  createAction<AddModelAction>(
    "ADD_MODEL",
    { ...input },
    undefined,
    AddModelInputSchema,
    "global",
  );

export const removeModel = (input: RemoveModelInput) =>
  createAction<RemoveModelAction>(
    "REMOVE_MODEL",
    { ...input },
    undefined,
    RemoveModelInputSchema,
    "global",
  );
