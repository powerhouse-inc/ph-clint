import { createAction } from "document-model/core";
import {
  CreateThreadInputSchema,
  SendAgentMessageInputSchema,
  SetThreadTopicInputSchema,
  EditMessageContentInputSchema,
  MarkMessageReadInputSchema,
  MarkMessageUnreadInputSchema,
  SendStakeholderMessageInputSchema,
} from "../schema/zod.js";
import type {
  CreateThreadInput,
  SendAgentMessageInput,
  SetThreadTopicInput,
  EditMessageContentInput,
  MarkMessageReadInput,
  MarkMessageUnreadInput,
  SendStakeholderMessageInput,
} from "../types.js";
import type {
  CreateThreadAction,
  SendAgentMessageAction,
  SetThreadTopicAction,
  EditMessageContentAction,
  MarkMessageReadAction,
  MarkMessageUnreadAction,
  SendStakeholderMessageAction,
} from "./actions.js";

export const createThread = (input: CreateThreadInput) =>
  createAction<CreateThreadAction>(
    "CREATE_THREAD",
    { ...input },
    undefined,
    CreateThreadInputSchema,
    "global",
  );

export const sendAgentMessage = (input: SendAgentMessageInput) =>
  createAction<SendAgentMessageAction>(
    "SEND_AGENT_MESSAGE",
    { ...input },
    undefined,
    SendAgentMessageInputSchema,
    "global",
  );

export const setThreadTopic = (input: SetThreadTopicInput) =>
  createAction<SetThreadTopicAction>(
    "SET_THREAD_TOPIC",
    { ...input },
    undefined,
    SetThreadTopicInputSchema,
    "global",
  );

export const editMessageContent = (input: EditMessageContentInput) =>
  createAction<EditMessageContentAction>(
    "EDIT_MESSAGE_CONTENT",
    { ...input },
    undefined,
    EditMessageContentInputSchema,
    "global",
  );

export const markMessageRead = (input: MarkMessageReadInput) =>
  createAction<MarkMessageReadAction>(
    "MARK_MESSAGE_READ",
    { ...input },
    undefined,
    MarkMessageReadInputSchema,
    "global",
  );

export const markMessageUnread = (input: MarkMessageUnreadInput) =>
  createAction<MarkMessageUnreadAction>(
    "MARK_MESSAGE_UNREAD",
    { ...input },
    undefined,
    MarkMessageUnreadInputSchema,
    "global",
  );

export const sendStakeholderMessage = (input: SendStakeholderMessageInput) =>
  createAction<SendStakeholderMessageAction>(
    "SEND_STAKEHOLDER_MESSAGE",
    { ...input },
    undefined,
    SendStakeholderMessageInputSchema,
    "global",
  );
