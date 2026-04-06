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

export type AddStakeholderInput = {
  /** Optional URL to profile picture or avatar */
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  /** Optional Ethereum wallet address for identity verification */
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  /** Unique identifier for the stakeholder */
  id: Scalars["OID"]["input"];
  /** Display name for the stakeholder */
  name: Scalars["String"]["input"];
};

/**
 * Root state for the Agent Inbox document model.
 * Manages communication between a single agent and multiple stakeholders through threaded conversations.
 */
export type AgentInboxState = {
  /**
   * The agent who owns and manages this inbox.
   * Contains profile information and contact details for the agent.
   */
  agent: AgentInfo;
  /**
   * List of authorized stakeholders who can communicate with the agent.
   * Stakeholders must be added before they can create threads.
   */
  stakeholders: Array<Stakeholder>;
  /**
   * Active and archived conversation threads between the agent and stakeholders.
   * Each thread represents a distinct conversation topic with one stakeholder.
   */
  threads: Array<MessageThread>;
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
  /** Display name of the agent for identification in conversations */
  name: Maybe<Scalars["String"]["output"]>;
  /** Professional role or title describing the agent's responsibilities */
  role: Maybe<Scalars["String"]["output"]>;
};

export type ArchiveThreadInput = {
  /** Which party is archiving the thread (Agent or Stakeholder) */
  archivedBy: ParticipantRole;
  /** ID of the thread to archive */
  threadId: Scalars["OID"]["input"];
};

/**
 * Individual message within a conversation thread.
 * Tracks content, timing, direction, and read status.
 */
export type ChatMessage = {
  /** The actual text content of the message */
  content: Scalars["String"]["output"];
  /** Direction of message flow (Incoming from stakeholder, Outgoing from agent) */
  flow: Flow;
  /** Unique identifier for this message */
  id: Scalars["OID"]["output"];
  /** Whether the recipient has marked this message as read */
  read: Scalars["Boolean"]["output"];
  /** Timestamp when the message was sent */
  when: Scalars["DateTime"]["output"];
};

export type ConfirmThreadResolvedInput = {
  /** Which party is confirming the resolution (Agent or Stakeholder) */
  confirmedBy: ParticipantRole;
  /** ID of the thread to confirm as resolved */
  threadId: Scalars["OID"]["input"];
};

export type CreateThreadInput = {
  /** Unique identifier for the new thread */
  id: Scalars["OID"]["input"];
  /** The first message to start the conversation */
  initialMessage: InitialMessageInput;
  /** ID of the stakeholder initiating the conversation */
  stakeholder: Scalars["OID"]["input"];
  /** Optional subject line or topic for the thread */
  topic?: InputMaybe<Scalars["String"]["input"]>;
};

export type EditMessageContentInput = {
  /** ID of the message to edit */
  id: Scalars["OID"]["input"];
  /** Updated message text content */
  newContent: Scalars["String"]["input"];
};

/**
 * Direction of message flow within a thread.
 * Determines sender and recipient roles.
 */
export type Flow =
  /** Message sent from stakeholder to agent */
  | "Incoming"
  /** Message sent from agent to stakeholder */
  | "Outgoing";

export type InitialMessageInput = {
  /** The message text content */
  content: Scalars["String"]["input"];
  /** Direction of message (Incoming from stakeholder, Outgoing from agent) */
  flow: Flow;
  /** Unique identifier for the message */
  id: Scalars["OID"]["input"];
  /** Timestamp when the message was sent */
  when: Scalars["DateTime"]["input"];
};

export type MarkMessageReadInput = {
  /** ID of the message to mark as read */
  id: Scalars["OID"]["input"];
};

export type MarkMessageUnreadInput = {
  /** ID of the message to mark as unread */
  id: Scalars["OID"]["input"];
};

/**
 * Represents a conversation thread between the agent and a specific stakeholder.
 * Threads organize messages by topic and track resolution status.
 */
