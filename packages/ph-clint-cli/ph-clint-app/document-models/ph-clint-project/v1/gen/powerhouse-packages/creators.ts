import { createAction } from "document-model";
import {
  AddPowerhousePackageInputSchema,
  RemovePowerhousePackageInputSchema,
  AddPackageDocumentTypeInputSchema,
  RemovePackageDocumentTypeInputSchema,
} from "../schema/zod.js";
import type {
  AddPowerhousePackageInput,
  RemovePowerhousePackageInput,
  AddPackageDocumentTypeInput,
  RemovePackageDocumentTypeInput,
} from "../types.js";
import type {
  AddPowerhousePackageAction,
  RemovePowerhousePackageAction,
  AddPackageDocumentTypeAction,
  RemovePackageDocumentTypeAction,
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
