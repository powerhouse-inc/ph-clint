import { createAction } from "document-model/core";
import {
  AddLogEntryInputSchema,
  ClearProjectLogsInputSchema,
} from "../schema/zod.js";
import type { AddLogEntryInput, ClearProjectLogsInput } from "../types.js";
import type { AddLogEntryAction, ClearProjectLogsAction } from "./actions.js";

export const addLogEntry = (input: AddLogEntryInput) =>
  createAction<AddLogEntryAction>(
    "ADD_LOG_ENTRY",
    { ...input },
    undefined,
    AddLogEntryInputSchema,
    "global",
  );

export const clearProjectLogs = (input: ClearProjectLogsInput) =>
  createAction<ClearProjectLogsAction>(
    "CLEAR_PROJECT_LOGS",
    { ...input },
    undefined,
    ClearProjectLogsInputSchema,
    "global",
  );
