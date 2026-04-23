/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as z from 'zod';
import type {
  AddExternalSkillInput,
  AddPackageDocumentTypeInput,
  AddPowerhousePackageInput,
  BumpVersionInput,
  ClearBinInput,
  ClearScopeInput,
  DisableMastraInput,
  DisableRoutineInput,
  EnableMastraInput,
  EnableRoutineInput,
  ExternalSkill,
  ImportPackageInput,
  ImportSkillInput,
  ImportSpecInput,
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
  RemovePackageDocumentTypeInput,
  RemovePowerhousePackageInput,
  SetBinInput,
  SetDescriptionInput,
  SetExternalSkillGithubUrlInput,
  SetExternalSkillNameInput,
  SetPackageNameInput,
  SetPowerhouseLevelInput,
  SetPublishStatusInput,
  SetScopeInput,
  SetVersionInput,
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
    _: z.boolean().nullish(),
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

export function ImportPackageInputSchema(): z.ZodObject<Properties<ImportPackageInput>> {
  return z.object({
    documentTypes: z.array(z.string()),
    id: z.string(),
    packageName: z.string(),
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
    bin: z.string().nullish(),
    description: z.string(),
    externalSkills: z.array(z.lazy(() => ImportSkillInputSchema())),
    mastraEnabled: z.boolean(),
    name: z.string(),
    packages: z.array(z.lazy(() => ImportPackageInputSchema())),
    powerhouse: PowerhouseLevelSchema,
    routineEnabled: z.boolean(),
    scope: z.string().nullish(),
    version: z.string(),
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
    enabled: z.boolean(),
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

export function SetBinInputSchema(): z.ZodObject<Properties<SetBinInput>> {
  return z.object({
    bin: z.string(),
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
