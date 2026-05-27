export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Address: { input: `${string}:0x${string}`; output: `${string}:0x${string}` };
  Amount: {
    input: { unit?: string; value?: number };
    output: { unit?: string; value?: number };
  };
  Amount_Crypto: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Currency: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Fiat: {
    input: { unit: string; value: number };
    output: { unit: string; value: number };
  };
  Amount_Money: { input: number; output: number };
  Amount_Percentage: { input: number; output: number };
  Amount_Tokens: { input: number; output: number };
  Attachment: { input: string; output: string };
  Currency: { input: string; output: string };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
  EmailAddress: { input: string; output: string };
  EthereumAddress: { input: string; output: string };
  OID: { input: string; output: string };
  OLabel: { input: string; output: string };
  PHID: { input: string; output: string };
  URL: { input: string; output: string };
  Unknown: { input: unknown; output: unknown };
  Upload: { input: File; output: File };
};

export type AbortSessionInput = {
  endedAt: Scalars['DateTime']['input'];
};

export type AddAssistantMessageInput = {
  content: Array<AssistantContentPartInput>;
  createdAt: Scalars['DateTime']['input'];
  id: Scalars['OID']['input'];
  stepIndex?: InputMaybe<Scalars['Int']['input']>;
};

export type AddSystemMessageInput = {
  createdAt: Scalars['DateTime']['input'];
  id: Scalars['OID']['input'];
  text: Scalars['String']['input'];
};

export type AddToolOutputInput = {
  messageId: Scalars['OID']['input'];
  partId: Scalars['OID']['input'];
  text: Scalars['String']['input'];
  toolCallId: Scalars['String']['input'];
  toolName: Scalars['String']['input'];
};

export type AddToolResultInput = {
  content: Array<ToolResultPartInput>;
  createdAt: Scalars['DateTime']['input'];
  id: Scalars['OID']['input'];
  stepIndex?: InputMaybe<Scalars['Int']['input']>;
};

export type AddUserMessageInput = {
  content: Array<UserContentPartInput>;
  createdAt: Scalars['DateTime']['input'];
  id: Scalars['OID']['input'];
};

export type AgentInfo = {
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  image: Maybe<Scalars['String']['output']>;
  imageMediaType: Maybe<Scalars['String']['output']>;
  imageUrl: Maybe<Scalars['URL']['output']>;
  model: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type AgentInfoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type AppendAssistantContentInput = {
  messageId: Scalars['OID']['input'];
  part: AssistantContentPartInput;
};

export type AssistantContentPartInput = {
  args?: InputMaybe<Scalars['String']['input']>;
  attachment?: InputMaybe<Scalars['String']['input']>;
  error?: InputMaybe<Scalars['String']['input']>;
  filename?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  mediaType?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  toolCallId?: InputMaybe<Scalars['String']['input']>;
  toolName?: InputMaybe<Scalars['String']['input']>;
  type: ContentPartType;
  url?: InputMaybe<Scalars['URL']['input']>;
};

export type ChatSessionState = {
  agent: Maybe<AgentInfo>;
  endedAt: Maybe<Scalars['DateTime']['output']>;
  messages: Array<Message>;
  resourceId: Maybe<Scalars['String']['output']>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
  status: SessionStatus;
  threadId: Maybe<Scalars['String']['output']>;
  usage: Maybe<UsageSummary>;
};

export type ContentPart = {
  args: Maybe<Scalars['String']['output']>;
  attachment: Maybe<Scalars['String']['output']>;
  error: Maybe<Scalars['String']['output']>;
  filename: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  isError: Maybe<Scalars['Boolean']['output']>;
  mediaType: Maybe<Scalars['String']['output']>;
  result: Maybe<Scalars['String']['output']>;
  text: Maybe<Scalars['String']['output']>;
  toolCallId: Maybe<Scalars['String']['output']>;
  toolName: Maybe<Scalars['String']['output']>;
  type: ContentPartType;
  url: Maybe<Scalars['URL']['output']>;
};

export type ContentPartType = 'ERROR' | 'FILE' | 'IMAGE' | 'REASONING' | 'TEXT' | 'TOOL_CALL' | 'TOOL_RESULT';

export type DeleteUserMessageInput = {
  messageId: Scalars['OID']['input'];
};

export type EndSessionInput = {
  endedAt: Scalars['DateTime']['input'];
  status: SessionStatus;
};

export type Message = {
  content: Array<ContentPart>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['OID']['output'];
  role: MessageRole;
  stepIndex: Maybe<Scalars['Int']['output']>;
  usage: Maybe<MessageUsage>;
};

export type MessageRole = 'ASSISTANT' | 'SYSTEM' | 'TOOL' | 'USER';

export type MessageUsage = {
  completionTokens: Maybe<Scalars['Int']['output']>;
  promptTokens: Maybe<Scalars['Int']['output']>;
  totalTokens: Maybe<Scalars['Int']['output']>;
};

export type SessionStatus = 'ABORTED' | 'ACTIVE' | 'COMPLETED' | 'ERROR';

export type SetAgentDescriptionInput = {
  description: Scalars['String']['input'];
};

export type SetAgentImageInput = {
  data?: InputMaybe<Scalars['String']['input']>;
  mediaType?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['URL']['input']>;
};

export type SetAgentInfoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type SetMessageUsageInput = {
  completionTokens?: InputMaybe<Scalars['Int']['input']>;
  messageId: Scalars['OID']['input'];
  promptTokens?: InputMaybe<Scalars['Int']['input']>;
  totalTokens?: InputMaybe<Scalars['Int']['input']>;
};

export type StartSessionInput = {
  agent: AgentInfoInput;
  resourceId: Scalars['String']['input'];
  startedAt: Scalars['DateTime']['input'];
  threadId: Scalars['String']['input'];
};

export type ToolResultPartInput = {
  attachment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  isError?: InputMaybe<Scalars['Boolean']['input']>;
  mediaType?: InputMaybe<Scalars['String']['input']>;
  result?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  toolCallId: Scalars['String']['input'];
  toolName: Scalars['String']['input'];
  type: ContentPartType;
  url?: InputMaybe<Scalars['URL']['input']>;
};

export type UpdateAssistantContentInput = {
  args?: InputMaybe<Scalars['String']['input']>;
  error?: InputMaybe<Scalars['String']['input']>;
  messageId: Scalars['OID']['input'];
  partId: Scalars['OID']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUsageSummaryInput = {
  totalCompletionTokens?: InputMaybe<Scalars['Int']['input']>;
  totalMessages?: InputMaybe<Scalars['Int']['input']>;
  totalPromptTokens?: InputMaybe<Scalars['Int']['input']>;
  totalSteps?: InputMaybe<Scalars['Int']['input']>;
  totalTokens?: InputMaybe<Scalars['Int']['input']>;
  totalToolCalls?: InputMaybe<Scalars['Int']['input']>;
};

export type UsageSummary = {
  totalCompletionTokens: Scalars['Int']['output'];
  totalMessages: Scalars['Int']['output'];
  totalPromptTokens: Scalars['Int']['output'];
  totalSteps: Scalars['Int']['output'];
  totalTokens: Scalars['Int']['output'];
  totalToolCalls: Scalars['Int']['output'];
};

export type UserContentPartInput = {
  attachment?: InputMaybe<Scalars['String']['input']>;
  filename?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  mediaType?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  type: ContentPartType;
  url?: InputMaybe<Scalars['URL']['input']>;
};
