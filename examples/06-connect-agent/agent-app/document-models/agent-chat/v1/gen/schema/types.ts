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
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
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

export type AddAgentInput = {
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  role?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddReactionInput = {
  emoji: Scalars["String"]["input"];
  messageId: Scalars["OID"]["input"];
  sender: Scalars["OID"]["input"];
};

export type AddStakeholderInput = {
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type AgentChatState = {
  /** Participating agents */
  agents: Array<AgentInfo>;
  /** Messages in this chat */
  messages: Array<ChatMessage>;
  /** Number of messages that are kept in the chat state */
  pruneLength: Maybe<Scalars["Int"]["output"]>;
  /** Participating stakeholders */
  stakeholders: Array<Stakeholder>;
  /** Optional topic or subject line describing the chat's purpose */
  topic: Maybe<Scalars["String"]["output"]>;
};

/**
 * Profile information for the agent who owns this inbox.
 * Contains identity, role, and contact information.
 */
export type AgentInfo = {
  /** URL to the agent's profile picture or avatar image */
  avatar: Maybe<Scalars["URL"]["output"]>;
  /** Detailed description of the agent's expertise, services, or background */
  description: Maybe<Scalars["String"]["output"]>;
  /** Ethereum wallet address for on-chain identity verification and transactions */
  ethAddress: Maybe<Scalars["String"]["output"]>;
  /** Unique identifier for this agent */
  id: Scalars["OID"]["output"];
  /** Display name of the agent for identification in conversations */
  name: Maybe<Scalars["String"]["output"]>;
  /** Soft deletion flag - true if stakeholder access has been revoked */
  removed: Scalars["Boolean"]["output"];
  /** Professional role or title describing the agent's responsibilities */
  role: Maybe<Scalars["String"]["output"]>;
};

/**
 * Individual message within a conversation thread.
 * Tracks content, timing, direction, and read status.
 */
export type ChatMessage = {
  /** Error message (only for type Error) */
  error: Maybe<Scalars["String"]["output"]>;
  /** Optional hint about the message format (only for types Text, ToolResult and Error.) Not set = unknown. It will switch to Mixed when appending multipe text message with different type */
  format: Maybe<MessageFormat>;
  /** Unique identifier for this message */
  id: Scalars["OID"]["output"];
  /** Recipient Agents or Stakeholders tagged in the message */
  mentioned: Array<Scalars["OID"]["output"]>;
  /** List with reactions, unique sender/emoji combinations */
  reactions: Maybe<Array<Reaction>>;
  /** Which recipients have read the message */
  readBy: Maybe<Array<Scalars["OID"]["output"]>>;
  /** Sender Agent or Stakeholder */
  sender: Scalars["OID"]["output"];
  /** Text chunks in the message (only for type Text) */
  text: Maybe<Array<Scalars["String"]["output"]>>;
  /** Tool call information (only for type ToolCall) */
  toolCall: Maybe<ToolCall>;
  /** Tool results in the message (only for type Text) */
  toolResult: Maybe<ToolResult>;
  /** Mandatory type indication */
  type: MessageType;
  /** Optional timestamp when the last text chunk was appended */
  updated: Maybe<Scalars["DateTime"]["output"]>;
  /** Timestamp when the message was sent */
  when: Scalars["DateTime"]["output"];
};

export type ClearTopicInput = {
  _placeholder?: InputMaybe<Scalars["String"]["input"]>;
};

export type DeleteMessageInput = {
  id: Scalars["OID"]["input"];
};

export type MarkAsReadInput = {
  messageId: Scalars["OID"]["input"];
  readBy: Scalars["OID"]["input"];
};

export type MessageFormat = "Binary" | "Json" | "MarkDown" | "Mixed" | "Text";

export type MessageType = "Error" | "Text" | "ToolCall" | "ToolResult";

export type Reaction = {
  /** Only :cldr-short-name: notation allowed */
  emoji: Scalars["String"]["output"];
  sender: Scalars["OID"]["output"];
};

export type ReaddAgentInput = {
  id: Scalars["OID"]["input"];
};

export type ReaddStakeholderInput = {
  id: Scalars["OID"]["input"];
};

export type RemoveAgentInput = {
  id: Scalars["OID"]["input"];
};

export type RemovePruneLengthInput = {
  _placeholder?: InputMaybe<Scalars["String"]["input"]>;
};

export type RemoveReactionInput = {
  emoji: Scalars["String"]["input"];
  messageId: Scalars["OID"]["input"];
  sender: Scalars["OID"]["input"];
};

export type RemoveStakeholderInput = {
  id: Scalars["OID"]["input"];
};

export type SendErrorInput = {
  error: Scalars["String"]["input"];
  format?: InputMaybe<MessageFormat>;
  id: Scalars["OID"]["input"];
  mentioned?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  sender: Scalars["OID"]["input"];
  when: Scalars["DateTime"]["input"];
};

export type SendTextInput = {
  format?: InputMaybe<MessageFormat>;
  id: Scalars["OID"]["input"];
  mentioned?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  sender: Scalars["OID"]["input"];
  text: Scalars["String"]["input"];
  when: Scalars["DateTime"]["input"];
};

export type SendToolCallInput = {
  argsJson: Scalars["String"]["input"];
  id: Scalars["OID"]["input"];
  mentioned?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  sender: Scalars["OID"]["input"];
  toolName: Scalars["String"]["input"];
  when: Scalars["DateTime"]["input"];
};

export type SendToolResultInput = {
  format?: InputMaybe<MessageFormat>;
  id: Scalars["OID"]["input"];
  isError: Scalars["Boolean"]["input"];
  mentioned?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  result: Scalars["String"]["input"];
  sender: Scalars["OID"]["input"];
  toolName: Scalars["String"]["input"];
  when: Scalars["DateTime"]["input"];
};

export type SetAgentAvatarInput = {
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetAgentDescriptionInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetAgentEthAddressInput = {
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetAgentNameInput = {
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetAgentRoleInput = {
  id: Scalars["OID"]["input"];
  role?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetPruneLengthInput = {
  pruneLength: Scalars["Int"]["input"];
};

export type SetStakeholderAvatarInput = {
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetStakeholderEthAddressInput = {
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetStakeholderNameInput = {
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type SetTopicInput = {
  topic: Scalars["String"]["input"];
};

/**
 * Authorized participant who can communicate with the agent.
 * Contains identity information and removal status.
 */
export type Stakeholder = {
  /** URL to the stakeholder's profile picture or avatar */
  avatar: Maybe<Scalars["URL"]["output"]>;
  /** Optional Ethereum wallet address for identity verification */
  ethAddress: Maybe<Scalars["String"]["output"]>;
  /** Unique identifier for this stakeholder */
  id: Scalars["OID"]["output"];
  /** Display name of the stakeholder for identification */
  name: Scalars["String"]["output"];
  /** Soft deletion flag - true if stakeholder access has been revoked */
  removed: Scalars["Boolean"]["output"];
};

export type ToolCall = {
  argsJson: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
};

export type ToolResult = {
  isError: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  result: Scalars["String"]["output"];
};
