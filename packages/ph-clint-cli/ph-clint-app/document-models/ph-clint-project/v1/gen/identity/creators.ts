import { createAction } from "document-model";
import {
  SetDescriptionInputSchema,
  SetVersionInputSchema,
  SetPackageIdentifierInputSchema,
} from "../schema/zod.js";
import type {
  SetDescriptionInput,
  SetVersionInput,
  SetPackageIdentifierInput,
} from "../types.js";
import type {
  SetDescriptionAction,
  SetVersionAction,
  SetPackageIdentifierAction,
} from "./actions.js";

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

export const setPackageIdentifier = (input: SetPackageIdentifierInput) =>
  createAction<SetPackageIdentifierAction>(
    "SET_PACKAGE_IDENTIFIER",
    { ...input },
    undefined,
    SetPackageIdentifierInputSchema,
    "global",
  );
