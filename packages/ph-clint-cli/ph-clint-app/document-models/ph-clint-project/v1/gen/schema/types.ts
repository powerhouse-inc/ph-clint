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

export type AddAgentProfileRefInput = {
  agentId: Scalars['OID']['input'];
  insertBefore?: InputMaybe<Scalars['OID']['input']>;
  profileId: Scalars['OID']['input'];
};

export type AddAgentSkillInput = {
  agentId: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type AddAgentToolPatternInput = {
  agentId: Scalars['OID']['input'];
  pattern: Scalars['String']['input'];
};

export type AddExternalSkillInput = {
  githubUrl: Scalars['URL']['input'];
  id: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type AddModelInput = {
  id: Scalars['OID']['input'];
};

export type AddPackageDocumentTypeInput = {
  documentType: Scalars['String']['input'];
  packageId: Scalars['OID']['input'];
};

export type AddPowerhousePackageInput = {
  id: Scalars['OID']['input'];
  packageName: Scalars['String']['input'];
};

export type AddProfileInput = {
  content: Scalars['String']['input'];
  id: Scalars['OID']['input'];
  insertBefore?: InputMaybe<Scalars['OID']['input']>;
  title: Scalars['String']['input'];
};

export type AddSubAgentInput = {
  description: Scalars['String']['input'];
  id: Scalars['OID']['input'];
  modelId: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type AddSupportedResourceInput = {
  resource: Scalars['String']['input'];
};

export type BumpVersionInput = {
  version: Scalars['String']['input'];
};

export type ClearMainAgentDescriptionInput = {
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ClearMainAgentImageInput = {
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DisableMastraInput = {
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DisableRoutineInput = {
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EnableMastraInput = {
  agentId: Scalars['OID']['input'];
  agentName: Scalars['String']['input'];
};

export type EnableRoutineInput = {
  _?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ExternalSkill = {
  githubUrl: Scalars['URL']['output'];
  id: Scalars['OID']['output'];
  name: Scalars['String']['output'];
};

export type ImportMainAgentInput = {
  attachment?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  modelId: Scalars['OID']['input'];
  name: Scalars['String']['input'];
  profileIds: Array<Scalars['OID']['input']>;
  skills: Array<Scalars['String']['input']>;
  toolPatterns: Array<Scalars['String']['input']>;
};

export type ImportModelInput = {
  id: Scalars['OID']['input'];
};

export type ImportPackageInput = {
  documentTypes: Array<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  packageName: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ImportProfileInput = {
  content: Scalars['String']['input'];
  id: Scalars['OID']['input'];
  title: Scalars['String']['input'];
};

export type ImportSkillInput = {
  githubUrl: Scalars['URL']['input'];
  id: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type ImportSpecInput = {
  description: Scalars['String']['input'];
  enableChat?: InputMaybe<Scalars['Boolean']['input']>;
  externalSkills: Array<ImportSkillInput>;
  mainAgent?: InputMaybe<ImportMainAgentInput>;
  mastraEnabled: Scalars['Boolean']['input'];
  models: Array<ImportModelInput>;
  name: Scalars['String']['input'];
  observabilityEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  packages: Array<ImportPackageInput>;
  powerhouse: PowerhouseLevel;
  profiles: Array<ImportProfileInput>;
  proxyEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  routineEnabled: Scalars['Boolean']['input'];
  scope?: InputMaybe<Scalars['String']['input']>;
  subAgents: Array<ImportSubAgentInput>;
  supportedResources?: InputMaybe<Array<Scalars['String']['input']>>;
  version: Scalars['String']['input'];
};

export type ImportSubAgentInput = {
  description: Scalars['String']['input'];
  id: Scalars['OID']['input'];
  modelId: Scalars['OID']['input'];
  name: Scalars['String']['input'];
  profileIds: Array<Scalars['OID']['input']>;
  skills: Array<Scalars['String']['input']>;
  toolPatterns: Array<Scalars['String']['input']>;
};

export type PhClintAgentModel = {
  id: Scalars['OID']['output'];
};

export type PhClintAgentProfile = {
  content: Scalars['String']['output'];
  id: Scalars['OID']['output'];
  title: Scalars['String']['output'];
};

export type PhClintDeployment = {
  observabilityEnabled: Scalars['Boolean']['output'];
  proxyEnabled: Scalars['Boolean']['output'];
  supportedResources: Array<Scalars['String']['output']>;
};

export type PhClintFeatures = {
  mastra: PhClintMastraFeature;
  powerhouse: PowerhouseLevel;
  routine: PhClintRoutineFeature;
};

export type PhClintMainAgent = {
  attachment: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  modelId: Scalars['OID']['output'];
  name: Scalars['String']['output'];
  profileIds: Array<Scalars['OID']['output']>;
  skills: Array<Scalars['String']['output']>;
  toolPatterns: Array<Scalars['String']['output']>;
};

export type PhClintMastraCommon = {
  enableChat: Scalars['Boolean']['output'];
};

export type PhClintMastraFeature = {
  common: PhClintMastraCommon;
  enabled: Scalars['Boolean']['output'];
  mainAgent: Maybe<PhClintMainAgent>;
  models: Array<PhClintAgentModel>;
  profiles: Array<PhClintAgentProfile>;
  subAgents: Array<PhClintSubAgent>;
};

export type PhClintProjectState = {
  deployment: PhClintDeployment;
  description: Scalars['String']['output'];
  externalSkills: Array<ExternalSkill>;
  features: PhClintFeatures;
  name: Maybe<Scalars['String']['output']>;
  packages: Array<PowerhousePackage>;
  publishHistory: Array<PublishRecord>;
  scope: Maybe<Scalars['String']['output']>;
  version: Scalars['String']['output'];
};

export type PhClintRoutineFeature = {
  enabled: Scalars['Boolean']['output'];
};

export type PhClintSubAgent = {
  description: Scalars['String']['output'];
  id: Scalars['OID']['output'];
  modelId: Scalars['OID']['output'];
  name: Scalars['String']['output'];
  profileIds: Array<Scalars['OID']['output']>;
  skills: Array<Scalars['String']['output']>;
  toolPatterns: Array<Scalars['String']['output']>;
};

export type PowerhouseLevel = 'Connect' | 'Disabled' | 'Reactor' | 'Switchboard';

export type PowerhousePackage = {
  documentTypes: Array<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  managed: Scalars['Boolean']['output'];
  packageName: Scalars['String']['output'];
  version: Maybe<Scalars['String']['output']>;
};

export type PublishDevInput = {
  id: Scalars['OID']['input'];
  timestamp: Scalars['DateTime']['input'];
};

export type PublishProductionInput = {
  id: Scalars['OID']['input'];
  timestamp: Scalars['DateTime']['input'];
};

export type PublishRecord = {
  id: Scalars['OID']['output'];
  status: PublishStatus;
  tag: PublishTag;
  timestamp: Scalars['DateTime']['output'];
  version: Scalars['String']['output'];
};

export type PublishStagingInput = {
  id: Scalars['OID']['input'];
  timestamp: Scalars['DateTime']['input'];
};

export type PublishStatus = 'Failed' | 'InProgress' | 'Pending' | 'Succeeded';

export type PublishTag = 'Dev' | 'Production' | 'Staging';

export type RemoveAgentProfileRefInput = {
  agentId: Scalars['OID']['input'];
  profileId: Scalars['OID']['input'];
};

export type RemoveAgentSkillInput = {
  agentId: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type RemoveAgentToolPatternInput = {
  agentId: Scalars['OID']['input'];
  pattern: Scalars['String']['input'];
};

export type RemoveExternalSkillInput = {
  id: Scalars['OID']['input'];
};

export type RemoveModelInput = {
  id: Scalars['OID']['input'];
};

export type RemovePackageDocumentTypeInput = {
  documentType: Scalars['String']['input'];
  packageId: Scalars['OID']['input'];
};

export type RemovePowerhousePackageInput = {
  id: Scalars['OID']['input'];
};

export type RemoveProfileInput = {
  id: Scalars['OID']['input'];
};

export type RemoveSubAgentInput = {
  id: Scalars['OID']['input'];
};

export type RemoveSupportedResourceInput = {
  resource: Scalars['String']['input'];
};

export type ReorderAgentProfileRefsInput = {
  agentId: Scalars['OID']['input'];
  ids: Array<Scalars['OID']['input']>;
  insertBefore?: InputMaybe<Scalars['OID']['input']>;
};

export type ReorderProfilesInput = {
  ids: Array<Scalars['OID']['input']>;
  insertBefore?: InputMaybe<Scalars['OID']['input']>;
};

export type SetAgentModelInput = {
  agentId: Scalars['OID']['input'];
  modelId: Scalars['OID']['input'];
};

export type SetDescriptionInput = {
  description: Scalars['String']['input'];
};

export type SetEnableChatInput = {
  enabled: Scalars['Boolean']['input'];
};

export type SetExternalSkillGithubUrlInput = {
  githubUrl: Scalars['URL']['input'];
  id: Scalars['OID']['input'];
};

export type SetExternalSkillNameInput = {
  id: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type SetMainAgentDescriptionInput = {
  description: Scalars['String']['input'];
};

export type SetMainAgentImageInput = {
  attachment: Scalars['String']['input'];
};

export type SetMainAgentNameInput = {
  name: Scalars['String']['input'];
};

export type SetObservabilityEnabledInput = {
  enabled: Scalars['Boolean']['input'];
};

export type SetPackageIdentifierInput = {
  identifier: Scalars['String']['input'];
};

export type SetPackageVersionInput = {
  packageId: Scalars['OID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};

export type SetPowerhouseLevelInput = {
  level: PowerhouseLevel;
  skipAutoProxy?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SetProxyEnabledInput = {
  enabled: Scalars['Boolean']['input'];
};

export type SetPublishStatusInput = {
  id: Scalars['OID']['input'];
  status: PublishStatus;
};

export type SetSubAgentDescriptionInput = {
  description: Scalars['String']['input'];
  id: Scalars['OID']['input'];
};

export type SetSubAgentNameInput = {
  id: Scalars['OID']['input'];
  name: Scalars['String']['input'];
};

export type SetVersionInput = {
  version: Scalars['String']['input'];
};

export type UpdateProfileInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};
