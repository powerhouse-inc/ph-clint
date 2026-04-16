/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as z from "zod";
import type {
  ClearBinInput,
  ClearScopeInput,
  DisableMastraInput,
  DisableRoutineInput,
  EnableMastraInput,
  EnablePowerhouseInput,
  EnableRoutineInput,
  PhClintFeatures,
  PhClintMastraFeature,
  PhClintPowerhouseFeature,
  PhClintProjectState,
  PhClintRoutineFeature,
  SetBinInput,
  SetDescriptionInput,
  SetPackageNameInput,
  SetPowerhouseConnectInput,
  SetPowerhouseSwitchboardInput,
  SetScopeInput,
  SetVersionInput,
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

export function ClearBinInputSchema(): z.ZodObject<Properties<ClearBinInput>> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ClearScopeInputSchema(): z.ZodObject<
  Properties<ClearScopeInput>
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
    _: z.boolean().nullish(),
  });
}

export function EnablePowerhouseInputSchema(): z.ZodObject<
  Properties<EnablePowerhouseInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function EnableRoutineInputSchema(): z.ZodObject<
  Properties<EnableRoutineInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function PhClintFeaturesSchema(): z.ZodObject<
  Properties<PhClintFeatures>
> {
  return z.object({
    __typename: z.literal("PhClintFeatures").optional(),
    mastra: z.lazy(() => PhClintMastraFeatureSchema()),
    powerhouse: z.lazy(() => PhClintPowerhouseFeatureSchema()),
    routine: z.lazy(() => PhClintRoutineFeatureSchema()),
  });
}

export function PhClintMastraFeatureSchema(): z.ZodObject<
  Properties<PhClintMastraFeature>
> {
  return z.object({
    __typename: z.literal("PhClintMastraFeature").optional(),
    enabled: z.boolean(),
  });
}

export function PhClintPowerhouseFeatureSchema(): z.ZodObject<
  Properties<PhClintPowerhouseFeature>
> {
  return z.object({
    __typename: z.literal("PhClintPowerhouseFeature").optional(),
    connect: z.boolean(),
    enabled: z.boolean(),
    switchboard: z.boolean(),
  });
}

export function PhClintProjectStateSchema(): z.ZodObject<
  Properties<PhClintProjectState>
> {
  return z.object({
    __typename: z.literal("PhClintProjectState").optional(),
    bin: z.string().nullish(),
    description: z.string(),
    features: z.lazy(() => PhClintFeaturesSchema()),
    name: z.string().nullish(),
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

export function SetBinInputSchema(): z.ZodObject<Properties<SetBinInput>> {
  return z.object({
    bin: z.string(),
  });
}

export function SetDescriptionInputSchema(): z.ZodObject<
  Properties<SetDescriptionInput>
> {
  return z.object({
    description: z.string(),
  });
}

export function SetPackageNameInputSchema(): z.ZodObject<
  Properties<SetPackageNameInput>
> {
  return z.object({
    name: z.string(),
  });
}

export function SetPowerhouseConnectInputSchema(): z.ZodObject<
  Properties<SetPowerhouseConnectInput>
> {
  return z.object({
    enabled: z.boolean(),
  });
}

export function SetPowerhouseSwitchboardInputSchema(): z.ZodObject<
  Properties<SetPowerhouseSwitchboardInput>
> {
  return z.object({
    enabled: z.boolean(),
  });
}

export function SetScopeInputSchema(): z.ZodObject<Properties<SetScopeInput>> {
  return z.object({
    scope: z.string(),
  });
}

export function SetVersionInputSchema(): z.ZodObject<
  Properties<SetVersionInput>
> {
  return z.object({
    version: z.string(),
  });
}
