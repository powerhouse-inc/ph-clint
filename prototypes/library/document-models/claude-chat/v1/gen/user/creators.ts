import { createAction } from "document-model/core";
import {
  SetUsernameInputSchema,
  SetSelectedAgentInputSchema,
} from "../schema/zod.js";
import type { SetUsernameInput, SetSelectedAgentInput } from "../types.js";
import type { SetUsernameAction, SetSelectedAgentAction } from "./actions.js";

export const setUsername = (input: SetUsernameInput) =>
  createAction<SetUsernameAction>(
    "SET_USERNAME",
    { ...input },
    undefined,
    SetUsernameInputSchema,
    "global",
  );

export const setSelectedAgent = (input: SetSelectedAgentInput) =>
  createAction<SetSelectedAgentAction>(
    "SET_SELECTED_AGENT",
    { ...input },
    undefined,
    SetSelectedAgentInputSchema,
    "global",
  );
