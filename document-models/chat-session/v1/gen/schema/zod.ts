/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from 'zod';
import type {
  AbortSessionInput,
  AddAssistantMessageInput,
  AddSystemMessageInput,
  AddToolOutputInput,
  AddToolResultInput,
  AddUserMessageInput,
  AgentInfo,
  AgentInfoInput,
  AppendAssistantContentInput,
  AssistantContentPartInput,
  ChatSessionState,
  ContentPart,
  ContentPartType,
  DeleteUserMessageInput,
  EndSessionInput,
  Message,
  MessageRole,
  MessageUsage,
  SessionStatus,
  SetAgentInfoInput,
  SetMessageUsageInput,
  StartSessionInput,
  ToolResultPartInput,
  UpdateAssistantContentInput,
  UpdateUsageSummaryInput,
  UsageSummary,
  UserContentPartInput,
} from './types.js';

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const ContentPartTypeSchema = z.enum(['ERROR', 'FILE', 'IMAGE', 'REASONING', 'TEXT', 'TOOL_CALL', 'TOOL_RESULT']);

export const MessageRoleSchema = z.enum(['ASSISTANT', 'SYSTEM', 'TOOL', 'USER']);

export const SessionStatusSchema = z.enum(['ABORTED', 'ACTIVE', 'COMPLETED', 'ERROR']);

export function AbortSessionInputSchema(): z.ZodObject<Properties<AbortSessionInput>> {
  return z.object({
    endedAt: z.iso.datetime(),
  });
}

export function AddAssistantMessageInputSchema(): z.ZodObject<Properties<AddAssistantMessageInput>> {
  return z.object({
    content: z.array(z.lazy(() => AssistantContentPartInputSchema())),
    createdAt: z.iso.datetime(),
    id: z.string(),
    stepIndex: z.number().nullish(),
  });
}

export function AddSystemMessageInputSchema(): z.ZodObject<Properties<AddSystemMessageInput>> {
  return z.object({
    createdAt: z.iso.datetime(),
    id: z.string(),
    text: z.string(),
  });
}

export function AddToolOutputInputSchema(): z.ZodObject<Properties<AddToolOutputInput>> {
  return z.object({
    messageId: z.string(),
    partId: z.string(),
    text: z.string(),
    toolCallId: z.string(),
    toolName: z.string(),
  });
}

export function AddToolResultInputSchema(): z.ZodObject<Properties<AddToolResultInput>> {
  return z.object({
    content: z.array(z.lazy(() => ToolResultPartInputSchema())),
    createdAt: z.iso.datetime(),
    id: z.string(),
    stepIndex: z.number().nullish(),
  });
}

export function AddUserMessageInputSchema(): z.ZodObject<Properties<AddUserMessageInput>> {
  return z.object({
    content: z.array(z.lazy(() => UserContentPartInputSchema())),
    createdAt: z.iso.datetime(),
    id: z.string(),
  });
}

export function AgentInfoSchema(): z.ZodObject<Properties<AgentInfo>> {
  return z.object({
    __typename: z.literal('AgentInfo').optional(),
    id: z.string().nullish(),
    instructions: z.string().nullish(),
    model: z.string().nullish(),
    name: z.string().nullish(),
  });
}

export function AgentInfoInputSchema(): z.ZodObject<Properties<AgentInfoInput>> {
  return z.object({
    id: z.string().nullish(),
    instructions: z.string().nullish(),
    model: z.string().nullish(),
    name: z.string().nullish(),
  });
}

export function AppendAssistantContentInputSchema(): z.ZodObject<Properties<AppendAssistantContentInput>> {
  return z.object({
    messageId: z.string(),
    part: z.lazy(() => AssistantContentPartInputSchema()),
  });
}

export function AssistantContentPartInputSchema(): z.ZodObject<Properties<AssistantContentPartInput>> {
  return z.object({
    args: z.string().nullish(),
    data: z.string().nullish(),
    error: z.string().nullish(),
    filename: z.string().nullish(),
    id: z.string(),
    mediaType: z.string().nullish(),
    text: z.string().nullish(),
    toolCallId: z.string().nullish(),
    toolName: z.string().nullish(),
    type: ContentPartTypeSchema,
    url: z.url().nullish(),
  });
}

export function ChatSessionStateSchema(): z.ZodObject<Properties<ChatSessionState>> {
  return z.object({
    __typename: z.literal('ChatSessionState').optional(),
    agent: z.lazy(() => AgentInfoSchema().nullish()),
    endedAt: z.iso.datetime().nullish(),
    messages: z.array(z.lazy(() => MessageSchema())),
    resourceId: z.string().nullish(),
    startedAt: z.iso.datetime().nullish(),
    status: SessionStatusSchema,
    threadId: z.string().nullish(),
    usage: z.lazy(() => UsageSummarySchema().nullish()),
  });
}

