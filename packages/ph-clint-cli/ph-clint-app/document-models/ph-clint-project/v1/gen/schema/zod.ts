/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from "zod";
import type {
  AddAgentProfileRefInput,
  AddAgentSkillInput,
  AddAgentToolPatternInput,
  AddExternalSkillInput,
  AddModelInput,
  AddPackageDocumentTypeInput,
  AddPowerhousePackageInput,
  AddProfileInput,
  AddSubAgentInput,
  AddSupportedResourceInput,
  BumpVersionInput,
  ClearMainAgentDescriptionInput,
  ClearMainAgentImageInput,
  DisableMastraInput,
  DisableRoutineInput,
  EnableMastraInput,
  EnableRoutineInput,
  ExternalSkill,
  ImportMainAgentInput,
  ImportModelInput,
  ImportPackageInput,
  ImportProfileInput,
  ImportSkillInput,
  ImportSpecInput,
  ImportSubAgentInput,
  PhClintAgentModel,
  PhClintAgentProfile,
  PhClintDeployment,
  PhClintFeatures,
  PhClintMainAgent,
  PhClintMastraCommon,
  PhClintMastraFeature,
  PhClintProjectState,
  PhClintRoutineFeature,
  PhClintSubAgent,
  PowerhouseLevel,
  PowerhousePackage,
  PublishDevInput,
  PublishProductionInput,
  PublishRecord,
  PublishStagingInput,
  PublishStatus,
  PublishTag,
  RemoveAgentProfileRefInput,
  RemoveAgentSkillInput,
  RemoveAgentToolPatternInput,
  RemoveExternalSkillInput,
  RemoveModelInput,
  RemovePackageDocumentTypeInput,
  RemovePowerhousePackageInput,
  RemoveProfileInput,
  RemoveSubAgentInput,
  RemoveSupportedResourceInput,
  ReorderAgentProfileRefsInput,
  ReorderProfilesInput,
  SetAgentModelInput,
  SetDescriptionInput,
  SetEnableChatInput,
  SetExternalSkillGithubUrlInput,
  SetExternalSkillNameInput,
  SetMainAgentDescriptionInput,
  SetMainAgentImageInput,
  SetMainAgentNameInput,
  SetObservabilityEnabledInput,
  SetPackageIdentifierInput,
  SetPackageVersionInput,
  SetPowerhouseLevelInput,
  SetProxyEnabledInput,
  SetPublishStatusInput,
  SetSubAgentDescriptionInput,
  SetSubAgentNameInput,
  SetVersionInput,
  UpdateProfileInput,
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

export const PowerhouseLevelSchema = z.enum([
  "Connect",
  "Disabled",
  "Reactor",
  "Switchboard",
]);

export const PublishStatusSchema = z.enum([
  "Failed",
  "InProgress",
  "Pending",
  "Succeeded",
]);

export const PublishTagSchema = z.enum(["Dev", "Production", "Staging"]);

export function AddAgentProfileRefInputSchema(): z.ZodObject<
  Properties<AddAgentProfileRefInput>
> {
  return z.object({
    agentId: z.string(),
    insertBefore: z.string().nullish(),
    profileId: z.string(),
  });
}

export function AddAgentSkillInputSchema(): z.ZodObject<
  Properties<AddAgentSkillInput>
> {
  return z.object({
    agentId: z.string(),
    name: z.string(),
  });
}

export function AddAgentToolPatternInputSchema(): z.ZodObject<
  Properties<AddAgentToolPatternInput>
> {
  return z.object({
    agentId: z.string(),
    pattern: z.string(),
  });
}

export function AddExternalSkillInputSchema(): z.ZodObject<
  Properties<AddExternalSkillInput>
> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function AddModelInputSchema(): z.ZodObject<Properties<AddModelInput>> {
  return z.object({
    id: z.string(),
  });
}

export function AddPackageDocumentTypeInputSchema(): z.ZodObject<
  Properties<AddPackageDocumentTypeInput>
> {
  return z.object({
    documentType: z.string(),
    packageId: z.string(),
  });
}

export function AddPowerhousePackageInputSchema(): z.ZodObject<
  Properties<AddPowerhousePackageInput>
> {
  return z.object({
    id: z.string(),
    packageName: z.string(),
  });
}

export function AddProfileInputSchema(): z.ZodObject<
  Properties<AddProfileInput>
> {
  return z.object({
    content: z.string(),
    id: z.string(),
    insertBefore: z.string().nullish(),
    title: z.string(),
  });
}

export function AddSubAgentInputSchema(): z.ZodObject<
  Properties<AddSubAgentInput>
> {
  return z.object({
    description: z.string(),
    id: z.string(),
    modelId: z.string(),
    name: z.string(),
  });
}

export function AddSupportedResourceInputSchema(): z.ZodObject<
  Properties<AddSupportedResourceInput>
> {
  return z.object({
    resource: z.string(),
  });
}

export function BumpVersionInputSchema(): z.ZodObject<
  Properties<BumpVersionInput>
> {
  return z.object({
    version: z.string(),
  });
}

export function ClearMainAgentDescriptionInputSchema(): z.ZodObject<
  Properties<ClearMainAgentDescriptionInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ClearMainAgentImageInputSchema(): z.ZodObject<
  Properties<ClearMainAgentImageInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function DisableMastraInputSchema(): z.ZodObject<
  Properties<DisableMastraInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function DisableRoutineInputSchema(): z.ZodObject<
  Properties<DisableRoutineInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function EnableMastraInputSchema(): z.ZodObject<
  Properties<EnableMastraInput>
> {
  return z.object({
    agentId: z.string(),
    agentName: z.string(),
  });
}

export function EnableRoutineInputSchema(): z.ZodObject<
  Properties<EnableRoutineInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ExternalSkillSchema(): z.ZodObject<Properties<ExternalSkill>> {
  return z.object({
    __typename: z.literal("ExternalSkill").optional(),
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function ImportMainAgentInputSchema(): z.ZodObject<
  Properties<ImportMainAgentInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    image: z.string().nullish(),
    modelId: z.string(),
    name: z.string(),
    profileIds: z.array(z.string()),
    skills: z.array(z.string()),
    toolPatterns: z.array(z.string()),
  });
}

export function ImportModelInputSchema(): z.ZodObject<
  Properties<ImportModelInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ImportPackageInputSchema(): z.ZodObject<
  Properties<ImportPackageInput>
> {
  return z.object({
    documentTypes: z.array(z.string()),
    id: z.string(),
    packageName: z.string(),
    version: z.string().nullish(),
  });
}

export function ImportProfileInputSchema(): z.ZodObject<
  Properties<ImportProfileInput>
> {
  return z.object({
    content: z.string(),
    id: z.string(),
    title: z.string(),
  });
}

export function ImportSkillInputSchema(): z.ZodObject<
  Properties<ImportSkillInput>
> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function ImportSpecInputSchema(): z.ZodObject<
  Properties<ImportSpecInput>
> {
  return z.object({
    description: z.string(),
    enableChat: z.boolean().nullish(),
    externalSkills: z.array(z.lazy(() => ImportSkillInputSchema())),
    mainAgent: z.lazy(() => ImportMainAgentInputSchema().nullish()),
    mastraEnabled: z.boolean(),
    models: z.array(z.lazy(() => ImportModelInputSchema())),
    name: z.string(),
    observabilityEnabled: z.boolean().nullish(),
    packages: z.array(z.lazy(() => ImportPackageInputSchema())),
    powerhouse: PowerhouseLevelSchema,
    profiles: z.array(z.lazy(() => ImportProfileInputSchema())),
    proxyEnabled: z.boolean().nullish(),
    routineEnabled: z.boolean(),
    scope: z.string().nullish(),
    subAgents: z.array(z.lazy(() => ImportSubAgentInputSchema())),
    supportedResources: z.array(z.string()).nullish(),
    version: z.string(),
  });
}

export function ImportSubAgentInputSchema(): z.ZodObject<
  Properties<ImportSubAgentInput>
> {
  return z.object({
    description: z.string(),
    id: z.string(),
    modelId: z.string(),
    name: z.string(),
    profileIds: z.array(z.string()),
    skills: z.array(z.string()),
    toolPatterns: z.array(z.string()),
  });
}

export function PhClintAgentModelSchema(): z.ZodObject<
  Properties<PhClintAgentModel>
> {
  return z.object({
    __typename: z.literal("PhClintAgentModel").optional(),
    id: z.string(),
  });
}

export function PhClintAgentProfileSchema(): z.ZodObject<
  Properties<PhClintAgentProfile>
> {
  return z.object({
    __typename: z.literal("PhClintAgentProfile").optional(),
    content: z.string(),
    id: z.string(),
    title: z.string(),
  });
}

export function PhClintDeploymentSchema(): z.ZodObject<
  Properties<PhClintDeployment>
> {
  return z.object({
    __typename: z.literal("PhClintDeployment").optional(),
    observabilityEnabled: z.boolean(),
    proxyEnabled: z.boolean(),
    supportedResources: z.array(z.string()),
  });
}

export function PhClintFeaturesSchema(): z.ZodObject<
  Properties<PhClintFeatures>
> {
  return z.object({
    __typename: z.literal("PhClintFeatures").optional(),
    mastra: z.lazy(() => PhClintMastraFeatureSchema()),
    powerhouse: PowerhouseLevelSchema,
    routine: z.lazy(() => PhClintRoutineFeatureSchema()),
  });
}

export function PhClintMainAgentSchema(): z.ZodObject<
  Properties<PhClintMainAgent>
> {
  return z.object({
    __typename: z.literal("PhClintMainAgent").optional(),
    description: z.string().nullish(),
    id: z.string(),
    image: z.string().nullish(),
    modelId: z.string(),
    name: z.string(),
    profileIds: z.array(z.string()),
    skills: z.array(z.string()),
    toolPatterns: z.array(z.string()),
  });
}

export function PhClintMastraCommonSchema(): z.ZodObject<
  Properties<PhClintMastraCommon>
> {
  return z.object({
    __typename: z.literal("PhClintMastraCommon").optional(),
    enableChat: z.boolean(),
  });
}

export function PhClintMastraFeatureSchema(): z.ZodObject<
  Properties<PhClintMastraFeature>
> {
  return z.object({
    __typename: z.literal("PhClintMastraFeature").optional(),
    common: z.lazy(() => PhClintMastraCommonSchema()),
    enabled: z.boolean(),
    mainAgent: z.lazy(() => PhClintMainAgentSchema().nullish()),
    models: z.array(z.lazy(() => PhClintAgentModelSchema())),
    profiles: z.array(z.lazy(() => PhClintAgentProfileSchema())),
    subAgents: z.array(z.lazy(() => PhClintSubAgentSchema())),
  });
}

export function PhClintProjectStateSchema(): z.ZodObject<
  Properties<PhClintProjectState>
> {
  return z.object({
    __typename: z.literal("PhClintProjectState").optional(),
    deployment: z.lazy(() => PhClintDeploymentSchema()),
    description: z.string(),
    externalSkills: z.array(z.lazy(() => ExternalSkillSchema())),
    features: z.lazy(() => PhClintFeaturesSchema()),
    name: z.string().nullish(),
    packages: z.array(z.lazy(() => PowerhousePackageSchema())),
    publishHistory: z.array(z.lazy(() => PublishRecordSchema())),
    scope: z.string().nullish(),
    version: z.string(),
  });
}

export function PhClintRoutineFeatureSchema(): z.ZodObject<
  Properties<PhClintRoutineFeature>
> {
  return z.object({
    __typename: z.literal("PhClintRoutineFeature").optional(),
    enabled: z.boolean(),
  });
}

export function PhClintSubAgentSchema(): z.ZodObject<
  Properties<PhClintSubAgent>
> {
  return z.object({
    __typename: z.literal("PhClintSubAgent").optional(),
    description: z.string(),
    id: z.string(),
    modelId: z.string(),
    name: z.string(),
    profileIds: z.array(z.string()),
    skills: z.array(z.string()),
    toolPatterns: z.array(z.string()),
  });
}

export function PowerhousePackageSchema(): z.ZodObject<
  Properties<PowerhousePackage>
> {
  return z.object({
    __typename: z.literal("PowerhousePackage").optional(),
    documentTypes: z.array(z.string()),
    id: z.string(),
    managed: z.boolean(),
    packageName: z.string(),
    version: z.string().nullish(),
  });
}

export function PublishDevInputSchema(): z.ZodObject<
  Properties<PublishDevInput>
> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function PublishProductionInputSchema(): z.ZodObject<
  Properties<PublishProductionInput>
> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function PublishRecordSchema(): z.ZodObject<Properties<PublishRecord>> {
  return z.object({
    __typename: z.literal("PublishRecord").optional(),
    id: z.string(),
    status: PublishStatusSchema,
    tag: PublishTagSchema,
    timestamp: z.iso.datetime(),
    version: z.string(),
  });
}

export function PublishStagingInputSchema(): z.ZodObject<
  Properties<PublishStagingInput>
> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function RemoveAgentProfileRefInputSchema(): z.ZodObject<
  Properties<RemoveAgentProfileRefInput>
> {
  return z.object({
    agentId: z.string(),
    profileId: z.string(),
  });
}

export function RemoveAgentSkillInputSchema(): z.ZodObject<
  Properties<RemoveAgentSkillInput>
> {
  return z.object({
    agentId: z.string(),
    name: z.string(),
  });
}

export function RemoveAgentToolPatternInputSchema(): z.ZodObject<
  Properties<RemoveAgentToolPatternInput>
> {
  return z.object({
    agentId: z.string(),
    pattern: z.string(),
  });
}

export function RemoveExternalSkillInputSchema(): z.ZodObject<
  Properties<RemoveExternalSkillInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveModelInputSchema(): z.ZodObject<
  Properties<RemoveModelInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemovePackageDocumentTypeInputSchema(): z.ZodObject<
  Properties<RemovePackageDocumentTypeInput>
> {
  return z.object({
    documentType: z.string(),
    packageId: z.string(),
  });
}

export function RemovePowerhousePackageInputSchema(): z.ZodObject<
  Properties<RemovePowerhousePackageInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveProfileInputSchema(): z.ZodObject<
  Properties<RemoveProfileInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveSubAgentInputSchema(): z.ZodObject<
  Properties<RemoveSubAgentInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveSupportedResourceInputSchema(): z.ZodObject<
  Properties<RemoveSupportedResourceInput>
> {
  return z.object({
    resource: z.string(),
  });
}

export function ReorderAgentProfileRefsInputSchema(): z.ZodObject<
  Properties<ReorderAgentProfileRefsInput>
> {
  return z.object({
    agentId: z.string(),
    ids: z.array(z.string()),
    insertBefore: z.string().nullish(),
  });
}

export function ReorderProfilesInputSchema(): z.ZodObject<
  Properties<ReorderProfilesInput>
> {
  return z.object({
    ids: z.array(z.string()),
    insertBefore: z.string().nullish(),
  });
}

export function SetAgentModelInputSchema(): z.ZodObject<
  Properties<SetAgentModelInput>
> {
  return z.object({
    agentId: z.string(),
    modelId: z.string(),
  });
}

export function SetDescriptionInputSchema(): z.ZodObject<
  Properties<SetDescriptionInput>
> {
  return z.object({
    description: z.string(),
  });
}

export function SetEnableChatInputSchema(): z.ZodObject<
  Properties<SetEnableChatInput>
> {
  return z.object({
    enabled: z.boolean(),
  });
}

export function SetExternalSkillGithubUrlInputSchema(): z.ZodObject<
  Properties<SetExternalSkillGithubUrlInput>
> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
  });
}

