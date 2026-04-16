import { createAction } from "document-model";
import {
  SetPackageNameInputSchema,
  ClearBinInputSchema,
  SetBinInputSchema,
  SetDescriptionInputSchema,
  SetVersionInputSchema,
  ClearScopeInputSchema,
  SetScopeInputSchema,
} from "../schema/zod.js";
import type {
  SetPackageNameInput,
  ClearBinInput,
  SetBinInput,
  SetDescriptionInput,
  SetVersionInput,
  ClearScopeInput,
  SetScopeInput,
} from "../types.js";
import type {
  SetPackageNameAction,
  ClearBinAction,
  SetBinAction,
  SetDescriptionAction,
  SetVersionAction,
  ClearScopeAction,
  SetScopeAction,
} from "./actions.js";

export const setPackageName = (input: SetPackageNameInput) =>
  createAction<SetPackageNameAction>(
    "SET_PACKAGE_NAME",
    { ...input },
    undefined,
    SetPackageNameInputSchema,
    "global",
  );

export const clearBin = (input: ClearBinInput) =>
  createAction<ClearBinAction>(
    "CLEAR_BIN",
    { ...input },
    undefined,
    ClearBinInputSchema,
    "global",
  );

export const setBin = (input: SetBinInput) =>
  createAction<SetBinAction>(
    "SET_BIN",
    { ...input },
    undefined,
    SetBinInputSchema,
    "global",
  );

export const setDescription = (input: SetDescriptionInput) =>
  createAction<SetDescriptionAction>(
    "SET_DESCRIPTION",
    { ...input },
    undefined,
    SetDescriptionInputSchema,
    "global",
  );

export const setVersion = (input: SetVersionInput) =>
  createAction<SetVersionAction>(
    "SET_VERSION",
    { ...input },
    undefined,
    SetVersionInputSchema,
    "global",
  );

export const clearScope = (input: ClearScopeInput) =>
  createAction<ClearScopeAction>(
    "CLEAR_SCOPE",
    { ...input },
    undefined,
    ClearScopeInputSchema,
    "global",
  );

export const setScope = (input: SetScopeInput) =>
  createAction<SetScopeAction>(
    "SET_SCOPE",
    { ...input },
    undefined,
    SetScopeInputSchema,
    "global",
  );
