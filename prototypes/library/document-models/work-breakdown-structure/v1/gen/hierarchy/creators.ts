import { createAction } from "document-model/core";
import {
  ReorderInputSchema,
  AddDependenciesInputSchema,
  RemoveDependenciesInputSchema,
} from "../schema/zod.js";
import type {
  ReorderInput,
  AddDependenciesInput,
  RemoveDependenciesInput,
} from "../types.js";
import type {
  ReorderAction,
  AddDependenciesAction,
  RemoveDependenciesAction,
} from "./actions.js";

export const reorder = (input: ReorderInput) =>
  createAction<ReorderAction>(
    "REORDER",
    { ...input },
    undefined,
    ReorderInputSchema,
    "global",
  );

export const addDependencies = (input: AddDependenciesInput) =>
  createAction<AddDependenciesAction>(
    "ADD_DEPENDENCIES",
    { ...input },
    undefined,
    AddDependenciesInputSchema,
    "global",
  );

export const removeDependencies = (input: RemoveDependenciesInput) =>
  createAction<RemoveDependenciesAction>(
    "REMOVE_DEPENDENCIES",
    { ...input },
    undefined,
    RemoveDependenciesInputSchema,
    "global",
  );
