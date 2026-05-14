/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddPackageDocumentTypeInputSchema,
  AddPowerhousePackageInputSchema,
  RemovePackageDocumentTypeInputSchema,
  RemovePowerhousePackageInputSchema,
  SetPackageVersionInputSchema,
} from "../schema/zod.js";
import type {
  AddPackageDocumentTypeInput,
  AddPowerhousePackageInput,
  RemovePackageDocumentTypeInput,
  RemovePowerhousePackageInput,
  SetPackageVersionInput,
} from "../types.js";
import type {
  AddPackageDocumentTypeAction,
  AddPowerhousePackageAction,
  RemovePackageDocumentTypeAction,
  RemovePowerhousePackageAction,
  SetPackageVersionAction,
} from "./actions.js";

export const addPowerhousePackage = (input: AddPowerhousePackageInput) =>
  createAction<AddPowerhousePackageAction>(
    "ADD_POWERHOUSE_PACKAGE",
    { ...input },
    undefined,
    AddPowerhousePackageInputSchema,
    "global",
  );

export const removePowerhousePackage = (input: RemovePowerhousePackageInput) =>
  createAction<RemovePowerhousePackageAction>(
    "REMOVE_POWERHOUSE_PACKAGE",
    { ...input },
    undefined,
    RemovePowerhousePackageInputSchema,
    "global",
  );

export const addPackageDocumentType = (input: AddPackageDocumentTypeInput) =>
  createAction<AddPackageDocumentTypeAction>(
    "ADD_PACKAGE_DOCUMENT_TYPE",
    { ...input },
    undefined,
    AddPackageDocumentTypeInputSchema,
    "global",
  );

export const removePackageDocumentType = (
  input: RemovePackageDocumentTypeInput,
) =>
  createAction<RemovePackageDocumentTypeAction>(
    "REMOVE_PACKAGE_DOCUMENT_TYPE",
    { ...input },
    undefined,
    RemovePackageDocumentTypeInputSchema,
    "global",
  );

export const setPackageVersion = (input: SetPackageVersionInput) =>
  createAction<SetPackageVersionAction>(
    "SET_PACKAGE_VERSION",
    { ...input },
    undefined,
    SetPackageVersionInputSchema,
    "global",
  );