export function ContentPartSchema(): z.ZodObject<Properties<ContentPart>> {
  return z.object({
    __typename: z.literal('ContentPart').optional(),
    args: z.string().nullish(),
    data: z.string().nullish(),
    error: z.string().nullish(),
    filename: z.string().nullish(),
    id: z.string(),
    isError: z.boolean().nullish(),
    mediaType: z.string().nullish(),
    result: z.string().nullish(),
    text: z.string().nullish(),
    toolCallId: z.string().nullish(),
    toolName: z.string().nullish(),
    type: ContentPartTypeSchema,
    url: z.url().nullish(),
  });
}

export function DeleteUserMessageInputSchema(): z.ZodObject<Properties<DeleteUserMessageInput>> {
  return z.object({
    messageId: z.string(),
  });
}

export function EndSessionInputSchema(): z.ZodObject<Properties<EndSessionInput>> {
  return z.object({
    endedAt: z.iso.datetime(),
    status: SessionStatusSchema,
  });
}

export function MessageSchema(): z.ZodObject<Properties<Message>> {
  return z.object({
    __typename: z.literal('Message').optional(),
    content: z.array(z.lazy(() => ContentPartSchema())),
    createdAt: z.iso.datetime(),
    id: z.string(),
    role: MessageRoleSchema,
    stepIndex: z.number().nullish(),
    usage: z.lazy(() => MessageUsageSchema().nullish()),
  });
}

export function MessageUsageSchema(): z.ZodObject<Properties<MessageUsage>> {
  return z.object({
    __typename: z.literal('MessageUsage').optional(),
    completionTokens: z.number().nullish(),
    promptTokens: z.number().nullish(),
    totalTokens: z.number().nullish(),
  });
}

export function SetAgentInfoInputSchema(): z.ZodObject<Properties<SetAgentInfoInput>> {
  return z.object({
    id: z.string().nullish(),
    instructions: z.string().nullish(),
    model: z.string().nullish(),
    name: z.string().nullish(),
  });
}

export function SetMessageUsageInputSchema(): z.ZodObject<Properties<SetMessageUsageInput>> {
  return z.object({
    completionTokens: z.number().nullish(),
    messageId: z.string(),
    promptTokens: z.number().nullish(),
    totalTokens: z.number().nullish(),
  });
}

export function StartSessionInputSchema(): z.ZodObject<Properties<StartSessionInput>> {
  return z.object({
    agent: z.lazy(() => AgentInfoInputSchema()),
    resourceId: z.string(),
    startedAt: z.iso.datetime(),
    threadId: z.string(),
  });
}

export function ToolResultPartInputSchema(): z.ZodObject<Properties<ToolResultPartInput>> {
  return z.object({
    data: z.string().nullish(),
    id: z.string(),
    isError: z.boolean().nullish(),
    mediaType: z.string().nullish(),
    result: z.string().nullish(),
    text: z.string().nullish(),
    toolCallId: z.string(),
    toolName: z.string(),
    type: ContentPartTypeSchema,
    url: z.url().nullish(),
  });
}

export function UpdateAssistantContentInputSchema(): z.ZodObject<Properties<UpdateAssistantContentInput>> {
  return z.object({
    args: z.string().nullish(),
    error: z.string().nullish(),
    messageId: z.string(),
    partId: z.string(),
    text: z.string().nullish(),
  });
}

export function UpdateUsageSummaryInputSchema(): z.ZodObject<Properties<UpdateUsageSummaryInput>> {
  return z.object({
    totalCompletionTokens: z.number().nullish(),
    totalMessages: z.number().nullish(),
    totalPromptTokens: z.number().nullish(),
    totalSteps: z.number().nullish(),
    totalTokens: z.number().nullish(),
    totalToolCalls: z.number().nullish(),
  });
}

export function UsageSummarySchema(): z.ZodObject<Properties<UsageSummary>> {
  return z.object({
    __typename: z.literal('UsageSummary').optional(),
    totalCompletionTokens: z.number().nullish(),
    totalMessages: z.number().nullish(),
    totalPromptTokens: z.number().nullish(),
    totalSteps: z.number().nullish(),
    totalTokens: z.number().nullish(),
    totalToolCalls: z.number().nullish(),
  });
}

export function UserContentPartInputSchema(): z.ZodObject<Properties<UserContentPartInput>> {
  return z.object({
    data: z.string().nullish(),
    filename: z.string().nullish(),
    id: z.string(),
    mediaType: z.string().nullish(),
    text: z.string().nullish(),
    type: ContentPartTypeSchema,
    url: z.url().nullish(),
  });
}
