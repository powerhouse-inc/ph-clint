import * as z from "zod";
import type {
  AddStakeholderInput,
  AgentInboxState,
  AgentInfo,
  ArchiveThreadInput,
  ChatMessage,
  ConfirmThreadResolvedInput,
  CreateThreadInput,
  EditMessageContentInput,
  Flow,
  InitialMessageInput,
  MarkMessageReadInput,
  MarkMessageUnreadInput,
  MessageThread,
  MoveStakeholderInput,
  ParticipantRole,
  ProposeThreadResolvedInput,
  RemoveStakeholderInput,
  ReopenThreadInput,
  SendAgentMessageInput,
  SendStakeholderMessageInput,
  SetAgentAddressInput,
  SetAgentAvatarInput,
  SetAgentDescriptionInput,
  SetAgentNameInput,
  SetAgentRoleInput,
  SetStakeholderAddressInput,
  SetStakeholderAvatarInput,
  SetStakeholderNameInput,
  SetThreadTopicInput,
  Stakeholder,
  ThreadStatus,
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

export const FlowSchema = z.enum(["Incoming", "Outgoing"]);

export const ParticipantRoleSchema = z.enum(["Agent", "Stakeholder"]);

export const ThreadStatusSchema = z.enum([
  "Archived",
  "ConfirmedResolved",
  "Open",
  "ProposedResolvedByAgent",
  "ProposedResolvedByStakeholder",
]);

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

export function AgentInboxStateSchema(): z.ZodObject<
  Properties<AgentInboxState>
> {
  return z.object({
    __typename: z.literal("AgentInboxState").optional(),
    agent: z.lazy(() => AgentInfoSchema()),
    stakeholders: z.array(z.lazy(() => StakeholderSchema())),
    threads: z.array(z.lazy(() => MessageThreadSchema())),
  });
}

export function AgentInfoSchema(): z.ZodObject<Properties<AgentInfo>> {
  return z.object({
    __typename: z.literal("AgentInfo").optional(),
    avatar: z.url().nullish(),
    description: z.string().nullish(),
    ethAddress: z.string().nullish(),
    name: z.string().nullish(),
    role: z.string().nullish(),
  });
}

export function ArchiveThreadInputSchema(): z.ZodObject<
  Properties<ArchiveThreadInput>
> {
  return z.object({
    archivedBy: ParticipantRoleSchema,
    threadId: z.string(),
  });
}

export function ChatMessageSchema(): z.ZodObject<Properties<ChatMessage>> {
  return z.object({
    __typename: z.literal("ChatMessage").optional(),
    content: z.string(),
    flow: FlowSchema,
    id: z.string(),
    read: z.boolean(),
    when: z.iso.datetime(),
  });
}

export function ConfirmThreadResolvedInputSchema(): z.ZodObject<
  Properties<ConfirmThreadResolvedInput>
> {
  return z.object({
    confirmedBy: ParticipantRoleSchema,
    threadId: z.string(),
  });
}

export function CreateThreadInputSchema(): z.ZodObject<
  Properties<CreateThreadInput>
> {
  return z.object({
    id: z.string(),
    initialMessage: z.lazy(() => InitialMessageInputSchema()),
    stakeholder: z.string(),
    topic: z.string().nullish(),
  });
}

export function EditMessageContentInputSchema(): z.ZodObject<
  Properties<EditMessageContentInput>
> {
  return z.object({
    id: z.string(),
    newContent: z.string(),
  });
}

export function InitialMessageInputSchema(): z.ZodObject<
  Properties<InitialMessageInput>
> {
  return z.object({
    content: z.string(),
    flow: FlowSchema,
    id: z.string(),
    when: z.iso.datetime(),
  });
}

export function MarkMessageReadInputSchema(): z.ZodObject<
  Properties<MarkMessageReadInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function MarkMessageUnreadInputSchema(): z.ZodObject<
  Properties<MarkMessageUnreadInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function MessageThreadSchema(): z.ZodObject<Properties<MessageThread>> {
  return z.object({
    __typename: z.literal("MessageThread").optional(),
    id: z.string(),
    messages: z.array(z.lazy(() => ChatMessageSchema())),
    stakeholder: z.string(),
    status: ThreadStatusSchema,
    topic: z.string().nullish(),
  });
}

export function MoveStakeholderInputSchema(): z.ZodObject<
  Properties<MoveStakeholderInput>
> {
  return z.object({
    id: z.string(),
    insertBefore: z.string().nullish(),
  });
}

export function ProposeThreadResolvedInputSchema(): z.ZodObject<
  Properties<ProposeThreadResolvedInput>
> {
  return z.object({
    proposedBy: ParticipantRoleSchema,
    threadId: z.string(),
  });
}

export function RemoveStakeholderInputSchema(): z.ZodObject<
  Properties<RemoveStakeholderInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ReopenThreadInputSchema(): z.ZodObject<
  Properties<ReopenThreadInput>
> {
  return z.object({
    reopenedBy: ParticipantRoleSchema,
    threadId: z.string(),
  });
}

export function SendAgentMessageInputSchema(): z.ZodObject<
  Properties<SendAgentMessageInput>
> {
  return z.object({
    content: z.string(),
    messageId: z.string(),
    threadId: z.string(),
    when: z.iso.datetime(),
  });
}

export function SendStakeholderMessageInputSchema(): z.ZodObject<
  Properties<SendStakeholderMessageInput>
> {
  return z.object({
    content: z.string(),
    messageId: z.string(),
    threadId: z.string(),
    when: z.iso.datetime(),
  });
}

export function SetAgentAddressInputSchema(): z.ZodObject<
  Properties<SetAgentAddressInput>
> {
  return z.object({
    ethAddress: z.string().nullish(),
  });
}

export function SetAgentAvatarInputSchema(): z.ZodObject<
  Properties<SetAgentAvatarInput>
> {
  return z.object({
    avatar: z.url().nullish(),
  });
}

export function SetAgentDescriptionInputSchema(): z.ZodObject<
  Properties<SetAgentDescriptionInput>
> {
  return z.object({
    description: z.string().nullish(),
  });
}

export function SetAgentNameInputSchema(): z.ZodObject<
  Properties<SetAgentNameInput>
> {
  return z.object({
    name: z.string(),
  });
}

export function SetAgentRoleInputSchema(): z.ZodObject<
  Properties<SetAgentRoleInput>
> {
  return z.object({
    role: z.string().nullish(),
  });
}

export function SetStakeholderAddressInputSchema(): z.ZodObject<
  Properties<SetStakeholderAddressInput>
> {
  return z.object({
    ethAddress: z.string().nullish(),
    id: z.string(),
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

export function SetStakeholderNameInputSchema(): z.ZodObject<
  Properties<SetStakeholderNameInput>
> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function SetThreadTopicInputSchema(): z.ZodObject<
  Properties<SetThreadTopicInput>
> {
  return z.object({
    id: z.string(),
    topic: z.string().nullish(),
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
