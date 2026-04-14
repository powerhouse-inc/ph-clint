/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as z from "zod";
import type {
  AddAgentInput,
  AddReactionInput,
  AddStakeholderInput,
  AgentChatState,
  AgentInfo,
  ChatMessage,
  ClearTopicInput,
  DeleteMessageInput,
  MarkAsReadInput,
  MessageFormat,
  MessageType,
  Reaction,
  ReaddAgentInput,
  ReaddStakeholderInput,
  RemoveAgentInput,
  RemovePruneLengthInput,
  RemoveReactionInput,
  RemoveStakeholderInput,
  SendErrorInput,
  SendTextInput,
  SendToolCallInput,
  SendToolResultInput,
  SetAgentAvatarInput,
  SetAgentDescriptionInput,
  SetAgentEthAddressInput,
  SetAgentNameInput,
  SetAgentRoleInput,
  SetPruneLengthInput,
  SetStakeholderAvatarInput,
  SetStakeholderEthAddressInput,
  SetStakeholderNameInput,
  SetTopicInput,
  Stakeholder,
  ToolCall,
  ToolResult,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const MessageFormatSchema = z.enum([
  "Binary",
  "Json",
  "MarkDown",
  "Mixed",
  "Text",
]);

export const MessageTypeSchema = z.enum([
  "Error",
  "Text",
  "ToolCall",
  "ToolResult",
]);

export function AddAgentInputSchema(): z.ZodObject<Properties<AddAgentInput>> {
  return z.object({
    avatar: z.url().nullish(),
    description: z.string().nullish(),
    ethAddress: z.string().nullish(),
    id: z.string(),
    name: z.string().nullish(),
    role: z.string().nullish(),
  });
}

export function AddReactionInputSchema(): z.ZodObject<
  Properties<AddReactionInput>
> {
  return z.object({
    emoji: z.string(),
    messageId: z.string(),
    sender: z.string(),
  });
}

export function AddStakeholderInputSchema(): z.ZodObject<
  Properties<AddStakeholderInput>
> {
  return z.object({
    avatar: z.url().nullish(),
    ethAddress: z.string().nullish(),
    id: z.string(),
    name: z.string(),
  });
}

export function AgentChatStateSchema(): z.ZodObject<
  Properties<AgentChatState>
> {
  return z.object({
    __typename: z.literal("AgentChatState").optional(),
    agents: z.array(z.lazy(() => AgentInfoSchema())),
    messages: z.array(z.lazy(() => ChatMessageSchema())),
    pruneLength: z.number().nullish(),
    stakeholders: z.array(z.lazy(() => StakeholderSchema())),
    topic: z.string().nullish(),
  });
}

export function AgentInfoSchema(): z.ZodObject<Properties<AgentInfo>> {
  return z.object({
    __typename: z.literal("AgentInfo").optional(),
    avatar: z.url().nullish(),
    description: z.string().nullish(),
    ethAddress: z.string().nullish(),
    id: z.string(),
    name: z.string().nullish(),
    removed: z.boolean(),
    role: z.string().nullish(),
  });
}

export function ChatMessageSchema(): z.ZodObject<Properties<ChatMessage>> {
  return z.object({
    __typename: z.literal("ChatMessage").optional(),
    error: z.string().nullish(),
    format: MessageFormatSchema.nullish(),
    id: z.string(),
    mentioned: z.array(z.string()),
    reactions: z.array(z.lazy(() => ReactionSchema())).nullish(),
    readBy: z.array(z.string()).nullish(),
    sender: z.string(),
    text: z.array(z.string()).nullish(),
    toolCall: z.lazy(() => ToolCallSchema().nullish()),
    toolResult: z.lazy(() => ToolResultSchema().nullish()),
    type: MessageTypeSchema,
    updated: z.iso.datetime().nullish(),
    when: z.iso.datetime(),
  });
}

export function ClearTopicInputSchema(): z.ZodObject<
  Properties<ClearTopicInput>
> {
  return z.object({
    _placeholder: z.string().nullish(),
  });
}

export function DeleteMessageInputSchema(): z.ZodObject<
  Properties<DeleteMessageInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function MarkAsReadInputSchema(): z.ZodObject<
  Properties<MarkAsReadInput>
> {
  return z.object({
    messageId: z.string(),
    readBy: z.string(),
  });
}

export function ReactionSchema(): z.ZodObject<Properties<Reaction>> {
  return z.object({
    __typename: z.literal("Reaction").optional(),
    emoji: z.string(),
    sender: z.string(),
  });
}

export function ReaddAgentInputSchema(): z.ZodObject<
  Properties<ReaddAgentInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ReaddStakeholderInputSchema(): z.ZodObject<
  Properties<ReaddStakeholderInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveAgentInputSchema(): z.ZodObject<
  Properties<RemoveAgentInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemovePruneLengthInputSchema(): z.ZodObject<
  Properties<RemovePruneLengthInput>
> {
  return z.object({
    _placeholder: z.string().nullish(),
  });
}

export function RemoveReactionInputSchema(): z.ZodObject<
  Properties<RemoveReactionInput>
> {
  return z.object({
    emoji: z.string(),
    messageId: z.string(),
    sender: z.string(),
  });
}

export function RemoveStakeholderInputSchema(): z.ZodObject<
  Properties<RemoveStakeholderInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function SendErrorInputSchema(): z.ZodObject<
  Properties<SendErrorInput>
> {
  return z.object({
    error: z.string(),
    format: MessageFormatSchema.nullish(),
    id: z.string(),
    mentioned: z.array(z.string()).nullish(),
    sender: z.string(),
    when: z.iso.datetime(),
  });
}

export function SendTextInputSchema(): z.ZodObject<Properties<SendTextInput>> {
  return z.object({
    format: MessageFormatSchema.nullish(),
    id: z.string(),
    mentioned: z.array(z.string()).nullish(),
    sender: z.string(),
    text: z.string(),
    when: z.iso.datetime(),
  });
}

export function SendToolCallInputSchema(): z.ZodObject<
  Properties<SendToolCallInput>
> {
  return z.object({
    argsJson: z.string(),
    id: z.string(),
    mentioned: z.array(z.string()).nullish(),
    sender: z.string(),
    toolName: z.string(),
    when: z.iso.datetime(),
  });
}

export function SendToolResultInputSchema(): z.ZodObject<
  Properties<SendToolResultInput>
> {
  return z.object({
    format: MessageFormatSchema.nullish(),
    id: z.string(),
    isError: z.boolean(),
    mentioned: z.array(z.string()).nullish(),
    result: z.string(),
    sender: z.string(),
    toolName: z.string(),
    when: z.iso.datetime(),
  });
}

export function SetAgentAvatarInputSchema(): z.ZodObject<
  Properties<SetAgentAvatarInput>
> {
  return z.object({
    avatar: z.url().nullish(),
    id: z.string(),
  });
}

export function SetAgentDescriptionInputSchema(): z.ZodObject<
  Properties<SetAgentDescriptionInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
  });
}

