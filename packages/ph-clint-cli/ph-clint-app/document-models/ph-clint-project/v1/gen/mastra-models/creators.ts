/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddModelInputSchema,
  RemoveModelInputSchema,
  SetDefaultModelInputSchema,
} from "../schema/zod.js";
import type {
  AddModelInput,
  RemoveModelInput,
  SetDefaultModelInput,
} from "../types.js";
import type {
  AddModelAction,
  RemoveModelAction,
  SetDefaultModelAction,
} from "./actions.js";

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

export const setDefaultModel = (input: SetDefaultModelInput) =>
  createAction<SetDefaultModelAction>(
    "SET_DEFAULT_MODEL",
    { ...input },
    undefined,
    SetDefaultModelInputSchema,
    "global",
  );
