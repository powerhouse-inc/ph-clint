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

export type AddDependenciesInput = {
  dependsOn: Array<Scalars["OID"]["input"]>;
  goalId: Scalars["OID"]["input"];
};

export type AddNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  goalId: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
  noteId: Scalars["OID"]["input"];
};

export type ClearInstructionsInput = {
  goalId: Scalars["OID"]["input"];
};

export type ClearNotesInput = {
  goalId: Scalars["OID"]["input"];
};

export type CompletedNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type CreateGoalInput = {
  assignee?: InputMaybe<Scalars["String"]["input"]>;
  dependsOn?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  description: Scalars["String"]["input"];
  draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["OID"]["input"];
  initialNote?: InputMaybe<InitialNoteInput>;
  insertBefore?: InputMaybe<Scalars["OID"]["input"]>;
  instructions?: InputMaybe<InitialInstructionsInput>;
  metaData?: InputMaybe<MetaDataInput>;
  parentId?: InputMaybe<Scalars["OID"]["input"]>;
};

export type DelegateGoalInput = {
  assignee: Scalars["String"]["input"];
  id: Scalars["OID"]["input"];
};

export type Goal = {
  assignee: Maybe<Scalars["String"]["output"]>;
  block: Maybe<GoalBlockReason>;
  dependencies: Array<Scalars["OID"]["output"]>;
  description: Scalars["String"]["output"];
  id: Scalars["OID"]["output"];
  instructions: Maybe<GoalInstructions>;
  isDraft: Scalars["Boolean"]["output"];
  notes: Array<Note>;
  outcome: Maybe<MetaData>;
  parentId: Maybe<Scalars["OID"]["output"]>;
  status: GoalStatus;
};

export type GoalBlockReason = {
  comment: Maybe<Scalars["String"]["output"]>;
  type: GoalBlockType;
};

export type GoalBlockType =
  | "AWAITING_APPROVAL"
  | "MISSING_INFORMATION"
  | "OTHER"
  | "UNFINISHED_DEPENDENCIES";

export type GoalInstructions = {
  comments: Scalars["String"]["output"];
  context: Maybe<MetaData>;
  workId: Maybe<Scalars["String"]["output"]>;
  workType: Maybe<WorkType>;
};

export type GoalStatus =
  | "BLOCKED"
  /** Finished statuses */
  | "COMPLETED"
  | "DELEGATED"
  /** Active statuses */
  | "IN_PROGRESS"
  | "IN_REVIEW"
  /** Waiting statuses */
  | "TODO"
  | "WONT_DO";

export type InProgressNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type InitialInstructionsInput = {
  comments: Scalars["String"]["input"];
  contextJSON?: InputMaybe<Scalars["String"]["input"]>;
  workId?: InputMaybe<Scalars["String"]["input"]>;
  workType?: InputMaybe<WorkType>;
};

export type InitialNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type InstructionsUpdate = {
  comments: Scalars["String"]["input"];
  contextJSON?: InputMaybe<Scalars["String"]["input"]>;
  workId?: InputMaybe<Scalars["String"]["input"]>;
  workType?: InputMaybe<WorkType>;
};

export type MarkAsDraftInput = {
  goalId: Scalars["OID"]["input"];
};

export type MarkAsReadyInput = {
  goalId: Scalars["OID"]["input"];
};

export type MarkCompletedInput = {
  id: Scalars["OID"]["input"];
  note?: InputMaybe<CompletedNoteInput>;
  outcome?: InputMaybe<OutcomeInput>;
};

export type MarkInProgressInput = {
  id: Scalars["OID"]["input"];
  note?: InputMaybe<InProgressNoteInput>;
};

export type MarkTodoInput = {
  id: Scalars["OID"]["input"];
  note?: InputMaybe<TodoNoteInput>;
};

export type MarkWontDoInput = {
  id: Scalars["OID"]["input"];
};

export type MetaData = {
  data: Scalars["String"]["output"];
  format: MetaDataFormat;
};

export type MetaDataFormat = "JSON" | "OTHER" | "TEXT";

export type MetaDataInput = {
  data: Scalars["String"]["input"];
  format: MetaDataFormat;
};

export type Note = {
  author: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  note: Scalars["String"]["output"];
};

export type OutcomeInput = {
  data: Scalars["String"]["input"];
  format: MetaDataFormat;
};

export type RemoveDependenciesInput = {
  dependencies: Array<Scalars["OID"]["input"]>;
  goalId: Scalars["OID"]["input"];
};

export type RemoveNoteInput = {
  goalId: Scalars["OID"]["input"];
  noteId: Scalars["OID"]["input"];
};

export type ReorderInput = {
  goalId: Scalars["OID"]["input"];
  /** Omit for appending at the end */
  insertBefore?: InputMaybe<Scalars["OID"]["input"]>;
  /** Omit for root goals */
  parentId?: InputMaybe<Scalars["OID"]["input"]>;
};

export type ReportBlockedInput = {
  comment?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  type: GoalBlockType;
};

export type ReportNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type ReportOnGoalInput = {
  id: Scalars["OID"]["input"];
  moveInReview: Scalars["Boolean"]["input"];
  note: ReportNoteInput;
};

export type SetMetaDataInput = {
  data: Scalars["String"]["input"];
  format: MetaDataFormat;
};

export type SetOwnerInput = {
  owner: Scalars["String"]["input"];
};

export type SetReferencesInput = {
  references: Array<Scalars["URL"]["input"]>;
};

export type TodoNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type UnblockGoalInput = {
  id: Scalars["OID"]["input"];
  response: UnblockNoteInput;
};

export type UnblockNoteInput = {
  author?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  note: Scalars["String"]["input"];
};

export type UpdateDescriptionInput = {
  description: Scalars["String"]["input"];
  goalId: Scalars["OID"]["input"];
};

export type UpdateInstructionsInput = {
  goalId: Scalars["OID"]["input"];
  instructions: InstructionsUpdate;
};

export type WorkBreakdownStructureState = {
  goals: Array<Goal>;
  isBlocked: Scalars["Boolean"]["output"];
  metaData: Maybe<MetaData>;
  owner: Maybe<Scalars["String"]["output"]>;
  references: Array<Scalars["URL"]["output"]>;
};

export type WorkType = "SCENARIO" | "SKILL" | "TASK";