export function SetAgentEthAddressInputSchema(): z.ZodObject<
  Properties<SetAgentEthAddressInput>
> {
  return z.object({
    ethAddress: z.string().nullish(),
    id: z.string(),
  });
}

export function SetAgentNameInputSchema(): z.ZodObject<
  Properties<SetAgentNameInput>
> {
  return z.object({
    id: z.string(),
    name: z.string().nullish(),
  });
}

export function SetAgentRoleInputSchema(): z.ZodObject<
  Properties<SetAgentRoleInput>
> {
  return z.object({
    id: z.string(),
    role: z.string().nullish(),
  });
}

export function SetPruneLengthInputSchema(): z.ZodObject<
  Properties<SetPruneLengthInput>
> {
  return z.object({
    pruneLength: z.number(),
  });
}

export function SetStakeholderAvatarInputSchema(): z.ZodObject<
  Properties<SetStakeholderAvatarInput>
> {
  return z.object({
    avatar: z.url().nullish(),
    id: z.string(),
  });
}

export function SetStakeholderEthAddressInputSchema(): z.ZodObject<
  Properties<SetStakeholderEthAddressInput>
> {
  return z.object({
    ethAddress: z.string().nullish(),
    id: z.string(),
  });
}

export function SetStakeholderNameInputSchema(): z.ZodObject<
  Properties<SetStakeholderNameInput>
> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function SetTopicInputSchema(): z.ZodObject<Properties<SetTopicInput>> {
  return z.object({
    topic: z.string(),
  });
}

export function StakeholderSchema(): z.ZodObject<Properties<Stakeholder>> {
  return z.object({
    __typename: z.literal("Stakeholder").optional(),
    avatar: z.url().nullish(),
    ethAddress: z.string().nullish(),
    id: z.string(),
    name: z.string(),
    removed: z.boolean(),
  });
}

export function ToolCallSchema(): z.ZodObject<Properties<ToolCall>> {
  return z.object({
    __typename: z.literal("ToolCall").optional(),
    argsJson: z.string(),
    name: z.string(),
  });
}

export function ToolResultSchema(): z.ZodObject<Properties<ToolResult>> {
  return z.object({
    __typename: z.literal("ToolResult").optional(),
    isError: z.boolean(),
    name: z.string(),
    result: z.string(),
  });
}
