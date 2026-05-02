/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddSystemMessageInputSchema,
  EndSessionInputSchema,
  SetAgentInfoInputSchema,
  StartSessionInputSchema,
  UpdateUsageSummaryInputSchema,
} from "../schema/zod.js";
import type {
  AddSystemMessageInput,
  EndSessionInput,
  SetAgentInfoInput,
  StartSessionInput,
  UpdateUsageSummaryInput,
} from "../types.js";
import type {
  AddSystemMessageAction,
  EndSessionAction,
  SetAgentInfoAction,
  StartSessionAction,
  UpdateUsageSummaryAction,
} from "./actions.js";

export const startSession = (input: StartSessionInput) =>
  createAction<StartSessionAction>(
    "START_SESSION",
    { ...input },
    undefined,
    StartSessionInputSchema,
    "global",
  );

export const endSession = (input: EndSessionInput) =>
  createAction<EndSessionAction>(
    "END_SESSION",
    { ...input },
    undefined,
    EndSessionInputSchema,
    "global",
  );

export const setAgentInfo = (input: SetAgentInfoInput) =>
  createAction<SetAgentInfoAction>(
    "SET_AGENT_INFO",
    { ...input },
    undefined,
    SetAgentInfoInputSchema,
    "global",
  );

export const addSystemMessage = (input: AddSystemMessageInput) =>
  createAction<AddSystemMessageAction>(
    "ADD_SYSTEM_MESSAGE",
    { ...input },
    undefined,
    AddSystemMessageInputSchema,
    "global",
  );

export const updateUsageSummary = (input: UpdateUsageSummaryInput) =>
  createAction<UpdateUsageSummaryAction>(
    "UPDATE_USAGE_SUMMARY",
    { ...input },
    undefined,
    UpdateUsageSummaryInputSchema,
    "global",
  );
