/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  DisableMastraInputSchema,
  EnableMastraInputSchema,
  SetEnableChatInputSchema,
} from "../schema/zod.js";
import type {
  DisableMastraInput,
  EnableMastraInput,
  SetEnableChatInput,
} from "../types.js";
import type {
  DisableMastraAction,
  EnableMastraAction,
  SetEnableChatAction,
} from "./actions.js";

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

export const setEnableChat = (input: SetEnableChatInput) =>
  createAction<SetEnableChatAction>(
    "SET_ENABLE_CHAT",
    { ...input },
    undefined,
    SetEnableChatInputSchema,
    "global",
  );