export function SetExternalSkillNameInputSchema(): z.ZodObject<
  Properties<SetExternalSkillNameInput>
> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function SetMainAgentDescriptionInputSchema(): z.ZodObject<
  Properties<SetMainAgentDescriptionInput>
> {
  return z.object({
    description: z.string(),
  });
}

export function SetMainAgentImageInputSchema(): z.ZodObject<
  Properties<SetMainAgentImageInput>
> {
  return z.object({
    image: z.string(),
  });
}

export function SetMainAgentNameInputSchema(): z.ZodObject<
  Properties<SetMainAgentNameInput>
> {
  return z.object({
    name: z.string(),
  });
}

export function SetObservabilityEnabledInputSchema(): z.ZodObject<
  Properties<SetObservabilityEnabledInput>
> {
  return z.object({
    enabled: z.boolean(),
  });
}

export function SetPackageIdentifierInputSchema(): z.ZodObject<
  Properties<SetPackageIdentifierInput>
> {
  return z.object({
    identifier: z.string(),
  });
}

export function SetPackageVersionInputSchema(): z.ZodObject<
  Properties<SetPackageVersionInput>
> {
  return z.object({
    packageId: z.string(),
    version: z.string().nullish(),
  });
}

export function SetPowerhouseLevelInputSchema(): z.ZodObject<
  Properties<SetPowerhouseLevelInput>
> {
  return z.object({
    level: PowerhouseLevelSchema,
    skipAutoProxy: z.boolean().nullish(),
  });
}

export function SetProxyEnabledInputSchema(): z.ZodObject<
  Properties<SetProxyEnabledInput>
> {
  return z.object({
    enabled: z.boolean(),
  });
}

export function SetPublishStatusInputSchema(): z.ZodObject<
  Properties<SetPublishStatusInput>
> {
  return z.object({
    id: z.string(),
    status: PublishStatusSchema,
  });
}

export function SetSubAgentDescriptionInputSchema(): z.ZodObject<
  Properties<SetSubAgentDescriptionInput>
> {
  return z.object({
    description: z.string(),
    id: z.string(),
  });
}

export function SetSubAgentNameInputSchema(): z.ZodObject<
  Properties<SetSubAgentNameInput>
> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function SetVersionInputSchema(): z.ZodObject<
  Properties<SetVersionInput>
> {
  return z.object({
    version: z.string(),
  });
}

export function UpdateProfileInputSchema(): z.ZodObject<
  Properties<UpdateProfileInput>
> {
  return z.object({
    content: z.string().nullish(),
    id: z.string(),
    title: z.string().nullish(),
  });
}
