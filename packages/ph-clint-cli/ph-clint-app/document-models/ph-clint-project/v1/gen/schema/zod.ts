/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as z from 'zod';
import type {
  AddExternalSkillInput,
  AddModelInput,
  AddPackageDocumentTypeInput,
  AddPowerhousePackageInput,
  AddProfileInput,
  BumpVersionInput,
  ClearBinInput,
  ClearScopeInput,
  DisableMastraInput,
  DisableRoutineInput,
  EnableMastraInput,
  EnableRoutineInput,
  ExternalSkill,
  ImportModelInput,
  ImportPackageInput,
  ImportProfileInput,
  ImportSkillInput,
  ImportSpecInput,
  PhClintAgentModel,
  PhClintAgentProfile,
  PhClintFeatures,
  PhClintMastraFeature,
  PhClintProjectState,
  PhClintRoutineFeature,
  PowerhouseLevel,
  PowerhousePackage,
  PublishDevInput,
  PublishProductionInput,
  PublishRecord,
  PublishStagingInput,
  PublishStatus,
  PublishTag,
  RemoveExternalSkillInput,
  RemoveModelInput,
  RemovePackageDocumentTypeInput,
  RemovePowerhousePackageInput,
  RemoveProfileInput,
  ReorderProfilesInput,
  SetAgentIdInput,
  SetAgentNameInput,
  SetBinInput,
  SetDefaultModelInput,
  SetDescriptionInput,
  SetExternalSkillGithubUrlInput,
  SetExternalSkillNameInput,
  SetPackageNameInput,
  SetPowerhouseLevelInput,
  SetPublishStatusInput,
  SetScopeInput,
  SetVersionInput,
  UpdateProfileInput,
} from './types.js';

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const PowerhouseLevelSchema = z.enum(['Connect', 'Disabled', 'Reactor', 'Switchboard']);

export const PublishStatusSchema = z.enum(['Failed', 'InProgress', 'Pending', 'Succeeded']);

export const PublishTagSchema = z.enum(['Dev', 'Production', 'Staging']);

export function AddExternalSkillInputSchema(): z.ZodObject<Properties<AddExternalSkillInput>> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function AddModelInputSchema(): z.ZodObject<Properties<AddModelInput>> {
  return z.object({
    id: z.string(),
    isDefault: z.boolean().nullish(),
  });
}

export function AddPackageDocumentTypeInputSchema(): z.ZodObject<Properties<AddPackageDocumentTypeInput>> {
  return z.object({
    documentType: z.string(),
    packageId: z.string(),
  });
}

export function AddPowerhousePackageInputSchema(): z.ZodObject<Properties<AddPowerhousePackageInput>> {
  return z.object({
    id: z.string(),
    packageName: z.string(),
  });
}

export function AddProfileInputSchema(): z.ZodObject<Properties<AddProfileInput>> {
  return z.object({
    content: z.string(),
    id: z.string(),
    insertBefore: z.string().nullish(),
    title: z.string(),
  });
}

export function BumpVersionInputSchema(): z.ZodObject<Properties<BumpVersionInput>> {
  return z.object({
    version: z.string(),
  });
}

export function ClearBinInputSchema(): z.ZodObject<Properties<ClearBinInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ClearScopeInputSchema(): z.ZodObject<Properties<ClearScopeInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function DisableMastraInputSchema(): z.ZodObject<Properties<DisableMastraInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function DisableRoutineInputSchema(): z.ZodObject<Properties<DisableRoutineInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function EnableMastraInputSchema(): z.ZodObject<Properties<EnableMastraInput>> {
  return z.object({
    agentId: z.string(),
    agentName: z.string(),
  });
}

export function EnableRoutineInputSchema(): z.ZodObject<Properties<EnableRoutineInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ExternalSkillSchema(): z.ZodObject<Properties<ExternalSkill>> {
  return z.object({
    __typename: z.literal('ExternalSkill').optional(),
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function ImportModelInputSchema(): z.ZodObject<Properties<ImportModelInput>> {
  return z.object({
    id: z.string(),
    isDefault: z.boolean(),
  });
}

export function ImportPackageInputSchema(): z.ZodObject<Properties<ImportPackageInput>> {
  return z.object({
    documentTypes: z.array(z.string()),
    id: z.string(),
    packageName: z.string(),
  });
}

export function ImportProfileInputSchema(): z.ZodObject<Properties<ImportProfileInput>> {
  return z.object({
    content: z.string(),
    id: z.string(),
    title: z.string(),
  });
}

export function ImportSkillInputSchema(): z.ZodObject<Properties<ImportSkillInput>> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
    name: z.string(),
  });
}

export function ImportSpecInputSchema(): z.ZodObject<Properties<ImportSpecInput>> {
  return z.object({
    agentId: z.string().nullish(),
    agentName: z.string().nullish(),
    bin: z.string().nullish(),
    description: z.string(),
    externalSkills: z.array(z.lazy(() => ImportSkillInputSchema())),
    mastraEnabled: z.boolean(),
    models: z.array(z.lazy(() => ImportModelInputSchema())).nullish(),
    name: z.string(),
    packages: z.array(z.lazy(() => ImportPackageInputSchema())),
    powerhouse: PowerhouseLevelSchema,
    profiles: z.array(z.lazy(() => ImportProfileInputSchema())).nullish(),
    routineEnabled: z.boolean(),
    scope: z.string().nullish(),
    version: z.string(),
  });
}

export function PhClintAgentModelSchema(): z.ZodObject<Properties<PhClintAgentModel>> {
  return z.object({
    __typename: z.literal('PhClintAgentModel').optional(),
    id: z.string(),
    isDefault: z.boolean(),
  });
}

