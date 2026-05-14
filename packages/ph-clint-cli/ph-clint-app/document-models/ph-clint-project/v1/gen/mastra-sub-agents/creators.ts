/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddSubAgentInputSchema,
  RemoveSubAgentInputSchema,
  SetSubAgentDescriptionInputSchema,
  SetSubAgentNameInputSchema,
} from "../schema/zod.js";
import type {
  AddSubAgentInput,
  RemoveSubAgentInput,
  SetSubAgentDescriptionInput,
  SetSubAgentNameInput,
} from "../types.js";
import type {
  AddSubAgentAction,
  RemoveSubAgentAction,
  SetSubAgentDescriptionAction,
  SetSubAgentNameAction,
} from "./actions.js";

export const addSubAgent = (input: AddSubAgentInput) =>
  createAction<AddSubAgentAction>(
    "ADD_SUB_AGENT",
    { ...input },
    undefined,
    AddSubAgentInputSchema,
    "global",
  );

export const removeSubAgent = (input: RemoveSubAgentInput) =>
  createAction<RemoveSubAgentAction>(
    "REMOVE_SUB_AGENT",
    { ...input },
    undefined,
    RemoveSubAgentInputSchema,
    "global",
  );

export const setSubAgentName = (input: SetSubAgentNameInput) =>
  createAction<SetSubAgentNameAction>(
    "SET_SUB_AGENT_NAME",
    { ...input },
    undefined,
    SetSubAgentNameInputSchema,
    "global",
  );

export const setSubAgentDescription = (input: SetSubAgentDescriptionInput) =>
  createAction<SetSubAgentDescriptionAction>(
    "SET_SUB_AGENT_DESCRIPTION",
    { ...input },
    undefined,
    SetSubAgentDescriptionInputSchema,
    "global",
  );
