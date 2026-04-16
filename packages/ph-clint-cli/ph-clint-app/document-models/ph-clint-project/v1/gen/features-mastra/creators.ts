import { createAction } from "document-model";
import {
  EnableMastraInputSchema,
  DisableMastraInputSchema,
} from "../schema/zod.js";
import type { EnableMastraInput, DisableMastraInput } from "../types.js";
import type { EnableMastraAction, DisableMastraAction } from "./actions.js";

export const enableMastra = (input: EnableMastraInput) =>
  createAction<EnableMastraAction>(
    "ENABLE_MASTRA",
    { ...input },
    undefined,
    EnableMastraInputSchema,
    "global",
  );

export const disableMastra = (input: DisableMastraInput) =>
  createAction<DisableMastraAction>(
    "DISABLE_MASTRA",
    { ...input },
    undefined,
    DisableMastraInputSchema,
    "global",
  );
