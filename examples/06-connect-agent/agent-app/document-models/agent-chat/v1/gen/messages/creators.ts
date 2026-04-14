import { createAction } from "document-model";
import {
  SendTextInputSchema,
  SendErrorInputSchema,
  SendToolCallInputSchema,
  SendToolResultInputSchema,
  DeleteMessageInputSchema,
  MarkAsReadInputSchema,
} from "../schema/zod.js";
import type {
  SendTextInput,
  SendErrorInput,
  SendToolCallInput,
  SendToolResultInput,
  DeleteMessageInput,
  MarkAsReadInput,
} from "../types.js";
import type {
  SendTextAction,
  SendErrorAction,
  SendToolCallAction,
  SendToolResultAction,
  DeleteMessageAction,
  MarkAsReadAction,
} from "./actions.js";

export const sendText = (input: SendTextInput) =>
  createAction<SendTextAction>(
    "SEND_TEXT",
    { ...input },
    undefined,
    SendTextInputSchema,
    "global",
  );

export const sendError = (input: SendErrorInput) =>
  createAction<SendErrorAction>(
    "SEND_ERROR",
    { ...input },
    undefined,
    SendErrorInputSchema,
    "global",
  );

export const sendToolCall = (input: SendToolCallInput) =>
  createAction<SendToolCallAction>(
    "SEND_TOOL_CALL",
    { ...input },
    undefined,
    SendToolCallInputSchema,
    "global",
  );

export const sendToolResult = (input: SendToolResultInput) =>
  createAction<SendToolResultAction>(
    "SEND_TOOL_RESULT",
    { ...input },
    undefined,
    SendToolResultInputSchema,
    "global",
  );

export const deleteMessage = (input: DeleteMessageInput) =>
  createAction<DeleteMessageAction>(
    "DELETE_MESSAGE",
    { ...input },
    undefined,
    DeleteMessageInputSchema,
    "global",
  );

export const markAsRead = (input: MarkAsReadInput) =>
  createAction<MarkAsReadAction>(
    "MARK_AS_READ",
    { ...input },
    undefined,
    MarkAsReadInputSchema,
    "global",
  );
