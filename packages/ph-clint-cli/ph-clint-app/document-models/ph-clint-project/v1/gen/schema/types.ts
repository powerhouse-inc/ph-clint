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

export type AddExternalSkillInput = {
  githubUrl: Scalars["URL"]["input"];
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type AddModelInput = {
  id: Scalars["String"]["input"];
  isDefault?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type AddPackageDocumentTypeInput = {
  documentType: Scalars["String"]["input"];
  packageId: Scalars["OID"]["input"];
};

export type AddPowerhousePackageInput = {
  id: Scalars["OID"]["input"];
  packageName: Scalars["String"]["input"];
};

export type AddProfileInput = {
  content: Scalars["String"]["input"];
  id: Scalars["String"]["input"];
  insertBefore?: InputMaybe<Scalars["String"]["input"]>;
  title: Scalars["String"]["input"];
};

export type AddSupportedResourceInput = {
  resource: Scalars["String"]["input"];
};

export type BumpVersionInput = {
  version: Scalars["String"]["input"];
};

export type DisableMastraInput = {
  _?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type DisableRoutineInput = {
  _?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type EnableMastraInput = {
  agentId: Scalars["String"]["input"];
  agentName: Scalars["String"]["input"];
};

export type EnableRoutineInput = {
  _?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ExternalSkill = {
  githubUrl: Scalars["URL"]["output"];
  id: Scalars["OID"]["output"];
  name: Scalars["String"]["output"];
};

export type ImportModelInput = {
  id: Scalars["String"]["input"];
  isDefault: Scalars["Boolean"]["input"];
};

export type ImportPackageInput = {
  documentTypes: Array<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  packageName: Scalars["String"]["input"];
};

export type ImportProfileInput = {
  content: Scalars["String"]["input"];
  id: Scalars["String"]["input"];
  title: Scalars["String"]["input"];
};

export type ImportSkillInput = {
  githubUrl: Scalars["URL"]["input"];
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type ImportSpecInput = {
  agentId?: InputMaybe<Scalars["String"]["input"]>;
  agentName?: InputMaybe<Scalars["String"]["input"]>;
  description: Scalars["String"]["input"];
  externalSkills: Array<ImportSkillInput>;
  mastraEnabled: Scalars["Boolean"]["input"];
  models?: InputMaybe<Array<ImportModelInput>>;
  name: Scalars["String"]["input"];
  packages: Array<ImportPackageInput>;
  powerhouse: PowerhouseLevel;
  profiles?: InputMaybe<Array<ImportProfileInput>>;
  routineEnabled: Scalars["Boolean"]["input"];
  scope?: InputMaybe<Scalars["String"]["input"]>;
  version: Scalars["String"]["input"];
};

export type PhClintAgentModel = {
  id: Scalars["String"]["output"];
  isDefault: Scalars["Boolean"]["output"];
};

export type PhClintAgentProfile = {
  content: Scalars["String"]["output"];
  id: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
};

export type PhClintDeployment = {
  proxyEnabled: Scalars["Boolean"]["output"];
  supportedResources: Array<Scalars["String"]["output"]>;
};

export type PhClintFeatures = {
  mastra: PhClintMastraFeature;
  powerhouse: PowerhouseLevel;
  routine: PhClintRoutineFeature;
};

export type PhClintMastraFeature = {
  agentDescription: Maybe<Scalars["String"]["output"]>;
  agentId: Maybe<Scalars["String"]["output"]>;
  agentImage: Maybe<Scalars["URL"]["output"]>;
  agentName: Maybe<Scalars["String"]["output"]>;
  enabled: Scalars["Boolean"]["output"];
  models: Array<PhClintAgentModel>;
  profiles: Array<PhClintAgentProfile>;
};

export type PhClintProjectState = {
  deployment: PhClintDeployment;
  description: Scalars["String"]["output"];
  externalSkills: Array<ExternalSkill>;
  features: PhClintFeatures;
  name: Maybe<Scalars["String"]["output"]>;
  packages: Array<PowerhousePackage>;
  publishHistory: Array<PublishRecord>;
  scope: Maybe<Scalars["String"]["output"]>;
  version: Scalars["String"]["output"];
};

export type PhClintRoutineFeature = {
  enabled: Scalars["Boolean"]["output"];
};

export type PowerhouseLevel =
  | "Connect"
  | "Disabled"
  | "Reactor"
  | "Switchboard";

export type PowerhousePackage = {
  documentTypes: Array<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  packageName: Scalars["String"]["output"];
};

export type PublishDevInput = {
  id: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type PublishProductionInput = {
  id: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type PublishRecord = {
  id: Scalars["OID"]["output"];
  status: PublishStatus;
  tag: PublishTag;
  timestamp: Scalars["DateTime"]["output"];
  version: Scalars["String"]["output"];
};

export type PublishStagingInput = {
  id: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type PublishStatus = "Failed" | "InProgress" | "Pending" | "Succeeded";

export type PublishTag = "Dev" | "Production" | "Staging";

export type RemoveExternalSkillInput = {
  id: Scalars["OID"]["input"];
};

export type RemoveModelInput = {
  id: Scalars["String"]["input"];
};

export type RemovePackageDocumentTypeInput = {
  documentType: Scalars["String"]["input"];
  packageId: Scalars["OID"]["input"];
};

export type RemovePowerhousePackageInput = {
  id: Scalars["OID"]["input"];
};

export type RemoveProfileInput = {
  id: Scalars["String"]["input"];
};

export type RemoveSupportedResourceInput = {
  resource: Scalars["String"]["input"];
};

export type ReorderProfilesInput = {
  ids: Array<Scalars["String"]["input"]>;
  insertBefore?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetAgentDescriptionInput = {
  description: Scalars["String"]["input"];
};

export type SetAgentIdInput = {
  agentId: Scalars["String"]["input"];
};

export type SetAgentImageInput = {
  image: Scalars["URL"]["input"];
};

export type SetAgentNameInput = {
  agentName: Scalars["String"]["input"];
};

export type SetDefaultModelInput = {
  id: Scalars["String"]["input"];
};

export type SetDescriptionInput = {
  description: Scalars["String"]["input"];
};

export type SetExternalSkillGithubUrlInput = {
  githubUrl: Scalars["URL"]["input"];
  id: Scalars["OID"]["input"];
};

export type SetExternalSkillNameInput = {
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type SetPackageIdentifierInput = {
  identifier: Scalars["String"]["input"];
};

export type SetPowerhouseLevelInput = {
  level: PowerhouseLevel;
  skipAutoProxy?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type SetProxyEnabledInput = {
  enabled: Scalars["Boolean"]["input"];
};

export type SetPublishStatusInput = {
  id: Scalars["OID"]["input"];
  status: PublishStatus;
};

export type SetVersionInput = {
  version: Scalars["String"]["input"];
};

export type UpdateProfileInput = {
  content?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["String"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
};
