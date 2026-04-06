import { createAction } from "document-model/core";
import {
  SetReferencesInputSchema,
  SetMetaDataInputSchema,
} from "../schema/zod.js";
import type { SetReferencesInput, SetMetaDataInput } from "../types.js";
import type { SetReferencesAction, SetMetaDataAction } from "./actions.js";

export const setReferences = (input: SetReferencesInput) =>
  createAction<SetReferencesAction>(
    "SET_REFERENCES",
    { ...input },
    undefined,
    SetReferencesInputSchema,
    "global",
  );

export const setMetaData = (input: SetMetaDataInput) =>
  createAction<SetMetaDataAction>(
    "SET_META_DATA",
    { ...input },
    undefined,
    SetMetaDataInputSchema,
    "global",
  );