export function PhClintAgentProfileSchema(): z.ZodObject<Properties<PhClintAgentProfile>> {
  return z.object({
    __typename: z.literal('PhClintAgentProfile').optional(),
    content: z.string(),
    id: z.string(),
    title: z.string(),
  });
}

export function PhClintFeaturesSchema(): z.ZodObject<Properties<PhClintFeatures>> {
  return z.object({
    __typename: z.literal('PhClintFeatures').optional(),
    mastra: z.lazy(() => PhClintMastraFeatureSchema()),
    powerhouse: PowerhouseLevelSchema,
    routine: z.lazy(() => PhClintRoutineFeatureSchema()),
  });
}

export function PhClintMastraFeatureSchema(): z.ZodObject<Properties<PhClintMastraFeature>> {
  return z.object({
    __typename: z.literal('PhClintMastraFeature').optional(),
    agentId: z.string().nullish(),
    agentName: z.string().nullish(),
    enabled: z.boolean(),
    models: z.array(z.lazy(() => PhClintAgentModelSchema())),
    profiles: z.array(z.lazy(() => PhClintAgentProfileSchema())),
  });
}

export function PhClintProjectStateSchema(): z.ZodObject<Properties<PhClintProjectState>> {
  return z.object({
    __typename: z.literal('PhClintProjectState').optional(),
    bin: z.string().nullish(),
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

export function PhClintRoutineFeatureSchema(): z.ZodObject<Properties<PhClintRoutineFeature>> {
  return z.object({
    __typename: z.literal('PhClintRoutineFeature').optional(),
    enabled: z.boolean(),
  });
}

export function PowerhousePackageSchema(): z.ZodObject<Properties<PowerhousePackage>> {
  return z.object({
    __typename: z.literal('PowerhousePackage').optional(),
    documentTypes: z.array(z.string()),
    id: z.string(),
    packageName: z.string(),
  });
}

export function PublishDevInputSchema(): z.ZodObject<Properties<PublishDevInput>> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function PublishProductionInputSchema(): z.ZodObject<Properties<PublishProductionInput>> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function PublishRecordSchema(): z.ZodObject<Properties<PublishRecord>> {
  return z.object({
    __typename: z.literal('PublishRecord').optional(),
    id: z.string(),
    status: PublishStatusSchema,
    tag: PublishTagSchema,
    timestamp: z.iso.datetime(),
    version: z.string(),
  });
}

export function PublishStagingInputSchema(): z.ZodObject<Properties<PublishStagingInput>> {
  return z.object({
    id: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function RemoveExternalSkillInputSchema(): z.ZodObject<Properties<RemoveExternalSkillInput>> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveModelInputSchema(): z.ZodObject<Properties<RemoveModelInput>> {
  return z.object({
    id: z.string(),
  });
}

export function RemovePackageDocumentTypeInputSchema(): z.ZodObject<Properties<RemovePackageDocumentTypeInput>> {
  return z.object({
    documentType: z.string(),
    packageId: z.string(),
  });
}

export function RemovePowerhousePackageInputSchema(): z.ZodObject<Properties<RemovePowerhousePackageInput>> {
  return z.object({
    id: z.string(),
  });
}

export function RemoveProfileInputSchema(): z.ZodObject<Properties<RemoveProfileInput>> {
  return z.object({
    id: z.string(),
  });
}

export function ReorderProfilesInputSchema(): z.ZodObject<Properties<ReorderProfilesInput>> {
  return z.object({
    ids: z.array(z.string()),
    insertBefore: z.string().nullish(),
  });
}

export function SetAgentIdInputSchema(): z.ZodObject<Properties<SetAgentIdInput>> {
  return z.object({
    agentId: z.string(),
  });
}

export function SetAgentNameInputSchema(): z.ZodObject<Properties<SetAgentNameInput>> {
  return z.object({
    agentName: z.string(),
  });
}

export function SetBinInputSchema(): z.ZodObject<Properties<SetBinInput>> {
  return z.object({
    bin: z.string(),
  });
}

export function SetDefaultModelInputSchema(): z.ZodObject<Properties<SetDefaultModelInput>> {
  return z.object({
    id: z.string(),
  });
}

export function SetDescriptionInputSchema(): z.ZodObject<Properties<SetDescriptionInput>> {
  return z.object({
    description: z.string(),
  });
}

export function SetExternalSkillGithubUrlInputSchema(): z.ZodObject<Properties<SetExternalSkillGithubUrlInput>> {
  return z.object({
    githubUrl: z.url(),
    id: z.string(),
  });
}

export function SetExternalSkillNameInputSchema(): z.ZodObject<Properties<SetExternalSkillNameInput>> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function SetPackageNameInputSchema(): z.ZodObject<Properties<SetPackageNameInput>> {
  return z.object({
    name: z.string(),
  });
}

export function SetPowerhouseLevelInputSchema(): z.ZodObject<Properties<SetPowerhouseLevelInput>> {
  return z.object({
    level: PowerhouseLevelSchema,
  });
}

export function SetPublishStatusInputSchema(): z.ZodObject<Properties<SetPublishStatusInput>> {
  return z.object({
    id: z.string(),
    status: PublishStatusSchema,
  });
}

export function SetScopeInputSchema(): z.ZodObject<Properties<SetScopeInput>> {
  return z.object({
    scope: z.string(),
  });
}

export function SetVersionInputSchema(): z.ZodObject<Properties<SetVersionInput>> {
  return z.object({
    version: z.string(),
  });
}

export function UpdateProfileInputSchema(): z.ZodObject<Properties<UpdateProfileInput>> {
  return z.object({
    content: z.string().nullish(),
    id: z.string(),
    title: z.string().nullish(),
  });
}
