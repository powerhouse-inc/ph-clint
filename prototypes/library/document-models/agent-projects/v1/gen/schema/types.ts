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

export type AddLogEntryInput = {
  message: Scalars["String"]["input"];
  projectId: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type AgentProjectsState = {
  projects: Array<Project>;
};

export type ClearProjectLogsInput = {
  projectId: Scalars["OID"]["input"];
};

export type CreateProjectInput = {
  connectPort?: InputMaybe<Scalars["Int"]["input"]>;
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
  switchboardPort?: InputMaybe<Scalars["Int"]["input"]>;
};

export type CurrentStatus =
  | "DELETED"
  | "INITIALIZING"
  | "MISSING"
  | "RUNNING"
  | "STOPPED";

export type DeleteProjectInput = {
  projectId: Scalars["OID"]["input"];
};

export type LogEntry = {
  message: Scalars["String"]["output"];
  timestamp: Scalars["DateTime"]["output"];
};

export type Project = {
  configuration: ProjectConfig;
  currentStatus: CurrentStatus;
  id: Scalars["OID"]["output"];
  logs: Array<LogEntry>;
  name: Scalars["String"]["output"];
  path: Maybe<Scalars["String"]["output"]>;
  runtime: Maybe<RuntimeInfo>;
  targetedStatus: TargetedStatus;
};

export type ProjectConfig = {
  autoStart: Scalars["Boolean"]["output"];
  connectPort: Scalars["Int"]["output"];
  startupTimeout: Scalars["Int"]["output"];
  switchboardPort: Scalars["Int"]["output"];
};

export type RegisterProjectInput = {
  autoStart: Scalars["Boolean"]["input"];
  connectPort: Scalars["Int"]["input"];
  currentStatus: CurrentStatus;
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
  path: Scalars["String"]["input"];
  startupTimeout: Scalars["Int"]["input"];
  switchboardPort: Scalars["Int"]["input"];
};

export type RunProjectInput = {
  projectId: Scalars["OID"]["input"];
};

export type RuntimeInfo = {
  connectPort: Scalars["Int"]["output"];
  driveUrl: Maybe<Scalars["String"]["output"]>;
  pid: Scalars["Int"]["output"];
  startedAt: Scalars["DateTime"]["output"];
  switchboardPort: Scalars["Int"]["output"];
};

export type StopProjectInput = {
  projectId: Scalars["OID"]["input"];
};

export type TargetedStatus = "DELETED" | "RUNNING" | "STOPPED";

export type UpdateProjectConfigInput = {
  autoStart?: InputMaybe<Scalars["Boolean"]["input"]>;
  connectPort?: InputMaybe<Scalars["Int"]["input"]>;
  projectId: Scalars["OID"]["input"];
  startupTimeout?: InputMaybe<Scalars["Int"]["input"]>;
  switchboardPort?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateProjectStatusInput = {
  currentStatus: CurrentStatus;
  path?: InputMaybe<Scalars["String"]["input"]>;
  projectId: Scalars["OID"]["input"];
};

export type UpdateRuntimeInfoInput = {
  connectPort: Scalars["Int"]["input"];
  driveUrl?: InputMaybe<Scalars["String"]["input"]>;
  pid: Scalars["Int"]["input"];
  projectId: Scalars["OID"]["input"];
  startedAt: Scalars["DateTime"]["input"];
  switchboardPort: Scalars["Int"]["input"];
};