export type MessageThread = {
  /** Unique identifier for this conversation thread */
  id: Scalars["OID"]["output"];
  /** Chronological list of messages exchanged in this thread */
  messages: Array<ChatMessage>;
  /** ID reference to the stakeholder participating in this conversation */
  stakeholder: Scalars["OID"]["output"];
  /** Current workflow status of the thread (open, resolved, archived) */
  status: ThreadStatus;
  /** Optional topic or subject line describing the thread's purpose */
  topic: Maybe<Scalars["String"]["output"]>;
};

export type MoveStakeholderInput = {
  /** ID of the stakeholder to move */
  id: Scalars["OID"]["input"];
  /** ID of stakeholder to insert before. Omit to move to end of list */
  insertBefore?: InputMaybe<Scalars["OID"]["input"]>;
};

/**
 * Identifies which party is performing an action in the workflow.
 * Used for tracking who initiated status changes.
 */
export type ParticipantRole =
  /** Action performed by the agent */
  | "Agent"
  /** Action performed by a stakeholder */
  | "Stakeholder";

export type ProposeThreadResolvedInput = {
  /** Which party is proposing the resolution (Agent or Stakeholder) */
  proposedBy: ParticipantRole;
  /** ID of the thread to propose for resolution */
  threadId: Scalars["OID"]["input"];
};

export type RemoveStakeholderInput = {
  /** ID of the stakeholder to remove */
  id: Scalars["OID"]["input"];
};

export type ReopenThreadInput = {
  /** Which party is reopening the thread (Agent or Stakeholder) */
  reopenedBy: ParticipantRole;
  /** ID of the thread to reopen */
  threadId: Scalars["OID"]["input"];
};

export type SendAgentMessageInput = {
  /** The message text content */
  content: Scalars["String"]["input"];
  /** Unique identifier for the new message */
  messageId: Scalars["OID"]["input"];
  /** ID of the thread to send the message to */
  threadId: Scalars["OID"]["input"];
  /** Timestamp when the message is being sent */
  when: Scalars["DateTime"]["input"];
};

export type SendStakeholderMessageInput = {
  /** The message text content */
  content: Scalars["String"]["input"];
  /** Unique identifier for the new message */
  messageId: Scalars["OID"]["input"];
  /** ID of the thread to send the message to */
  threadId: Scalars["OID"]["input"];
  /** Timestamp when the message is being sent */
  when: Scalars["DateTime"]["input"];
};

export type SetAgentAddressInput = {
  /** Ethereum wallet address for on-chain identity. Null value clears the address */
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetAgentAvatarInput = {
  /** URL to profile picture or avatar. Null value clears the avatar */
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
};

export type SetAgentDescriptionInput = {
  /** Detailed description of services and expertise. Null value clears the description */
  description?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetAgentNameInput = {
  /** The display name to identify the agent in conversations */
  name: Scalars["String"]["input"];
};

export type SetAgentRoleInput = {
  /** Professional role or title. Null value clears the role */
  role?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetStakeholderAddressInput = {
  /** New Ethereum address. Null value clears the address */
  ethAddress?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the stakeholder to update */
  id: Scalars["OID"]["input"];
};

export type SetStakeholderAvatarInput = {
  /** Null value clears the avatar */
  avatar?: InputMaybe<Scalars["URL"]["input"]>;
  id: Scalars["OID"]["input"];
};

export type SetStakeholderNameInput = {
  /** ID of the stakeholder to update */
  id: Scalars["OID"]["input"];
  /** New display name for the stakeholder */
  name: Scalars["String"]["input"];
};

export type SetThreadTopicInput = {
  /** ID of the thread to update */
  id: Scalars["OID"]["input"];
  /** New topic or subject line. Null value clears the topic */
  topic?: InputMaybe<Scalars["String"]["input"]>;
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

/**
 * Workflow states for conversation threads.
 * Tracks progression from open discussion to resolution and archival.
 */
export type ThreadStatus =
  /** Thread has been archived and removed from active view */
  | "Archived"
  /** Both parties have agreed the thread is resolved */
  | "ConfirmedResolved"
  /** Thread is active and accepting new messages */
  | "Open"
  /** Agent has proposed marking the thread as resolved, awaiting stakeholder confirmation */
  | "ProposedResolvedByAgent"
  /** Stakeholder has proposed marking the thread as resolved, awaiting agent confirmation */
  | "ProposedResolvedByStakeholder";
