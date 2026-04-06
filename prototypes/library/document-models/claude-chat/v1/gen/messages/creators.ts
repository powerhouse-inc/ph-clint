import { createAction } from "document-model/core";
import {
  AddUserMessageInputSchema,
  AddAgentMessageInputSchema,
} from "../schema/zod.js";
import type { AddUserMessageInput, AddAgentMessageInput } from "../types.js";
import type { AddUserMessageAction, AddAgentMessageAction } from "./actions.js";

export const addUserMessage = (input: AddUserMessageInput) =>
  createAction<AddUserMessageAction>(
    "ADD_USER_MESSAGE",
    { ...input },
    undefined,
    AddUserMessageInputSchema,
    "global",
  );

export const addAgentMessage = (input: AddAgentMessageInput) =>
  createAction<AddAgentMessageAction>(
    "ADD_AGENT_MESSAGE",
    { ...input },
    undefined,
    AddAgentMessageInputSchema,
    "global",
  );
